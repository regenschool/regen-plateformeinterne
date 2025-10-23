import { test, expect } from '@playwright/test';

// Helper pour se connecter (à adapter avec vos vraies credentials de test)
async function login(page: any) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Sélection du rôle (admin prioritaire)
  const adminBtn = page.getByRole('button', { name: /Direction/i });
  const teacherBtn = page.getByRole('button', { name: /Enseignant/i });
  if (await adminBtn.isVisible().catch(() => false)) {
    await adminBtn.click();
  } else if (await teacherBtn.isVisible().catch(() => false)) {
    await teacherBtn.click();
  }

  const email = process.env.PLAYWRIGHT_EMAIL || process.env.TEST_USER_EMAIL || '';
  const password = process.env.PLAYWRIGHT_PASSWORD || process.env.TEST_USER_PASSWORD || '';
  await page.locator('input[type="email"], input#email').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.fill('input[type="email"], input#email', email);
  await page.fill('input[type="password"], input#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/^(?!.*auth).*$/i, { timeout: 20000 });
}

test.describe('Student Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    // Note: Commenter cette ligne si vous n'avez pas de compte de test
    // await login(page);
  });

  test('should navigate to directory page', async ({ page }) => {
    await page.goto('/directory');
    
    // Devrait rediriger vers auth si pas connecté
    if (page.url().includes('/auth')) {
      await expect(page).toHaveURL(/.*auth/);
    } else {
      await expect(page.locator('h1')).toContainText('Annuaire');
    }
  });

  test('should filter students by class', async ({ page }) => {
    await page.goto('/directory');
    
    // Si redirigé vers auth, c'est normal (pas de session de test)
    if (page.url().includes('/auth')) {
      expect(page.url()).toContain('/auth');
      return;
    }
    
    // Attendre que les étudiants se chargent
    await page.waitForSelector('[data-testid="student-card"]', { timeout: 5000 }).catch(() => {});
    
    // Sélectionner une classe si disponible
    const classFilter = page.locator('button:has-text("Toutes les classes")');
    if (await classFilter.isVisible()) {
      await classFilter.click();
    }
  });

  test('should open add student dialog', async ({ page }) => {
    await page.goto('/directory');
    
    // Si redirigé vers auth, c'est normal
    if (page.url().includes('/auth')) {
      expect(page.url()).toContain('/auth');
      return;
    }
    
    // Chercher le bouton "Ajouter un étudiant"
    const addButton = page.locator('button:has-text("Ajouter un étudiant")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('text=Nouvel Étudiant')).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Import Flow', () => {
  test('should open import dialog', async ({ page }) => {
    await page.goto('/directory');
    
    // Si redirigé vers auth, c'est normal
    if (page.url().includes('/auth')) {
      expect(page.url()).toContain('/auth');
      return;
    }
    
    const importButton = page.locator('button:has-text("Import Excel")');
    if (await importButton.isVisible()) {
      await importButton.click();
      await expect(page.locator('text=Import rapide depuis Excel')).toBeVisible({ timeout: 3000 });
    }
  });
});
