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

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Le navigateur devrait bloquer la soumission
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
  });

  test('should require password field', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Le champ password est requis
    await expect(page.locator('input[type="password"]:invalid')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/directory');
    
    // Devrait rediriger vers /auth
    await expect(page).toHaveURL(/.*auth/);
  });

  test('should redirect to auth from grades page', async ({ page }) => {
    await page.goto('/grades');
    await expect(page).toHaveURL(/.*auth/);
  });

  test('should redirect to auth from settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*auth/);
  });
});
