import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth');
    
    // Attendre le chargement complet
    await page.waitForLoadState('networkidle');
    
    // Vérifier la présence des champs de connexion
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Attendre un message d'erreur (texte peut varier)
    await page.waitForTimeout(2000);
    const hasError = await page.locator('[role="alert"], .text-destructive, text=/erreur|invalid|incorrect/i').count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
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
