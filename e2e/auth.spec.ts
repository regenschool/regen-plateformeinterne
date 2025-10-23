import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page with role selection', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Vérifier la présence des boutons de sélection de rôle
    await expect(page.getByRole('button', { name: /Direction/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Enseignant/i })).toBeVisible({ timeout: 10000 });
    
    // Sélectionner le rôle admin
    await page.getByRole('button', { name: /Direction/i }).click();
    
    // Maintenant les champs de connexion devraient être visibles
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Sélectionner un rôle d'abord
    await page.getByRole('button', { name: /Direction/i }).click();
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });

    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Devrait afficher un message d'erreur ou rester sur la page auth
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*auth/);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Sélectionner un rôle d'abord
    await page.getByRole('button', { name: /Direction/i }).click();
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // Vérifier la validation HTML5
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should require password field', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Sélectionner un rôle d'abord
    await page.getByRole('button', { name: /Direction/i }).click();
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });

    await page.fill('input[type="email"]', 'test@example.com');

    const passwordInput = page.locator('input[type="password"]');
    const isRequired = await passwordInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBe(true);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForLoadState('networkidle');
    
    // Devrait rediriger vers /auth
    await expect(page).toHaveURL(/.*auth/, { timeout: 10000 });
  });

  test('should redirect to auth from grades page', async ({ page }) => {
    await page.goto('/grades');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth/, { timeout: 10000 });
  });

  test('should redirect to auth from settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth/, { timeout: 10000 });
  });
});
