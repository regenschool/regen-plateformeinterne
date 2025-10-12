import { test, expect } from '@playwright/test';

// Helper pour se connecter (à adapter avec vos vraies credentials de test)
async function login(page: any) {
  await page.goto('/auth');
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
  await page.click('button[type="submit"]');
  await page.waitForURL('/directory');
}

test.describe('Student Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    // Note: Commenter cette ligne si vous n'avez pas de compte de test
    // await login(page);
  });

  test.skip('should navigate to directory page', async ({ page }) => {
    await page.goto('/directory');
    
    await expect(page.locator('h1')).toContainText('Annuaire');
    await expect(page.locator('text=Écosystème Apprenant')).toBeVisible();
  });

  test.skip('should filter students by class', async ({ page }) => {
    await page.goto('/directory');
    
    // Attendre que les étudiants se chargent
    await page.waitForSelector('[data-testid="student-card"]', { timeout: 5000 });
    
    // Sélectionner une classe
    await page.click('button:has-text("Toutes les classes")');
    await page.click('text=B3'); // Adapter selon vos classes
    
    // Vérifier que le filtre est appliqué
    await expect(page.locator('button:has-text("B3")')).toBeVisible();
  });

  test.skip('should open add student dialog', async ({ page }) => {
    await page.goto('/directory');
    
    // Cliquer sur "Ajouter un étudiant"
    await page.click('button:has-text("Ajouter un étudiant")');
    
    // Vérifier que le dialog s'ouvre
    await expect(page.locator('text=Nouvel Étudiant')).toBeVisible();
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
  });
});

test.describe('Import Flow', () => {
  test.skip('should open import dialog', async ({ page }) => {
    await page.goto('/directory');
    
    await page.click('button:has-text("Import Excel")');
    
    await expect(page.locator('text=Import rapide depuis Excel')).toBeVisible();
  });
});
