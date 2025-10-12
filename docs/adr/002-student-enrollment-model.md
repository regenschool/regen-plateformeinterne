# ADR 002: Modèle Étudiant avec Enrollments Séparés

## Statut
Accepté

## Contexte
Nous devons gérer des étudiants sur plusieurs années scolaires. Deux approches possibles :

### Option A: Données dénormalisées
```sql
CREATE TABLE students (
  id UUID,
  first_name TEXT,
  class_name_2024 TEXT,
  class_name_2025 TEXT,
  company_2024 TEXT,
  company_2025 TEXT,
  ...
);
```

### Option B: Table séparée des inscriptions
```sql
CREATE TABLE students (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  photo_url TEXT
);

CREATE TABLE student_enrollments (
  id UUID,
  student_id UUID,
  school_year_id UUID,
  class_id UUID,
  class_name TEXT,
  company TEXT,
  academic_background TEXT
);
```

## Décision
Nous avons choisi **Option B** : table séparée `student_enrollments`.

## Raisons

### Pour Option B
- ✅ **Scalable**: Ajout d'années scolaires sans modifier le schéma
- ✅ **Normalisé**: Pas de duplication de données
- ✅ **Historique**: Toutes les inscriptions passées conservées
- ✅ **Flexible**: Données différentes par année (classe, entreprise, etc.)
- ✅ **Queries simples**: Join standard pour récupérer les données

### Contre Option A
- ❌ **Pas scalable**: Nouvelle colonne par année
- ❌ **Duplication**: Données répétées pour chaque année
- ❌ **Migrations complexes**: Ajout d'années = alter table
- ❌ **Queries complexes**: Logique conditionnelle lourde

## Implémentation

### Tables
```sql
-- Données permanentes de l'étudiant
CREATE TABLE students (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  photo_url TEXT,
  special_needs TEXT
);

-- Inscription par année
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  school_year_id UUID REFERENCES school_years(id),
  class_id UUID REFERENCES classes(id),
  class_name TEXT,
  company TEXT,
  academic_background TEXT,
  UNIQUE(student_id, school_year_id)
);
```

### Vue Enrichie
Pour simplifier les queries :

```sql
CREATE VIEW v_student_enrollments_enriched AS
SELECT 
  e.*,
  s.first_name,
  s.last_name,
  s.birth_date,
  s.age,
  s.photo_url,
  s.special_needs,
  c.name as class_name_from_ref,
  c.level as class_level,
  sy.label as school_year_label,
  sy.is_active as school_year_is_active
FROM student_enrollments e
JOIN students s ON e.student_id = s.id
LEFT JOIN classes c ON e.class_id = c.id
LEFT JOIN school_years sy ON e.school_year_id = sy.id;
```

### Import CSV
L'import crée automatiquement :
1. Étudiant dans `students` (si n'existe pas)
2. Inscription dans `student_enrollments` pour l'année choisie

Contrainte unique empêche les doublons :
```sql
UNIQUE(student_id, school_year_id)
```

## Conséquences

### Positives
- Ajout illimité d'années scolaires sans migration
- Historique complet des parcours étudiants
- Requêtes optimisées via la vue enrichie
- Import rapide (upsert sur contrainte unique)

### Négatives
- Join nécessaire pour récupérer données complètes (mitigé : vue)
- Complexité légèrement supérieure pour les développeurs

### Migration
- ✅ Données existantes migr ées depuis `students` vers `student_enrollments`
- ✅ Pas de perte de données
- ✅ Compatible avec code existant via vues

## Références
- [Database Schema](../architecture/database-schema.md)
- [Migration 001](../../supabase/migrations/)

## Date
2025-10-12
