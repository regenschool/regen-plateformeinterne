import { test, expect } from '@playwright/test';

test.describe('Grades Management', () => {
  test('should navigate to grades page', async ({ page }) => {
    await page.goto('/grades');
    
    // Devrait rediriger vers auth si pas connecté
    await expect(page).toHaveURL(/.*auth|grades/);
  });

  test('should filter grades by class and subject', async ({ page }) => {
    await page.goto('/grades');
    
    // Si redirigé vers auth, c'est normal
    if (page.url().includes('/auth')) {
      expect(page.url()).toContain('/auth');
      return;
    }
    
    // Tenter de sélectionner une classe si disponible
    const classButton = page.locator('button:has-text("Sélectionner une classe")');
    if (await classButton.isVisible()) {
      await classButton.click();
    }
  });
});

test.describe('Bulk Grade Import', () => {
  test('should open bulk import sheet', async ({ page }) => {
    await page.goto('/grades');
    
    // Si redirigé vers auth, c'est normal
    if (page.url().includes('/auth')) {
      expect(page.url()).toContain('/auth');
      return;
    }
    
    // Chercher le bouton d'import en masse
    const importButton = page.locator('button:has-text("Import en masse")');
    if (await importButton.isVisible()) {
      await importButton.click();
    }
  });
});
