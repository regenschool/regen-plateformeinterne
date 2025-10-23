# 🔍 AUDIT - Système de création et gestion des utilisateurs

**Date:** 2025-01-30  
**Contexte:** Audit complet avant tests E2E Phase 3A de la migration

---

## 📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES

### 1. Tables impliquées

#### `auth.users` (Gérée par Supabase Auth)
- **Primary Key:** `id` (UUID)
- **Données stockées:** email, password (encrypté), metadata (JSONB)
- **⚠️ CRITIQUE:** Table NON accessible via RLS/API standard
- **Accès:** Uniquement via `supabase.auth` JS client OU `supabase.auth.admin` (Service Role)

#### `public.user_roles` (Table de rôles - SÉCURITÉ)
```sql
Colonnes:
- id (PK)
- user_id (FK → auth.users.id) NOT NULL
- role (ENUM: admin|teacher|moderator) NOT NULL
- created_at

Contraintes:
- UNIQUE (user_id, role) ← Un user peut avoir plusieurs rôles
- FK vers auth.users avec ON DELETE CASCADE
```

#### `public.teachers` (Table métier simplifiée)
```sql
Colonnes:
- id (PK UUID)
- user_id (FK → auth.users.id) NOT NULL UNIQUE
- full_name TEXT NOT NULL
- created_at, updated_at

Contraintes:
- UNIQUE sur user_id ← 1 user = 1 entrée max
- PAS de FK définie (BUG potentiel)
```

#### `public.teacher_profiles` (Profil complet enseignant)
```sql
Colonnes:
- id (PK)
- user_id (FK → auth.users.id) NOT NULL UNIQUE
- email TEXT NOT NULL
- full_name TEXT NOT NULL
- first_name, last_name, phone, address, secondary_email
- created_at, updated_at

Contraintes:
- UNIQUE sur user_id
- PAS de FK définie (BUG potentiel)
```

---

## ⚙️ TRIGGERS ACTUELS

### **AUCUN TRIGGER AUTOMATIQUE DÉTECTÉ** ❌

**Problème majeur:** Aucun trigger sur `auth.users` pour créer automatiquement:
- ✗ Entrée dans `teachers`
- ✗ Entrée dans `teacher_profiles`
- ✗ Rôle dans `user_roles`

**Conséquence:** Création manuelle dans chaque flow = incohérences possibles

### Triggers existants (mais inutilisés)
```sql
sync_teacher_role() → Trigger sur teachers INSERT/DELETE
  → Ajoute/supprime role 'teacher' dans user_roles
  → PROBLÈME: Ne s'active QUE si on insère dans teachers

sync_teacher_email() → Trigger sur teachers BEFORE INSERT/UPDATE
  → Synchronise l'email depuis auth.users
  → Bon mécanisme mais incomplet
```

---

## 🔄 FLUX DE CRÉATION ACTUELS

### **Méthode 1: Invitation Admin** (Edge Function `invite-user`)
**Utilisé par:** Settings > Utilisateurs > "Inviter un utilisateur"

```
ÉTAPES:
1. ✅ CREATE auth.users (email_confirm: false)
   └─ user_metadata: { full_name, profile_completed: false, invited_at }

2. ✅ INSERT user_roles (role: admin OU teacher)

3. ✅ IF admin → INSERT user_roles (role: teacher) AUSSI
   └─ Règle métier: "tout admin est aussi teacher"

4. ✅ INSERT teacher_profiles (TOUS les rôles)
   └─ email, full_name, first_name, last_name

5. ✅ INSERT teachers (user_id, full_name)
   └─ TRIGGER sync_teacher_role() s'active
   └─ TRIGGER sync_teacher_email() s'active

6. ✅ Generate magic link (type: "invite")

7. ✅ Send email via Resend
```

**✅ COMPLET - Crée tout ce qui est nécessaire**

---

### **Méthode 2: Import CSV** (`ImportUsersDialog.tsx`)
**Utilisé par:** Settings > Utilisateurs > "Import CSV"

```
ÉTAPES:
1. ✅ CREATE auth.users (email_confirm: true)
   └─ user_metadata: { full_name }

2. ✅ INSERT user_roles (role: admin/teacher/moderator)

3. ⚠️ IF role === "teacher" ONLY:
   └─ INSERT teachers (user_id, full_name, phone)
   └─ TRIGGER sync_teacher_role() s'active

4. ❌ PAS de création dans teacher_profiles
```

**❌ INCOMPLET - Manque teacher_profiles**

---

### **Méthode 3: Signup public** (`Auth.tsx`)
**Utilisé par:** Page /auth > "Créer un compte"

```
ÉTAPES:
1. ✅ CREATE auth.users via supabase.auth.signUp()
   └─ email_confirm: false
   └─ emailRedirectTo défini

2. ❌ AUCUNE création automatique:
   └─ Pas de user_roles
   └─ Pas de teachers
   └─ Pas de teacher_profiles

3. ⚠️ Connexion refuse l'accès:
   └─ Vérifie has_role() → FALSE
   └─ Déconnexion forcée
```

**❌ INUTILISABLE - L'utilisateur créé ne peut pas se connecter**

---

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. **Incohérence des méthodes** (CRITIQUE)
- ✅ Invitation admin = COMPLET
- ⚠️ Import CSV = INCOMPLET (manque teacher_profiles)
- ❌ Signup public = CASSÉ (aucun rôle créé)

### 2. **Pas de trigger automatique** (HAUTE PRIORITÉ)
**Impact:** Si un admin crée un user manuellement via SQL, rien ne se passe

**Solution recommandée:**
```sql
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer teacher_profiles pour TOUS les nouveaux users
  INSERT INTO public.teacher_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_auth_user();
```

### 3. **Confusion user_id vs teacher.id** (MOYEN)
**Problème:** La table `teachers` a :
- `id` (UUID) = ID de la table teachers
- `user_id` (UUID) = Référence à auth.users

**Dans le code:**
- ✅ `assigned_teacher_id` dans `student_enrollments` utilise `user_id` (CORRECT)
- ⚠️ Mais la colonne s'appelle `assigned_teacher_id` → prête à confusion

**Recommandation:** Renommer en `assigned_teacher_user_id` pour clarté

### 4. **Pas de FK réelles sur teachers/teacher_profiles** (BAS)
```sql
-- FK manquantes:
ALTER TABLE teachers 
  ADD CONSTRAINT fk_teachers_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE teacher_profiles 
  ADD CONSTRAINT fk_teacher_profiles_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
```

### 5. **Duplication des données** (BAS - BY DESIGN)
**État actuel:**
```
auth.users
  └─ raw_user_meta_data->>'full_name': "Marie-Sarah Mailliard"

teachers
  └─ full_name: "Marie-Sarah Mailliard"

teacher_profiles
  └─ full_name: "Marie-Sarah Mailliard"
```

**Justification:** Performance - éviter les JOINs sur auth.users
**Risque:** Désynchronisation possible

---

## 📋 RECOMMANDATIONS PAR PRIORITÉ

### 🔴 PRIORITÉ 1 - AVANT TESTS E2E
1. ✅ **Documenter le flow actuel** (CE FICHIER)
2. **Corriger Import CSV:**
   ```typescript
   // Ajouter dans ImportUsersDialog.tsx après création user_roles:
   const { error: profileError } = await supabase
     .from("teacher_profiles")
     .insert([{
       user_id: authData.user.id,
       email: user.email,
       full_name: user.full_name,
     }]);
   ```

3. **Désactiver signup public OU le rendre fonctionnel:**
   - Option A: Retirer le bouton "Créer un compte" (recommandé)
   - Option B: Après signup, créer automatiquement role + teachers + profiles

### 🟡 PRIORITÉ 2 - POST-TESTS
4. **Ajouter trigger automatique** sur `auth.users` INSERT
5. **Ajouter FK explicites** sur teachers et teacher_profiles
6. **Nettoyer les users orphelins:**
   ```sql
   -- Trouver les users sans rôle
   SELECT u.id, u.email 
   FROM auth.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id
   WHERE ur.user_id IS NULL;
   ```

### 🟢 PRIORITÉ 3 - AMÉLIORATIONS
7. Renommer `assigned_teacher_id` → `assigned_teacher_user_id`
8. Ajouter validation email unique dans teacher_profiles
9. Créer une vue `v_users_complete` joignant toutes les infos

---

## ✅ CONFIGURATION PROPRE POUR E2E

### Script SQL pour créer un user E2E complet:
```sql
-- 1. User déjà créé dans auth.users
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', 'Test E2E Admin',
  'email', 'test-e2e@example.com'
)
WHERE email = 'test-e2e@example.com';

-- 2. Rôle admin (déjà existant)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'test-e2e@example.com'
ON CONFLICT DO NOTHING;

-- 3. Rôle teacher (pour accès Directory)
INSERT INTO user_roles (user_id, role)
SELECT id, 'teacher'::app_role FROM auth.users WHERE email = 'test-e2e@example.com'
ON CONFLICT DO NOTHING;

-- 4. Teachers (NÉCESSAIRE pour Directory)
INSERT INTO teachers (user_id, full_name)
SELECT id, 'Test E2E Admin' FROM auth.users WHERE email = 'test-e2e@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- 5. Teacher profiles
INSERT INTO teacher_profiles (user_id, email, full_name)
SELECT id, 'test-e2e@example.com', 'Test E2E Admin' 
FROM auth.users WHERE email = 'test-e2e@example.com'
ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;
```

---

## 🎯 RÉSUMÉ EXÉCUTIF

### État actuel:
- ✅ **Invitation admin:** Fonctionnel et complet
- ⚠️ **Import CSV:** Fonctionnel mais incomplet (manque teacher_profiles)
- ❌ **Signup public:** Cassé (users créés mais inutilisables)
- ❌ **Trigger auto:** Inexistant (création manuelle obligatoire)

### Pour les tests E2E:
- ✅ User test-e2e configuré manuellement avec TOUTES les tables
- ✅ Accès Directory confirmé après ajout dans `teachers`
- ⚠️ Reproductibilité dépend du script manuel (pas de trigger)

### Actions immédiates:
1. Corriger Import CSV (ajouter teacher_profiles)
2. Désactiver signup public (ou le rendre fonctionnel)
3. Lancer tests E2E Phase 3A
4. Post-tests: Ajouter trigger automatique
