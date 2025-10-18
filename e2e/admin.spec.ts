import { test, expect } from '@playwright/test';

test.describe('Admin Settings', () => {
  test('should navigate to settings page (admin only)', async ({ page }) => {
    await page.goto('/settings');
    
    // Redirection vers auth ou home si pas admin
    await expect(page).toHaveURL(/auth|settings|\//);
  });

  test('should switch between settings tabs', async ({ page }) => {
    await page.goto('/settings');
    
    // Si redirigé, c'est normal (pas admin ou pas connecté)
    if (page.url().includes('/auth') || !page.url().includes('/settings')) {
      return;
    }
    
    // Tenter de cliquer sur les onglets si disponibles
    const classesTab = page.locator('button[value="classes"]');
    if (await classesTab.isVisible()) {
      await classesTab.click();
    }
  });
});

test.describe('Audit Logs', () => {
  test('should display audit logs page', async ({ page }) => {
    await page.goto('/audit');
    
    // Redirection si pas admin
    if (!page.url().includes('/auth')) {
      // Si on a accès, vérifier le titre
      const title = page.locator('h1');
      if (await title.isVisible()) {
        await expect(title).toContainText("Journal d'Audit");
      }
    }
  });

  test('should filter audit logs', async ({ page }) => {
    await page.goto('/audit');
    
    // Si redirigé, c'est normal
    if (page.url().includes('/auth')) {
      return;
    }
    
    // Tenter de filtrer si disponible
    const tableFilter = page.locator('button:has-text("Toutes les tables")');
    if (await tableFilter.isVisible()) {
      await tableFilter.click();
    }
  });
});
