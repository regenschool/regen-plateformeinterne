# Guide de Qualité - Tests & Documentation

## 🧪 Tests E2E avec Playwright

### Installation & Configuration

Les tests E2E sont configurés avec Playwright pour tester les parcours utilisateur complets.

```bash
# Installer les navigateurs Playwright
npx playwright install

# Lancer les tests
npm run test:e2e

# Lancer les tests en mode UI
npx playwright test --ui

# Générer un rapport
npx playwright show-report
```

### Structure des Tests

```
e2e/
├── auth.spec.ts          # Tests d'authentification
├── students.spec.ts      # Tests de gestion des étudiants
├── grades.spec.ts        # Tests de saisie de notes
└── admin.spec.ts         # Tests des fonctionnalités admin
```

### Écrire un Nouveau Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ma Fonctionnalité', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    
    await expect(page.locator('h1')).toContainText('My Title');
    await page.click('button:has-text("Click me")');
    
    // Assertions...
  });
});
```

### Bonnes Pratiques

1. **Tests Isolés** : Chaque test doit être indépendant
2. **Données de Test** : Utiliser des fixtures ou des comptes de test
3. **Sélecteurs Robustes** : Préférer `data-testid` aux sélecteurs CSS fragiles
4. **Timeouts** : Ajuster les timeouts pour les opérations lentes
5. **Captures d'Écran** : Automatiques en cas d'échec

### Configuration pour CI/CD

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
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 📚 Storybook - Catalogue de Composants

### Démarrer Storybook

```bash
# Lancer Storybook en développement
npm run storybook

# Construire Storybook pour production
npm run build-storybook
```

Storybook sera accessible sur `http://localhost:6006`

### Structure des Stories

Chaque composant peut avoir un fichier `.stories.tsx` :

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    prop1: 'value1',
  },
};

export const Variant: Story = {
  args: {
    prop1: 'value2',
    prop2: true,
  },
};
```

### Avantages de Storybook

- ✅ **Développement isolé** : Tester les composants sans dépendances
- ✅ **Documentation vivante** : Générer automatiquement la doc
- ✅ **Tests visuels** : Vérifier le rendu dans différents états
- ✅ **Accessibilité** : Tester les composants avec l'addon a11y
- ✅ **Responsive** : Tester les breakpoints

### Addons Recommandés

- `@storybook/addon-essentials` : Controls, Actions, Docs
- `@storybook/addon-a11y` : Tests d'accessibilité
- `@storybook/addon-links` : Navigation entre stories
- `@storybook/addon-interactions` : Tests interactifs

## 📊 Monitoring & Web Vitals

### Core Web Vitals

Les métriques suivantes sont surveillées automatiquement :

- **LCP** (Largest Contentful Paint) : < 2.5s
- **FID** (First Input Delay) : < 100ms
- **CLS** (Cumulative Layout Shift) : < 0.1
- **FCP** (First Contentful Paint) : < 1.8s
- **TTFB** (Time to First Byte) : < 600ms

### Initialisation

Le monitoring est activé automatiquement au démarrage de l'app :

```typescript
// Dans main.tsx
import { initWebVitals } from '@/lib/reportWebVitals';

initWebVitals();
```

### Consulter les Métriques

En **développement** : Les métriques sont loguées dans la console

En **production** : Les métriques sont envoyées à `/api/analytics`

### Seuils de Performance

| Métrique | Bon | À Améliorer | Mauvais |
|----------|-----|-------------|---------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |

### Actions d'Amélioration

#### Si LCP est élevé :
- Optimiser les images (WebP, compression, lazy loading)
- Réduire la taille du bundle JavaScript
- Utiliser un CDN pour les assets statiques

#### Si FID est élevé :
- Réduire le JavaScript bloquant
- Code splitting agressif
- Defer des scripts non critiques

#### Si CLS est élevé :
- Spécifier les dimensions des images
- Éviter l'injection dynamique de contenu
- Pré-allouer l'espace pour les ads/embeds

## 📖 Documentation API

### Documenter une Edge Function

Créer un fichier `openapi.yaml` :

```yaml
openapi: 3.0.0
info:
  title: Regen School API
  version: 1.0.0
paths:
  /functions/v1/my-function:
    post:
      summary: Description de la fonction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                param1:
                  type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
```

### Swagger UI

Vous pouvez servir la doc API avec Swagger UI :

```bash
npm install swagger-ui-react
```

## ✅ Checklist Qualité

### Avant chaque Release

- [ ] Tous les tests E2E passent
- [ ] Les Core Web Vitals sont dans le vert
- [ ] Storybook build sans erreur
- [ ] Pas de warning dans la console
- [ ] Tests d'accessibilité (a11y) passent
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse score > 90
- [ ] Documentation à jour

### Code Review

- [ ] Code propre et commenté
- [ ] Pas de console.log oubliés
- [ ] Gestion d'erreur complète
- [ ] Types TypeScript stricts
- [ ] Tests unitaires ajoutés
- [ ] Stories créées pour nouveaux composants

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Quality Checks
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      
      # Tests unitaires
      - run: npm run test
      
      # Tests E2E
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      # Build Storybook
      - run: npm run build-storybook
      
      # Lighthouse CI
      - run: npm install -g @lhci/cli
      - run: lhci autorun
```

## 📈 Métriques de Qualité

### Objectifs

- **Couverture de tests** : > 80%
- **Bundle size** : < 500KB (gzipped)
- **Lighthouse Performance** : > 90
- **Lighthouse Accessibility** : > 95
- **Lighthouse Best Practices** : > 95
- **Lighthouse SEO** : > 90

### Outils de Mesure

- **Vitest** : Tests unitaires + coverage
- **Playwright** : Tests E2E
- **Lighthouse CI** : Performance audits
- **Web Vitals** : Métriques utilisateur
- **Bundle Analyzer** : Analyse de bundle

## 🔗 Ressources

- [Playwright Documentation](https://playwright.dev/)
- [Storybook Documentation](https://storybook.js.org/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
