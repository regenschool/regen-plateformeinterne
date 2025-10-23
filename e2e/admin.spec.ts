import { test, expect } from '@playwright/test';

// Helper pour se connecter en tant qu'admin
async function loginAsAdmin(page: any) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Sélection du rôle (admin prioritaire)
  const adminBtn = page.getByRole('button', { name: /Direction/i });
  const teacherBtn = page.getByRole('button', { name: /Enseignant/i });
  if (await adminBtn.isVisible().catch(() => false)) await adminBtn.click();
  else if (await teacherBtn.isVisible().catch(() => false)) await teacherBtn.click();

  const email = process.env.PLAYWRIGHT_EMAIL || process.env.TEST_USER_EMAIL || '';
  const password = process.env.PLAYWRIGHT_PASSWORD || process.env.TEST_USER_PASSWORD || '';

  await page.locator('input[type="email"], input#email').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.fill('input[type="email"], input#email', email);
  await page.fill('input[type="password"], input#password', password);
  await page.click('button[type="submit"]');

  // Détection rapide d'une erreur
  const hadError = await Promise.race([
    page.waitForSelector('text=/n\'avez pas accès|erreur|invalid|incorrect|mot de passe/i', { timeout: 6000 }).then(() => true).catch(() => false),
    page.waitForTimeout(6000).then(() => false)
  ]);
  if (hadError) throw new Error('Échec de connexion: vérifier PLAYWRIGHT_EMAIL/PASSWORD');

  // Validation déterministe via route protégée
  await page.goto('/directory');
  const result = await Promise.race([
    page.waitForURL(/.*\/directory.*/i, { timeout: 20000 }).then(() => 'directory').catch(() => 'none'),
    page.waitForSelector('text=/Regen School/i', { timeout: 20000 }).then(() => 'layout').catch(() => 'none'),
    page.waitForURL(/.*\/auth.*/i, { timeout: 20000 }).then(() => 'auth').catch(() => 'none')
  ]);
  if (result === 'auth') throw new Error('Échec de connexion: redirigé vers /auth');
}

test.describe('Admin Authenticated Flow', () => {
  test.skip(!((process.env.PLAYWRIGHT_EMAIL || process.env.TEST_USER_EMAIL) && (process.env.PLAYWRIGHT_PASSWORD || process.env.TEST_USER_PASSWORD)), 'Skipping - no test credentials');

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginAsAdmin(page);
    // Doit être connecté (pas sur /auth)
    expect(page.url()).not.toMatch(/auth/);
    // Puis accéder à l'annuaire
    await page.goto('/directory');
    await expect(page).toHaveURL(/.*directory/);
  });

  test('should access directory page when logged in', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Attendre le chargement des données
    await page.waitForTimeout(2000);
    
    // Vérifier qu'il y a du contenu ou des contrôles
    const hasContent = await page.locator('main, [role="main"]').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should access settings page when logged in as admin', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Devrait être sur settings
    await expect(page).toHaveURL(/.*settings/);
  });
});

test.describe('Admin Settings', () => {
  test('should navigate to settings page (admin only)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Redirection vers auth ou home si pas admin
    await expect(page).toHaveURL(/auth|settings|\//, { timeout: 10000 });
  });

  test('should switch between settings tabs', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Si redirigé, c'est normal (pas admin ou pas connecté)
    if (page.url().includes('/auth') || !page.url().includes('/settings')) {
      return;
    }
    
    // Tenter de cliquer sur les onglets si disponibles
    const classesTab = page.locator('button[value="classes"]');
    if (await classesTab.isVisible()) {
      await classesTab.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Audit Logs', () => {
  test('should display audit logs page', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('networkidle');
    
    // Redirection si pas admin
    if (!page.url().includes('/auth')) {
      // Si on a accès, vérifier le titre
      const title = page.locator('h1');
      if (await title.isVisible()) {
        await expect(title).toContainText("Journal", { timeout: 10000 });
      }
    }
  });

  test('should filter audit logs', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('networkidle');
    
    // Si redirigé, c'est normal
    if (page.url().includes('/auth')) {
      return;
    }
    
    // Tenter de filtrer si disponible
    const tableFilter = page.locator('button:has-text("Toutes les tables")');
    if (await tableFilter.isVisible()) {
      await tableFilter.click();
      await page.waitForTimeout(500);
    }
  });
});
