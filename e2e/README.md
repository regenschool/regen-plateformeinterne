# Tests E2E Playwright

## Configuration requise

### Variables d'environnement
Les tests E2E nécessitent ces secrets GitHub :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (pour créer le user de test)
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

### Créer l'utilisateur de test

**Important :** Avant de lancer les tests authentifiés, créez l'utilisateur de test via GitHub Actions :

1. Allez dans **Actions** > **Setup Test User**
2. Cliquez sur **Run workflow**
3. Attendez la fin (crée admin + teacher_profiles + teachers)

Cela crée automatiquement :
- Un utilisateur avec email/password confirmés
- Le rôle `admin` dans `user_roles`
- Une entrée dans `teacher_profiles`
- Une entrée dans `teachers` (trigger de sync)

## Lancer les tests localement

```bash
# Installer Playwright
npx playwright install --with-deps

# Build de l'app
npm run build

# Lancer le serveur preview
npm run preview -- --port=4173

# Dans un autre terminal, lancer les tests
npx playwright test

# Lancer avec UI
npx playwright test --ui

# Lancer un seul fichier
npx playwright test e2e/auth.spec.ts
```

## Structure des tests

- `auth.spec.ts` - Tests d'authentification (sans login)
- `admin.spec.ts` - Tests admin authentifiés (avec login)
- `students.spec.ts` - Tests gestion étudiants
- `grades.spec.ts` - Tests gestion notes
- `security.spec.ts` - Tests sécurité RLS
- `performance.spec.ts` - Tests performance

## Timeouts configurés

- **Test individuel** : 30s
- **Job GitHub CI** : 20 min
- **Step tests E2E** : 10 min
- **Serveur preview** : 3 min

## Tests qui skip automatiquement

Les tests dans `admin.spec.ts > Admin Authenticated Flow` sont **skippés** si `TEST_USER_EMAIL` n'est pas défini.

Cela évite les échecs en local si vous n'avez pas configuré les credentials.

## Debugging

```bash
# Voir les traces
npx playwright show-report

# Mode debug
npx playwright test --debug

# Screenshots
npx playwright test --screenshot=on

# Headed mode (voir le navigateur)
npx playwright test --headed
```

## CI/CD

Les tests tournent automatiquement sur chaque push/PR vers `main`.

**Note :** Ils sont en `continue-on-error: true` donc ne bloquent pas le déploiement en cas d'échec.

## Améliorations apportées

### ✅ Timeouts augmentés
- Tests qui attendent le chargement réseau (`networkidle`)
- Timeouts explicites sur les assertions (10s au lieu de 5s)

### ✅ Sélecteurs robustes
- Utilisation de regex pour les messages d'erreur
- Vérification de la présence d'éléments sans chercher de texte exact

### ✅ Tests authentifiés
- Helper `loginAsAdmin()` dans `admin.spec.ts`
- Skip automatique si pas de credentials
- Tests complets du flow admin

### ✅ Setup utilisateur automatisé
- Workflow GitHub Actions pour créer l'utilisateur de test
- Création complète : user + rôle + profils
- Utilise l'API Admin de Supabase

## 🐛 Troubleshooting

### Tests qui tournent à l'infini
✅ **Résolu** : Timeouts ajoutés sur le job CI (20 min) et les tests E2E (10 min)

### "Navigateur non installé"
```bash
npx playwright install chromium
```

### Tests qui passent en local mais échouent en CI
- Vérifiez que l'utilisateur de test est créé (workflow `Setup Test User`)
- Vérifiez les variables d'environnement dans GitHub Secrets
- Augmentez les timeouts si besoin

### Preview server timeout
Si le build prend trop de temps :
```bash
# Dans playwright.config.ts, augmenter :
webServer: {
  timeout: 300000, // 5 minutes
}
```

## 📚 Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

