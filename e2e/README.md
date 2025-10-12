# Tests E2E - Guide de Configuration

## ⚠️ Avant de Lancer les Tests

Les tests E2E nécessitent un compte utilisateur de test pour fonctionner correctement.

### 1. Créer un Compte de Test

Créez un compte dans votre application Supabase :

```bash
# Via l'interface Supabase ou votre app
Email: test@regen-school.com
Password: TestPassword123!
```

### 2. Configurer les Variables d'Environnement

Créez un fichier `.env.test` à la racine :

```bash
TEST_USER_EMAIL=test@regen-school.com
TEST_USER_PASSWORD=TestPassword123!
```

### 3. Lancer les Tests

```bash
# Installer les navigateurs Playwright (première fois)
npx playwright install

# Lancer tous les tests
npx playwright test

# Lancer en mode UI (interactif)
npx playwright test --ui

# Lancer un fichier spécifique
npx playwright test e2e/auth.spec.ts

# Lancer avec un navigateur spécifique
npx playwright test --project=chromium

# Générer le rapport
npx playwright show-report
```

## 📝 État Actuel des Tests

### ✅ Tests Fonctionnels
- `auth.spec.ts` : Tests d'authentification (page de login, erreurs)

### ⏸️ Tests Skip (Nécessitent Authentication)
- `students.spec.ts` : Gestion des étudiants (navigation, filtres, dialogs)
- `grades.spec.ts` : Saisie de notes (filtres, import en masse)
- `admin.spec.ts` : Fonctionnalités admin (settings, audit logs)

Les tests marqués `.skip()` ne s'exécutent pas automatiquement. Pour les activer :

1. Créez un compte de test
2. Configurez `.env.test`
3. Décommentez les appels à `login()` dans les tests
4. Retirez les `.skip()`

## 🔧 Personnalisation

### Ajouter un Nouveau Test

```typescript
import { test, expect } from '@playwright/test';

test('my new test', async ({ page }) => {
  await page.goto('/my-page');
  
  // Vos assertions...
  await expect(page.locator('h1')).toContainText('My Title');
});
```

### Sélecteurs Recommandés

```typescript
// ✅ Bon - data-testid
await page.click('[data-testid="add-student-btn"]');

// ✅ Bon - text content
await page.click('button:has-text("Ajouter")');

// ⚠️ Éviter - sélecteurs CSS fragiles
await page.click('.btn-primary-123');
```

### Timeouts

```typescript
// Augmenter le timeout pour une opération lente
await expect(page.locator('[data-testid="results"]'))
  .toBeVisible({ timeout: 10000 });
```

## 📊 Rapport de Tests

Après l'exécution, un rapport HTML est généré automatiquement :

```bash
npx playwright show-report
```

Le rapport inclut :
- ✅ Tests passés/échoués
- 📸 Captures d'écran (en cas d'échec)
- 🎬 Traces vidéo
- ⏱️ Durée d'exécution

## 🚀 CI/CD

Pour intégrer dans GitHub Actions :

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - run: npx playwright test
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 Troubleshooting

### "Navigateur non installé"
```bash
npx playwright install chromium
```

### "Timeout lors du lancement du serveur"
Vérifiez que le port 5173 est libre :
```bash
lsof -i :5173
```

### Tests qui passent en local mais échouent en CI
- Augmentez les timeouts
- Vérifiez les variables d'environnement
- Assurez-vous que la base de test est accessible

## 📚 Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
