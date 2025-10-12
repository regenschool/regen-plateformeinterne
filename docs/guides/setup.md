# Guide de Démarrage - Regen School

## Prérequis

- Node.js 20+
- npm ou bun
- Compte Supabase (via Lovable Cloud - déjà configuré)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier les variables d'environnement
# (déjà configurées via Lovable Cloud)

# 3. Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Scripts Disponibles

```bash
# Développement
npm run dev              # Démarre le serveur de dev avec hot-reload

# Build
npm run build           # Build de production
npm run build:dev       # Build de développement (avec sourcemaps)
npm run preview         # Preview du build

# Tests
npm run test            # Lance les tests en mode watch
npm run test:unit       # Lance les tests une fois
npm run test:ui         # Interface graphique des tests
npm run test:coverage   # Génère le rapport de couverture

# Qualité du code
npm run lint            # ESLint
npm run type-check      # TypeScript type checking
```

## Configuration

### Variables d'Environnement

Créer un fichier `.env` (déjà fait via Lovable) :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=votre_clé_publique
VITE_SENTRY_DSN=votre_dsn_sentry (optionnel en dev)
```

### Sentry (Error Tracking)

Pour activer Sentry en production :

1. Créer un compte sur [sentry.io](https://sentry.io)
2. Créer un projet React
3. Copier le DSN
4. Ajouter `VITE_SENTRY_DSN` dans vos variables d'environnement

**Note**: Sentry est désactivé automatiquement en développement.

## Base de Données

### Migrations

Les migrations Supabase sont gérées automatiquement via Lovable Cloud.

Pour voir le schéma :
- Consultez `docs/architecture/database-schema.md`
- Ou accédez au dashboard Supabase via Lovable

### Seed Data (Données de test)

Pour importer des données de test :

1. Aller sur `/directory`
2. Cliquer sur "Importer CSV"
3. Utiliser le fichier template ou vos propres données

## Tests

### Lancer les Tests

```bash
# Mode watch (recommandé en dev)
npm run test

# Une fois
npm run test:unit

# Avec UI
npm run test:ui

# Avec couverture
npm run test:coverage
```

### Structure des Tests

```
src/
  lib/
    utils.test.ts         # Tests des utilitaires
    validation.test.ts    # Tests de validation Zod
  test/
    setup.ts             # Configuration Vitest
    utils.tsx            # Test utilities
    mockData.ts          # Données mock
```

## Développement

### Architecture

Consultez `docs/architecture/system-design.md` pour :
- Vue d'ensemble du système
- Patterns utilisés
- Conventions de code

### Workflow Git

```bash
# 1. Créer une branche
git checkout -b feature/ma-fonctionnalite

# 2. Faire vos modifications dans Lovable
# Les changements se synchronisent automatiquement

# 3. Push et créer une PR
git push origin feature/ma-fonctionnalite
```

### CI/CD

GitHub Actions se déclenche automatiquement sur :
- Push sur `main` → Tests + Deploy staging
- Tags `v*` → Deploy production

## Déploiement

### Staging

Auto-déployé à chaque push sur `main` via Lovable.

### Production

1. Créer un tag :
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Le deploy se fait automatiquement via GitHub Actions

## Dépannage

### L'application ne démarre pas

```bash
# 1. Nettoyer node_modules
rm -rf node_modules package-lock.json
npm install

# 2. Vérifier les variables d'environnement
cat .env

# 3. Redémarrer
npm run dev
```

### Les tests échouent

```bash
# Vérifier la configuration Vitest
cat vitest.config.ts

# Lancer en mode verbose
npm run test -- --reporter=verbose
```

### Erreurs Supabase

1. Vérifier que vous êtes connecté :
   - Aller sur `/auth`
   - Se connecter avec vos identifiants

2. Vérifier les RLS policies :
   - Consultez la documentation Supabase via Lovable

## Support

- Documentation : `/docs`
- GitHub Issues : [Lien vers votre repo]
- Discord : [Si applicable]

## Ressources

- [Documentation Lovable](https://docs.lovable.dev)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React Query](https://tanstack.com/query/latest)
- [Documentation Tailwind](https://tailwindcss.com/docs)
