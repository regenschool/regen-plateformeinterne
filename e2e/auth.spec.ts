import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Attendre le message d'erreur
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 5000 });
  });

  // Note: Pour tester le login réussi, il faudrait soit :
  // 1. Créer un compte de test dans beforeAll
  // 2. Utiliser un compte de test existant
  // 3. Mocker l'API Supabase
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/directory');
    
    // Devrait rediriger vers /auth
    await expect(page).toHaveURL(/.*auth/);
  });
});
