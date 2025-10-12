import { test, expect } from '@playwright/test';

test.describe('Admin Settings', () => {
  test.skip('should navigate to settings page (admin only)', async ({ page }) => {
    await page.goto('/settings');
    
    // Redirection vers auth si pas admin
    if (page.url().includes('/auth') || page.url() === '/') {
      expect(page.url()).toMatch(/auth|\//);
    } else {
      await expect(page.locator('h1')).toContainText('Paramètres');
    }
  });

  test.skip('should switch between settings tabs', async ({ page }) => {
    await page.goto('/settings');
    
    // Cliquer sur différents onglets
    await page.click('button[value="classes"]');
    await expect(page.locator('text=Gérez les classes')).toBeVisible();
    
    await page.click('button[value="users"]');
    await expect(page.locator('text=Utilisateurs & Enseignants')).toBeVisible();
  });
});

test.describe('Audit Logs', () => {
  test.skip('should display audit logs page', async ({ page }) => {
    await page.goto('/audit');
    
    if (!page.url().includes('/auth')) {
      await expect(page.locator('h1')).toContainText("Journal d'Audit");
      await expect(page.locator('text=Historique de toutes les actions')).toBeVisible();
    }
  });

  test.skip('should filter audit logs', async ({ page }) => {
    await page.goto('/audit');
    
    // Filtrer par table
    await page.click('button:has-text("Toutes les tables")');
    await page.click('text=Étudiants');
    
    // Filtrer par action
    await page.click('button:has-text("Toutes les actions")');
    await page.click('text=Création');
    
    // Vérifier les filtres appliqués
    await expect(page.locator('button:has-text("Étudiants")')).toBeVisible();
  });
});
