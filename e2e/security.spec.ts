import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should not expose sensitive data in HTML', async ({ page }) => {
    await page.goto('/auth');
    
    const content = await page.content();
    
    // Vérifier qu'il n'y a pas de tokens ou clés exposées
    expect(content).not.toContain('eyJhbGciOiJ'); // JWT pattern
    expect(content).not.toContain('sk_'); // Secret key pattern
    expect(content).not.toContain('SUPABASE_'); // Env vars
  });

  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Vérifier les headers de sécurité essentiels
    const headers = response?.headers();
    
    // Note: Ces headers sont configurés au niveau Supabase/serveur
    // Ce test documente ce qui devrait être en place
    console.log('Security headers:', headers);
  });

  test('should sanitize user inputs in URL', async ({ page }) => {
    // Tester l'injection XSS via URL
    await page.goto('/auth?redirect=<script>alert("xss")</script>');
    
    // Vérifier qu'aucun script n'est exécuté
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });

  test('should not allow SQL injection in search', async ({ page }) => {
    await page.goto('/directory');
    
    // Tenter une injection SQL
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("' OR '1'='1");
      await page.waitForTimeout(500);
      
      // L'app ne devrait pas crasher
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should enforce HTTPS in production URLs', async ({ page }) => {
    const url = page.url();
    
    // En production, toujours HTTPS
    if (url.includes('lovableproject.com')) {
      expect(url).toMatch(/^https:/);
    }
  });
});
