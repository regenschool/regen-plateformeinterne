-- ============================================================================
-- PHASE 4A COMPLETE: CLEANUP FINAL DES COLONNES REDONDANTES
-- ============================================================================
-- Cette migration nettoie définitivement toutes les colonnes dénormalisées
-- après adaptation complète du code TypeScript.

-- ✅ Table GRADES : Suppression complète des colonnes redondantes
-- Seul subject_id (FK) est conservé
ALTER TABLE public.grades 
  DROP COLUMN IF EXISTS subject CASCADE,
  DROP COLUMN IF EXISTS class_name CASCADE,
  DROP COLUMN IF EXISTS school_year CASCADE,
  DROP COLUMN IF EXISTS semester CASCADE,
  DROP COLUMN IF EXISTS teacher_name CASCADE;

-- ✅ Table ASSESSMENTS : Suppression complète des colonnes redondantes
ALTER TABLE public.assessments
  DROP COLUMN IF EXISTS subject CASCADE,
  DROP COLUMN IF EXISTS class_name CASCADE,
  DROP COLUMN IF EXISTS school_year CASCADE,
  DROP COLUMN IF EXISTS semester CASCADE,
  DROP COLUMN IF EXISTS teacher_name CASCADE;

-- ✅ Table SUBJECTS : Suppression complète des colonnes dénormalisées
-- Seules les FK (class_fk_id, school_year_fk_id, academic_period_id) sont conservées
ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS class_name CASCADE,
  DROP COLUMN IF EXISTS school_year CASCADE,
  DROP COLUMN IF EXISTS semester CASCADE,
  DROP COLUMN IF EXISTS teacher_name CASCADE,
  DROP COLUMN IF EXISTS teacher_email CASCADE;

-- ✅ Table SUBJECT_WEIGHTS : Suppression complète des colonnes dénormalisées
-- Seul subject_id (FK) est conservé
ALTER TABLE public.subject_weights
  DROP COLUMN IF EXISTS class_name CASCADE,
  DROP COLUMN IF EXISTS school_year CASCADE,
  DROP COLUMN IF EXISTS semester CASCADE;

-- ============================================================================
-- RÉSULTAT FINAL :
-- ============================================================================
-- ✅ grades : subject_id uniquement
-- ✅ assessments : subject_id uniquement
-- ✅ subjects : class_fk_id, school_year_fk_id, academic_period_id uniquement
-- ✅ subject_weights : subject_id uniquement
-- 
-- ✨ Architecture 100% normalisée
-- ✨ Performance optimale (index sur FK)
-- ✨ Intégrité référentielle complète
-- ✨ Zéro dette technique
-- ============================================================================