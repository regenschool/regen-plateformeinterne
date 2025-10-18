# Configuration GitHub Actions - Guide pas à pas

## 📋 Prérequis
Vous devez avoir accès aux paramètres du repository GitHub.

## Étape 1 : Ajouter les secrets GitHub

1. **Allez sur votre repository GitHub**
   - Ouvrez https://github.com/VOTRE_USERNAME/VOTRE_REPO

2. **Accédez aux paramètres des secrets**
   - Cliquez sur `Settings` (en haut à droite)
   - Dans le menu de gauche, cliquez sur `Secrets and variables` → `Actions`

3. **Ajoutez les 4 secrets suivants** (cliquez sur `New repository secret` pour chacun) :

   **Secret 1 : VITE_SUPABASE_URL**
   - Name: `VITE_SUPABASE_URL`
   - Secret: `https://cynoteapmqcfhzsuurhp.supabase.co`

   **Secret 2 : VITE_SUPABASE_PUBLISHABLE_KEY**
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Secret: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bm90ZWFwbXFjZmh6c3V1cmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTYzMDEsImV4cCI6MjA3NTg3MjMwMX0.hHCFdntfoDbx0FBqLPD3MnpQWR_PryJd52EzB1hFqvc`

   **Secret 3 : TEST_USER_EMAIL**
   - Name: `TEST_USER_EMAIL`
   - Secret: `test-e2e@votre-domaine.com` (choisissez un email de test)

   **Secret 4 : TEST_USER_PASSWORD**
   - Name: `TEST_USER_PASSWORD`
   - Secret: `VotreMotDePasseSecurise123!` (choisissez un mot de passe fort)

## Étape 2 : Créer l'utilisateur de test

1. **Exécutez le workflow de setup**
   - Allez dans l'onglet `Actions` de votre repository GitHub
   - Cliquez sur `Setup Test User` dans la liste des workflows
   - Cliquez sur `Run workflow` → `Run workflow`
   - Attendez que le workflow se termine (environ 30 secondes)

2. **Vérifiez la création**
   - Le workflow devrait afficher "✅ Test user created successfully"

## Étape 3 : Assigner le rôle admin à l'utilisateur de test

Vous devez exécuter cette requête SQL dans votre base de données :

```sql
-- 1. Récupérer l'ID de l'utilisateur de test
SELECT id, email FROM auth.users WHERE email = 'test-e2e@votre-domaine.com';

-- 2. Assigner le rôle admin (remplacez USER_ID par l'ID récupéré ci-dessus)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Étape 4 : Tester le workflow CI

1. **Push un commit sur la branche main**
   ```bash
   git add .
   git commit -m "test: configure GitHub Actions"
   git push
   ```

2. **Vérifiez l'exécution**
   - Allez dans l'onglet `Actions`
   - Cliquez sur le dernier workflow `CI`
   - Vérifiez que tous les jobs passent au vert ✅

## ✅ Checklist de vérification

- [ ] Les 4 secrets sont ajoutés dans GitHub
- [ ] Le workflow "Setup Test User" s'est exécuté avec succès
- [ ] L'utilisateur de test a le rôle admin
- [ ] Le workflow CI passe au vert

## 🔧 Dépannage

**Si le workflow échoue avec "User already registered"**
- C'est normal si vous avez déjà créé l'utilisateur
- Passez directement à l'étape 3

**Si les tests E2E échouent**
- Vérifiez que l'utilisateur de test a bien le rôle admin
- Vérifiez que les secrets sont correctement configurés
- Consultez les logs du workflow pour plus de détails

**Si npm audit échoue**
- Exécutez `npm audit fix` localement
- Committez les changements
- Re-push sur GitHub
