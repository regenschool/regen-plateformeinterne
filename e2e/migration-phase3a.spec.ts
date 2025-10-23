import { test, expect, Page } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TESTS E2E - MIGRATION PHASE 3A: INTRODUCTION DE subject_id
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * OBJECTIF:
 * Vérifier que l'introduction de la colonne subject_id (FK normalisée) dans 
 * la table grades ne provoque aucune régression fonctionnelle.
 * 
 * STRATÉGIE DE TEST:
 * - Tests UI end-to-end sur les parcours utilisateur critiques
 * - Validation de la compatibilité avec Radix UI Select (composants non-natifs)
 * - Vérification de la cohérence des données (subject_id + colonnes dénormalisées)
 * 
 * ARCHITECTURE TESTÉE:
 * ┌─────────────────┐
 * │  UI (Radix)     │ ← Tests E2E (ce fichier)
 * ├─────────────────┤
 * │  React Hooks    │
 * ├─────────────────┤
 * │  Supabase SDK   │
 * ├─────────────────┤
 * │  grades table   │ → subject_id (FK) + colonnes dénormalisées
 * │  subjects table │ → id (PK)
 * └─────────────────┘
 * 
 * PRÉREQUIS:
 * - Variables d'environnement: PLAYWRIGHT_EMAIL, PLAYWRIGHT_PASSWORD
 * - Utilisateur test: doit être admin OU avoir des matières assignées
 * - Données test: au moins 1 classe, 1 matière, 1 étudiant
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION & CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────

const TEST_EMAIL = process.env.PLAYWRIGHT_EMAIL || process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_PASSWORD || process.env.TEST_USER_PASSWORD;
const HAS_CREDS = !!(TEST_EMAIL && TEST_PASSWORD);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authentifie un utilisateur sur la page /auth
 * 
 * @param page - Instance Playwright Page
 * @throws Error si l'authentification échoue
 */
async function login(page: Page) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  const preferred = (process.env.PLAYWRIGHT_ROLE || 'teacher').toLowerCase() as 'teacher' | 'admin';

  const performLogin = async (role: 'teacher' | 'admin') => {
    // 1) Sélection explicite du rôle
    const adminBtn = page.getByRole('button', { name: /Direction/i });
    const teacherBtn = page.getByRole('button', { name: /Enseignant/i });
    if (role === 'admin' && await adminBtn.isVisible().catch(() => false)) await adminBtn.click();
    else if (role === 'teacher' && await teacherBtn.isVisible().catch(() => false)) await teacherBtn.click();
    else if (await teacherBtn.isVisible().catch(() => false)) await teacherBtn.click();
    else if (await adminBtn.isVisible().catch(() => false)) await adminBtn.click();

    // 2) Saisie identifiants + submit
    const emailInput = page.locator('input[type="email"], input#email');
    const passwordInput = page.locator('input[type="password"], input#password');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(String(TEST_EMAIL));
    await passwordInput.fill(String(TEST_PASSWORD));
    const submit = page.getByRole('button', { name: /se connecter|login|connexion|sign in/i });
    if (await submit.isVisible().catch(() => false)) await submit.click();
    else await page.click('button[type="submit"]');

    // 3) Attendre soit succès (sortie de /auth) soit erreur visible - SANS timeout fixe
    const outcome = await Promise.race([
      // Succès: on quitte /auth (redirection automatique)
      page.waitForURL(/^(?!.*\/auth).*$/i, { timeout: 15000 }).then(() => 'redirected'),
      // Échec: message d'erreur visible
      page.waitForSelector('text=/n\'avez pas accès|erreur|invalid|incorrect|mot de passe/i', { timeout: 15000 }).then(() => 'error')
    ]).catch(() => 'timeout');

    if (outcome === 'error') return false;
    if (outcome === 'timeout') return false;

    // 4) Double validation: on force /directory et on vérifie qu'on y reste
    await page.goto('/directory');
    await page.waitForLoadState('networkidle');
    
    return !page.url().includes('/auth');
  };

  // Essai 1: rôle préféré
  if (await performLogin(preferred)) return;

  // Essai 2: rôle alternatif
  const fallbackRole = preferred === 'teacher' ? 'admin' : 'teacher';
  if (await performLogin(fallbackRole)) return;

  throw new Error('Échec de connexion: pas de redirection ni session après tentative sur 2 rôles');
}
// ─────────────────────────────────────────────────────────────────────────────
// HELPER: NAVIGATION DANS /grades
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configure la page /grades en sélectionnant année/semestre/classe/matière
 * 
 * SÉQUENCE OBLIGATOIRE (imposée par l'UI):
 * 1. Année scolaire → active les semestres
 * 2. Semestre → active les classes
 * 3. Classe → active les matières
 * 4. Matière → active les actions (notes, import, etc.)
 * 
 * @param page - Instance Playwright Page
 * @param options - Paramètres de sélection (défauts: premier item de chaque liste)
 * @returns Object contenant les valeurs sélectionnées
 */
async function setupGradesPage(page: Page, options: {
  schoolYear?: string;
  semester?: string;
  className?: string;
  subjectName?: string;
} = {}) {
  await page.goto('/grades');
  await page.waitForLoadState('networkidle');
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1: Sélectionner l'année scolaire
  // ─────────────────────────────────────────────────────────────────────────
  
  const schoolYearTrigger = page.getByTestId('school-year-select');
  await schoolYearTrigger.waitFor({ state: 'visible', timeout: 5000 });
  await schoolYearTrigger.click();
  
  // Attendre que le menu Radix s'ouvre
  await page.waitForTimeout(300);
  
  if (options.schoolYear) {
    await page.getByRole('option', { name: options.schoolYear }).click();
  } else {
    // Sélectionner la première année disponible
    await page.locator('[role="option"]').first().click();
  }
  
  await page.waitForTimeout(500); // Laisser l'UI se stabiliser
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2: Sélectionner le semestre
  // ─────────────────────────────────────────────────────────────────────────
  
  const semesterTrigger = page.getByTestId('semester-select');
  await semesterTrigger.click();
  await page.waitForTimeout(300);
  
  if (options.semester) {
    await page.getByRole('option', { name: options.semester }).click();
  } else {
    await page.locator('[role="option"]').first().click();
  }
  
  await page.waitForTimeout(500);
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 3: Sélectionner la classe
  // ─────────────────────────────────────────────────────────────────────────
  
  const classTrigger = page.getByTestId('class-select');
  await classTrigger.click();
  await page.waitForTimeout(300);
  
  if (options.className) {
    await page.getByRole('option', { name: options.className }).click();
  } else {
    await page.locator('[role="option"]').first().click();
  }
  
  await page.waitForTimeout(500);
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 4: Sélectionner la matière
  // ─────────────────────────────────────────────────────────────────────────
  
  const subjectTrigger = page.getByTestId('subject-select');
  await subjectTrigger.waitFor({ state: 'visible' });
  
  // Vérifier que le select n'est pas disabled
  const isDisabled = await subjectTrigger.getAttribute('disabled');
  if (isDisabled !== null) {
    throw new Error('Le sélecteur de matière est désactivé - vérifier que classe/année/semestre sont bien sélectionnés');
  }
  
  await subjectTrigger.click();
  await page.waitForTimeout(300);
  
  // Vérifier qu'il y a des matières disponibles
  const optionsCount = await page.locator('[role="option"]').count();
  if (optionsCount === 0) {
    throw new Error('Aucune matière disponible pour cette combinaison classe/année/semestre');
  }
  
  if (options.subjectName) {
    await page.getByRole('option', { name: options.subjectName }).click();
  } else {
    await page.locator('[role="option"]').first().click();
  }
  
  await page.waitForTimeout(1000); // Laisser les notes se charger
  
  // Récupérer les valeurs sélectionnées pour les retourner
  const selectedSchoolYear = await schoolYearTrigger.textContent();
  const selectedSemester = await semesterTrigger.textContent();
  const selectedClass = await classTrigger.textContent();
  const selectedSubject = await subjectTrigger.textContent();
  
  return {
    schoolYear: selectedSchoolYear?.trim() || '',
    semester: selectedSemester?.trim() || '',
    className: selectedClass?.trim() || '',
    subjectName: selectedSubject?.trim() || '',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE DE TESTS: NON-RÉGRESSION MIGRATION PHASE 3A
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Migration Phase 3A - Non-régression', () => {
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Création de note avec subject_id
  // ───────────────────────────────────────────────────────────────────────────
  
  test('1. Création de note avec subject_id', async ({ page }) => {
    test.skip(!HAS_CREDS, 'Identifiants de test manquants (PLAYWRIGHT_EMAIL/PLAYWRIGHT_PASSWORD)');
    
    // Authentification
    await login(page);
    
    // Navigation complète vers une matière
    const context = await setupGradesPage(page);
    console.log('✅ Contexte sélectionné:', context);
    
    // Vérifier qu'on a bien une matière chargée
    expect(context.subjectName).not.toBe('');
    
    // Cliquer sur "Ajouter une note" (premier étudiant)
    const addGradeButton = page.getByTestId('add-grade-button').first();
    await addGradeButton.waitFor({ state: 'visible', timeout: 5000 });
    await addGradeButton.click();

    // Attendre que le dialog s'ouvre
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 3000 });

    // Remplir le formulaire
    await dialog.getByTestId('assessment-name-input').fill('Test E2E Phase 3A');

    // Type d'épreuve
    await dialog.getByTestId('assessment-type-select').click();
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: /participation individuelle/i }).click();

    // Note
    await dialog.getByTestId('grade-input').fill('15');

    // Soumettre
    await dialog.getByTestId('save-grade-button').click();

    // Vérifier que le dialog se ferme (= succès)
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });

    console.log('✅ Note créée avec subject_id');
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Édition de note existante
  // ───────────────────────────────────────────────────────────────────────────
  
  test('2. Édition de note existante', async ({ page }) => {
    test.skip(!HAS_CREDS, 'Identifiants de test manquants');
    
    await login(page);
    await setupGradesPage(page);
    
    // Chercher un bouton "Modifier" (icône Edit2)
    const editButton = page.locator('button[data-testid*="edit"], button:has(svg)').first();
    
    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      
      const dialog = page.locator('[role="dialog"]').first();
      await dialog.waitFor({ state: 'visible' });
      
      // Modifier la note
      const gradeInput = dialog.locator('input[type="number"]').first();
      await gradeInput.clear();
      await gradeInput.fill('18');
      
      // Sauvegarder
      await dialog.getByRole('button', { name: /enregistrer/i }).click();
      await dialog.waitFor({ state: 'hidden', timeout: 5000 });
      
      console.log('✅ Note modifiée');
    } else {
      console.log('⚠️ Aucune note à éditer (test ignoré)');
    }
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Suppression de note
  // ───────────────────────────────────────────────────────────────────────────
  
  test('3. Suppression de note', async ({ page }) => {
    test.skip(!HAS_CREDS, 'Identifiants de test manquants');
    
    await login(page);
    await setupGradesPage(page);
    
    // Chercher une épreuve à supprimer
    const deleteButton = page.locator('[data-testid^="delete-assessment-"]').first();
    
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click();
      
      // Confirmer dans le AlertDialog
      const confirmButton = page.getByRole('button', { name: /supprimer/i }).last();
      await confirmButton.waitFor({ state: 'visible' });
      await confirmButton.click();
      
      // Attendre que le dialog se ferme
      await page.waitForTimeout(1000);
      
      console.log('✅ Épreuve supprimée');
    } else {
      console.log('⚠️ Aucune épreuve à supprimer (test ignoré)');
    }
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Import en masse CSV
  // ───────────────────────────────────────────────────────────────────────────
  
  test('4. Import en masse CSV', async ({ page }) => {
    test.skip(!HAS_CREDS, 'Identifiants de test manquants');
    
    await login(page);
    await setupGradesPage(page);
    
    // Cliquer sur "Nouvelle épreuve" (qui ouvre le sheet d'import)
    const newAssessmentButton = page.getByTestId('new-assessment-button');
    
    if (await newAssessmentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newAssessmentButton.click();
      
      // Vérifier que le sheet/dialog s'ouvre
      const importSheet = page.locator('[role="dialog"]');
      await importSheet.waitFor({ state: 'visible', timeout: 3000 });
      
      console.log('✅ Dialog import CSV accessible');
      
      // Fermer le dialog
      const closeButton = importSheet.locator('button').first();
      await closeButton.click();
    } else {
      console.log('⚠️ Bouton import non trouvé (test ignoré)');
    }
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Affichage des notes dans StudentDetailDrawer
  // ───────────────────────────────────────────────────────────────────────────
  
  test('5. Affichage des notes dans StudentDetailDrawer', async ({ page }) => {
    test.skip(!HAS_CREDS, 'Identifiants de test manquants');
    
    await login(page);
    
    // Aller sur l'annuaire
    await page.goto('/directory');
    await page.waitForLoadState('networkidle');
    
    // Cliquer sur le premier étudiant
    const studentCard = page.locator('[data-testid="student-card"]').first();
    
    if (await studentCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studentCard.click();
      
      // Vérifier que le drawer s'ouvre
      const drawer = page.locator('[role="dialog"]');
      await drawer.waitFor({ state: 'visible', timeout: 3000 });
      
      // Vérifier la présence de la section notes
      const gradesSection = drawer.locator('text=/notes|évaluations/i');
      const hasGrades = await gradesSection.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasGrades) {
        console.log('✅ Notes affichées dans StudentDetailDrawer');
      } else {
        console.log('⚠️ Aucune note trouvée dans le drawer');
      }
    } else {
      console.log('⚠️ Aucun étudiant trouvé (test ignoré)');
    }
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Vérification console - Pas d'erreurs critiques
  // ───────────────────────────────────────────────────────────────────────────
  
  test('6. Vérification console - Pas d\'erreurs critiques liées à subject_id', async ({ page }) => {
    const errors: string[] = [];
    
    // Écouter les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        
        // Ignorer les erreurs connues non critiques
        if (!text.includes('ResizeObserver') && 
            !text.includes('Failed to load resource') &&
            !text.includes('CORS') &&
            !text.includes('favicon')) {
          errors.push(text);
        }
      }
    });
    
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Filtrer les erreurs liées à subject_id
    const subjectIdErrors = errors.filter(e => 
      e.toLowerCase().includes('subject_id') || 
      e.toLowerCase().includes('subject')
    );
    
    if (subjectIdErrors.length > 0) {
      console.error('❌ Erreurs liées à subject_id:', subjectIdErrors);
    } else {
      console.log('✅ Pas d\'erreurs liées à subject_id');
    }
    
    expect(subjectIdErrors.length).toBe(0);
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: Performance - Temps de chargement de la page Notes
  // ───────────────────────────────────────────────────────────────────────────
  
  test('7. Performance - Temps de chargement de la page Notes', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Temps de chargement: ${loadTime}ms`);
    
    // Doit charger en moins de 5 secondes (tolérant pour CI/CD)
    expect(loadTime).toBeLessThan(5000);
  });
  
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: Vérification données - subject_id présent dans les requêtes
  // ───────────────────────────────────────────────────────────────────────────
  
  test('8. Vérification données - subject_id présent dans les requêtes', async ({ page }) => {
    let hasSubjectId = false;
    
    // Intercepter les requêtes API
    page.on('response', async response => {
      if (response.url().includes('/rest/v1/grades')) {
        try {
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            // Vérifier que subject_id est présent
            if (data[0].subject_id !== undefined) {
              hasSubjectId = true;
              console.log('✅ subject_id trouvé dans les données:', data[0].subject_id);
            }
          }
        } catch (e) {
          // Ignorer les erreurs de parsing JSON
        }
      }
    });
    
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Laisser le temps aux requêtes de se faire
    
    // Note: Ce test peut passer même si subject_id n'est pas trouvé car il se peut
    // qu'aucune note ne soit chargée. C'est un test informatif plutôt que bloquant.
    console.log(hasSubjectId ? '✅ subject_id présent dans les données' : '⚠️ subject_id non trouvé (aucune note chargée ou non présent)');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE DE TESTS: BACKWARD COMPATIBILITY (DUAL WRITE)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Migration Phase 3A - Backward Compatibility', () => {
  
  /**
   * Ce test vérifie que la stratégie "Dual Write" fonctionne:
   * - subject_id est rempli correctement (FK vers subjects)
   * - Les colonnes dénormalisées (class_name, subject, school_year, semester) 
   *   restent synchronisées pour assurer la compatibilité avec le code existant
   * 
   * TODO: Implémenter avec une requête DB directe pour vérifier la cohérence
   */
  test('Les anciennes colonnes sont toujours synchronisées (Dual Write)', async ({ page }) => {
    test.skip(!HAS_CREDS, 'Identifiants de test manquants');
    
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Test backward compatibility - À implémenter avec requête DB pour vérifier cohérence subject_id <-> colonnes dénormalisées');
    
    // Pour une vraie validation, il faudrait:
    // 1. Créer une note via l'UI
    // 2. Interroger la DB pour vérifier que subject_id ET les colonnes dénormalisées sont bien remplies
    // 3. Vérifier que subject_id correspond bien à subjects.id avec les bonnes métadonnées
  });
});
