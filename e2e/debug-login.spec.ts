import { test } from '@playwright/test';

const TEST_EMAIL = 'test-e2e@example.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_PASSWORD;

test('Debug login step by step', async ({ page }) => {
  console.log('🔍 DEBUT DU TEST DEBUG');
  
  console.log('📍 Étape 1: Navigation vers /auth?e2e=1');
  await page.goto('/auth?e2e=1');
  await page.waitForLoadState('domcontentloaded');
  console.log(`✅ Page chargée: ${page.url()}`);
  
  console.log('📍 Étape 2: Sélection du rôle admin');
  const roleBtn = page.getByTestId('role-admin');
  if (await roleBtn.isVisible()) {
    await roleBtn.click();
    console.log('✅ Rôle admin sélectionné');
  } else {
    console.log('❌ Bouton role-admin introuvable');
  }
  
  console.log('📍 Étape 3: Vérification du mode');
  const submitBtn = page.getByTestId('submit-auth');
  const submitText = await submitBtn.textContent() || '';
  console.log(`📝 Texte du bouton submit: "${submitText}"`);
  
  if (submitText.toLowerCase().includes('créer le compte')) {
    console.log('🔄 Mode signup détecté, passage en mode login');
    const toggle = page.getByTestId('toggle-signup');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(500);
      const newSubmitText = await submitBtn.textContent() || '';
      console.log(`📝 Nouveau texte du bouton: "${newSubmitText}"`);
    }
  }
  
  console.log('📍 Étape 4: Remplissage des champs');
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  
  await emailInput.fill(TEST_EMAIL);
  await passwordInput.fill(TEST_PASSWORD || '');
  console.log(`📧 Email rempli: ${TEST_EMAIL}`);
  console.log(`🔑 Password rempli: ${(TEST_PASSWORD || '').length} caractères`);
  
  console.log('📍 Étape 5: Click sur submit');
  await submitBtn.click();
  console.log('✅ Click effectué');
  
  await page.waitForTimeout(3000);
  console.log(`📍 Après 3s, URL: ${page.url()}`);
  
  const bodyText = await page.textContent('body') || '';
  console.log(`📄 Contenu de la page (200 premiers chars): ${bodyText.substring(0, 200)}`);
  
  const errorTexts = ['n\'avez pas accès', 'erreur', 'invalid', 'incorrect', 'mot de passe'];
  for (const errorText of errorTexts) {
    const hasError = bodyText.toLowerCase().includes(errorText.toLowerCase());
    console.log(`🔍 Contient "${errorText}": ${hasError}`);
  }
  
  console.log('🏁 FIN DU TEST DEBUG');
});
