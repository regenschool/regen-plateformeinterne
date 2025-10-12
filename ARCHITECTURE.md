# Architecture de l'Application - Regen School

**Date** : 2025-10-12  
**Version** : 2.0 - Architecture Normalisée et Scalable

---

## 🏗️ Vue d'Ensemble

Cette application est construite sur une architecture **normalisée et relationnelle** avec :
- **Frontend** : React + TypeScript + Tailwind CSS
- **Backend** : Lovable Cloud (Supabase)
- **Base de données** : PostgreSQL avec relations normalisées
- **Authentification** : Supabase Auth avec gestion des rôles

---

## 📊 Architecture Base de Données

### Principe Fondamental : Normalisation Complète

Toutes les tables utilisent des **foreign keys (UUID)** au lieu de texte libre :
- `students` → `classes.id`, `levels.id`, `school_years.id`, `teachers.user_id`
- `subjects` → `classes.id`, `academic_periods.id`, `school_years.id`, `teachers.user_id`
- `grades` → `classes.id`, `academic_periods.id`

**Compatibilité ascendante** : Les colonnes `TEXT` originales (`class_name`, `teacher_name`, etc.) sont préservées pour compatibilité.

### Tables Référentielles (Master Data)

#### 1. `school_years` - Années Scolaires
```sql
id: UUID PRIMARY KEY
label: TEXT NOT NULL UNIQUE -- "2024-2025"
start_date: DATE
end_date: DATE
is_active: BOOLEAN DEFAULT FALSE
```

#### 2. `academic_periods` - Périodes Académiques (Semestres)
```sql
id: UUID PRIMARY KEY
label: TEXT NOT NULL -- "Semestre 1", "Semestre 2", "Q1", "Q2"...
school_year_id: UUID REFERENCES school_years(id)
start_date: DATE
end_date: DATE
is_active: BOOLEAN DEFAULT FALSE
```

#### 3. `levels` - Niveaux d'Étude
```sql
id: UUID PRIMARY KEY
name: TEXT NOT NULL UNIQUE -- "B1", "B2", "B3", "M1", "M2"
is_active: BOOLEAN DEFAULT TRUE
```

#### 4. `classes` - Classes
```sql
id: UUID PRIMARY KEY
name: TEXT NOT NULL UNIQUE -- "B3", "IMA", "IMB", "M1A"
level: TEXT -- Niveau associé (peut être NULL)
capacity: INTEGER
is_active: BOOLEAN DEFAULT TRUE
```

**Index** : `idx_classes_name` sur `name` (recherches fréquentes)

#### 5. `teachers` - Enseignants ⚠️ **ARCHITECTURE IMPORTANTE**

**Principe** : Un enseignant = un utilisateur avec le rôle `teacher`

```sql
-- PRIMARY KEY = user_id (pas d'id séparé)
user_id: UUID PRIMARY KEY REFERENCES auth.users(id)
full_name: TEXT NOT NULL
email: TEXT -- Synchronisé AUTO depuis auth.users via trigger
phone: TEXT
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

**Triggers automatiques** :
- `sync_teacher_role()` : Crée automatiquement un `user_role` avec `role = 'teacher'` lors de l'INSERT
- `sync_teacher_email()` : Synchronise l'email depuis `auth.users` avant INSERT/UPDATE

**RLS Policies** :
- `SELECT` : enseignants (role teacher) + admins
- `UPDATE` : enseignant lui-même + admins
- `INSERT/DELETE` : admins uniquement

---

### Tables Transactionnelles

#### 6. `students` - Étudiants
```sql
id: UUID PRIMARY KEY
first_name: TEXT NOT NULL
last_name: TEXT NOT NULL
birth_date: DATE
age: INTEGER (calculé)
photo_url: TEXT
special_needs: TEXT
academic_background: TEXT
company: TEXT

-- Foreign Keys (Normalisé)
class_id: UUID REFERENCES classes(id)
level_id: UUID REFERENCES levels(id)
school_year_id: UUID REFERENCES school_years(id)
assigned_teacher_id: UUID REFERENCES teachers(user_id) ON DELETE SET NULL

-- Compatibilité (ancien TEXT)
class_name: TEXT NOT NULL
teacher_id: UUID -- Déprécié, utiliser assigned_teacher_id
```

**Index** :
- `idx_students_class` sur `class_id`
- `idx_students_level` sur `level_id`
- `idx_students_school_year` sur `school_year_id`

#### 7. `subjects` - Matières
```sql
id: UUID PRIMARY KEY
subject_name: TEXT NOT NULL
teacher_name: TEXT NOT NULL -- Compatibilité
semester: TEXT NOT NULL
school_year: TEXT NOT NULL

-- Foreign Keys (Normalisé)
teacher_fk_id: UUID REFERENCES teachers(user_id) ON DELETE SET NULL
class_fk_id: UUID REFERENCES classes(id)
academic_period_id: UUID REFERENCES academic_periods(id)
school_year_fk_id: UUID REFERENCES school_years(id)

-- Compatibilité
class_name: TEXT NOT NULL
teacher_id: UUID
teacher_email: TEXT
```

**Index** :
- `idx_subjects_teacher` sur `teacher_fk_id`
- `idx_subjects_class` sur `class_fk_id`
- `idx_subjects_period` sur `academic_period_id`
- `idx_subjects_lookup` composite sur `class_name, school_year, semester`

#### 8. `grades` - Notes
```sql
id: UUID PRIMARY KEY
student_id: UUID NOT NULL
subject: TEXT NOT NULL
assessment_name: TEXT
assessment_type: ENUM(participation_individuelle, oral_groupe, oral_individuel, ecrit_groupe, ecrit_individuel, memoire, autre)
assessment_custom_label: TEXT
grade: NUMERIC NOT NULL
max_grade: NUMERIC NOT NULL DEFAULT 20
weighting: NUMERIC NOT NULL DEFAULT 1
appreciation: TEXT
is_absent: BOOLEAN DEFAULT FALSE
teacher_id: UUID NOT NULL
teacher_name: TEXT
school_year: TEXT
semester: TEXT
class_name: TEXT NOT NULL

-- Foreign Keys (Normalisé)
class_fk_id: UUID REFERENCES classes(id)
academic_period_fk_id: UUID REFERENCES academic_periods(id)
```

**Index** :
- `idx_grades_student` sur `student_id`
- `idx_grades_teacher` sur `teacher_id`
- `idx_grades_class` sur `class_fk_id`
- `idx_grades_lookup` composite sur `class_name, subject, school_year, semester`
- `idx_grades_assessment` composite sur `assessment_name, assessment_type`

---

### Vues Enrichies (Performance)

#### `v_students_enriched`
```sql
SELECT 
  s.*,
  c.name as class_name_from_ref,
  c.level as class_level,
  l.name as level_name,
  sy.label as school_year_label,
  t.full_name as assigned_teacher_name,
  t.email as assigned_teacher_email
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN levels l ON s.level_id = l.id
LEFT JOIN school_years sy ON s.school_year_id = sy.id
LEFT JOIN teachers t ON s.assigned_teacher_id = t.user_id
```

**IMPORTANT** : Vue avec `SECURITY INVOKER` pour respecter RLS

#### `v_grades_enriched`
```sql
SELECT 
  g.*,
  s.first_name as student_first_name,
  s.last_name as student_last_name,
  c.name as class_name_from_ref,
  ap.label as academic_period_label,
  sy.label as school_year_from_ref,
  t.full_name as teacher_full_name,
  t.email as teacher_email_from_ref
FROM grades g
LEFT JOIN students s ON g.student_id = s.id
LEFT JOIN classes c ON g.class_fk_id = c.id
LEFT JOIN academic_periods ap ON g.academic_period_fk_id = ap.id
LEFT JOIN school_years sy ON ap.school_year_id = sy.id
LEFT JOIN teachers t ON g.teacher_id = t.user_id
```

---

## 🔐 Gestion des Utilisateurs et Rôles

### Architecture des Rôles

#### Enum `app_role`
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'teacher');
```

#### Table `user_roles`
```sql
id: UUID PRIMARY KEY
user_id: UUID REFERENCES auth.users(id)
role: app_role NOT NULL
UNIQUE(user_id, role)
```

**Fonction de vérification** :
```sql
has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
-- SECURITY DEFINER pour éviter récursion RLS
```

### 🎓 Principe: Enseignant = Utilisateur avec Rôle

**Un enseignant n'est PAS une entité séparée**, c'est :
1. Un utilisateur dans `auth.users`
2. Avec un enregistrement dans `teachers` (extension de profil)
3. Et un rôle `teacher` dans `user_roles`

**Workflow de création** :
```
1. Admin crée un compte utilisateur → auth.users
2. Admin insère dans `teachers` avec user_id
3. Trigger `sync_teacher_role` crée automatiquement le role 'teacher'
4. Trigger `sync_teacher_email` synchronise l'email depuis auth.users
```

**Synchronisation automatique** :
- `INSERT INTO teachers` → Crée `user_roles` avec `role = 'teacher'`
- `DELETE FROM teachers` → Supprime `user_roles` avec `role = 'teacher'`
- Email toujours synchronisé depuis `auth.users`

---

## 🔄 Migrations et Intégrité

### Compatibilité Ascendante

Toutes les anciennes colonnes TEXT sont préservées :
- `students.class_name` (parallèle à `class_id`)
- `subjects.teacher_name` (parallèle à `teacher_fk_id`)
- `grades.class_name` (parallèle à `class_fk_id`)

**Stratégie** :
1. Nouvelles relations utilisent les FK
2. Anciennes colonnes restent pour compatibilité
3. Migration progressive des données

### Triggers de Synchronisation

#### `sync_teacher_role()`
Synchronise automatiquement `teachers` ↔ `user_roles` :
- INSERT teachers → INSERT user_roles (role = 'teacher')
- DELETE teachers → DELETE user_roles (role = 'teacher')

#### `sync_teacher_email()`
Synchronise automatiquement `teachers.email` ← `auth.users.email` :
- Avant INSERT/UPDATE teachers
- Email devient lecture seule dans l'application

---

## 📁 Structure du Code Frontend

### Hooks Personnalisés

#### `useReferentials.ts`
Gestion centralisée des référentiels :
- `useSchoolYears()`, `useAcademicPeriods()`, `useClasses()`, `useLevels()`
- Mutations avec invalidation de cache optimisée

#### `useTeachers.ts` ⚠️ **ARCHITECTURE MISE À JOUR**
Gestion des enseignants-utilisateurs :
```typescript
export type Teacher = {
  user_id: string; // PRIMARY KEY (pas d'id)
  full_name: string;
  email: string | null; // Lecture seule
  phone: string | null;
};

useAddTeacher() // Nécessite user_id existant
useUpdateTeacher() // email en lecture seule
useDeleteTeacher() // Supprime aussi le rôle 'teacher'
syncTeacherFromAuth() // Helper pour premier login
```

#### `useStudents.ts`
Gestion des étudiants avec relations :
```typescript
type Student = {
  id: string;
  class_id: string | null; // FK normalisée
  level_id: string | null;
  school_year_id: string | null;
  assigned_teacher_id: string | null; // FK vers teachers(user_id)
  class_name: string; // Compatibilité
};
```

#### `useGrades.ts`
Gestion des notes avec bug-fix :
```typescript
useAddGrade() // ✅ Check-then-update/insert (pas de onConflict)
```

### Composants Settings

- `SchoolYearsManager` : CRUD années scolaires
- `AcademicPeriodsManager` : CRUD périodes académiques
- `ClassesManager` : CRUD classes
- `LevelsManager` : CRUD niveaux
- `TeachersManager` : CRUD enseignants (utilisateurs avec rôle teacher)
- `SyncReferentialsButton` : Synchronisation manuelle

---

## 🐛 Bugs Historiques (DOCUMENTATION CRITIQUE)

Voir `BUGS_FIXES.md` pour l'historique complet.

### Bug #1 : Duplication des Notes ⚠️ **CRITIQUE**

**Cause** : Utilisation de `.upsert()` avec `onConflict` (non supporté par Supabase)

**Solution** :
```typescript
// ❌ INCORRECT
await supabase.from("grades").upsert(data, { onConflict: '...' });

// ✅ CORRECT
const { data: existing } = await supabase.from('grades')
  .select('id').eq('student_id', id).maybeSingle();

if (existing) {
  await supabase.from('grades').update(data).eq('id', existing.id);
} else {
  await supabase.from('grades').insert([data]);
}
```

**Fichiers concernés** :
- `src/components/GradeEntryDialog.tsx`
- `src/hooks/useGrades.ts` (réintroduit puis re-corrigé le 2025-10-12)

---

## 🧪 Tests de Non-Régression

Voir `TESTS_NON_REGRESSION.md` pour le plan complet.

**Derniers résultats** (2025-10-12) :
- ✅ 12/16 tests validés automatiquement (75%)
- ✅ Bug #1 : ZÉRO doublon détecté
- ✅ Migration FK : 100% des étudiants migrés
- ✅ Vues enrichies : parfaitement synchronisées

---

## 📚 Bonnes Pratiques

### Supabase
- ⚠️ **NE JAMAIS** utiliser `.upsert()` avec `onConflict`
- ✅ Toujours utiliser `.maybeSingle()` pour vérifications
- ✅ Utiliser des FK UUID, pas du texte
- ✅ Créer des index sur les colonnes de jointure

### Enseignants
- ⚠️ Un enseignant = un utilisateur avec rôle 'teacher'
- ✅ Utiliser `teachers.user_id` comme PRIMARY KEY
- ✅ L'email est en lecture seule (sync auto)
- ✅ Les triggers gèrent automatiquement les rôles

### Architecture
- ✅ Normalisation > Dénormalisation
- ✅ Préserver compatibilité ascendante
- ✅ Documenter tous les bugs dans BUGS_FIXES.md
- ✅ Tester avant de merger

---

*Dernière mise à jour : 2025-10-12*
