import { test, expect } from '@playwright/test';

test.describe('Grades Management', () => {
  test.skip('should navigate to grades page', async ({ page }) => {
    await page.goto('/grades');
    
    // Devrait rediriger vers auth si pas connecté
    if (page.url().includes('/auth')) {
      expect(page.url()).toContain('/auth');
    } else {
      await expect(page.locator('h1')).toContainText('Notes');
    }
  });

  test.skip('should filter grades by class and subject', async ({ page }) => {
    await page.goto('/grades');
    
    // Sélectionner classe
    await page.click('button:has-text("Sélectionner une classe")');
    await page.click('text=B3');
    
    // Sélectionner matière
    await page.click('button:has-text("Sélectionner une matière")');
    await page.click('text=Mathématiques');
    
    // Vérifier que les filtres sont appliqués
    await expect(page.locator('button:has-text("B3")')).toBeVisible();
    await expect(page.locator('button:has-text("Mathématiques")')).toBeVisible();
  });
});

test.describe('Bulk Grade Import', () => {
  test.skip('should open bulk import sheet', async ({ page }) => {
    await page.goto('/grades');
    
    // Après avoir sélectionné classe et matière
    await page.click('button:has-text("Import en masse")');
    
    await expect(page.locator('text=Import en masse')).toBeVisible();
  });
});
