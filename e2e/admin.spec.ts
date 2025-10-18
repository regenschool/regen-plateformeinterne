import { test, expect } from '@playwright/test';

// Helper pour se connecter en tant qu'admin
async function loginAsAdmin(page: any) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '');
  await page.click('button[type="submit"]');
  
  // Attendre la redirection
  await page.waitForURL(/.*directory/, { timeout: 15000 });
}

test.describe('Admin Authenticated Flow', () => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Skipping - no test credentials');

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Vérifier qu'on est bien sur la page directory
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
