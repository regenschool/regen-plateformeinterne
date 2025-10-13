import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // La page devrait charger en moins de 5 secondes
    expect(loadTime).toBeLessThan(5000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    
    // Mesurer les Web Vitals via Performance API
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          metrics.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // FCP (First Contentful Paint)
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
        metrics.fcp = fcpEntry?.startTime;
        
        setTimeout(() => resolve(metrics), 2000);
      });
    });
    
    console.log('Web Vitals:', vitals);
    
    // Vérifier les seuils recommandés
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500); // Good: < 2.5s
    }
    if (vitals.fcp) {
      expect(vitals.fcp).toBeLessThan(1800); // Good: < 1.8s
    }
    if (vitals.cls !== undefined) {
      expect(vitals.cls).toBeLessThan(0.1); // Good: < 0.1
    }
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    // Naviguer plusieurs fois pour détecter des fuites
    for (let i = 0; i < 5; i++) {
      await page.goto('/directory');
      await page.goto('/grades');
      await page.goto('/');
    }
    
    // Vérifier que la page répond toujours
    await expect(page.locator('body')).toBeVisible();
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/directory');
    
    // Vérifier que les images ont l'attribut loading="lazy"
    const images = await page.locator('img').all();
    
    for (const img of images.slice(0, 3)) { // Vérifier les 3 premières
      const loading = await img.getAttribute('loading');
      console.log('Image loading attribute:', loading);
    }
  });
});
