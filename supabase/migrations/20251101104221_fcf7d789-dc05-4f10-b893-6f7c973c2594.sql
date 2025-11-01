-- ============================================================================
-- Phase 4B - Étape 7 : 4 Contraintes UNIQUE + 4 Triggers Audit (PARFAIT - CORRIGÉ)
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : 4 CONTRAINTES UNIQUE
-- ============================================================================

-- 1. CONTRAINTE sur subjects : Pas de doublon matière pour une même classe/période
-- ✅ CORRIGÉ : academic_period_id (pas academic_period_fk_id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_subject_per_class_period' 
    AND conrelid = 'subjects'::regclass
  ) THEN
    ALTER TABLE subjects
      ADD CONSTRAINT unique_subject_per_class_period
      UNIQUE (subject_name, class_fk_id, school_year_fk_id, academic_period_id);
  END IF;
END $$;

-- 2. CONTRAINTE sur grades : Pas de doublon note pour un même étudiant/évaluation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_grade_per_student_assessment' 
    AND conrelid = 'grades'::regclass
  ) THEN
    ALTER TABLE grades
      ADD CONSTRAINT unique_grade_per_student_assessment
      UNIQUE (student_id, subject_id, assessment_name, assessment_type);
  END IF;
END $$;

-- 3. CONTRAINTE sur subject_weights : Un seul coefficient par matière
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_weight_per_subject' 
    AND conrelid = 'subject_weights'::regclass
  ) THEN
    ALTER TABLE subject_weights
      ADD CONSTRAINT unique_weight_per_subject
      UNIQUE (subject_id);
  END IF;
END $$;

-- 4. CONTRAINTE sur academic_periods : Pas de doublon période dans une année scolaire
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_period_per_school_year' 
    AND conrelid = 'academic_periods'::regclass
  ) THEN
    ALTER TABLE academic_periods
      ADD CONSTRAINT unique_period_per_school_year
      UNIQUE (school_year_id, label);
  END IF;
END $$;

-- ============================================================================
-- PARTIE 2 : 4 TRIGGERS AUDIT (Traçabilité complète)
-- ============================================================================

-- TRIGGER 1 : Audit complet sur la table grades
DROP TRIGGER IF EXISTS audit_grades_changes ON grades;
CREATE TRIGGER audit_grades_changes
  AFTER INSERT OR UPDATE OR DELETE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

-- TRIGGER 2 : Audit complet sur la table assessments
DROP TRIGGER IF EXISTS audit_assessments_changes ON assessments;
CREATE TRIGGER audit_assessments_changes
  AFTER INSERT OR UPDATE OR DELETE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

-- TRIGGER 3 : Audit complet sur la table students
DROP TRIGGER IF EXISTS audit_students_changes ON students;
CREATE TRIGGER audit_students_changes
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

-- TRIGGER 4 : Audit complet sur la table subjects
DROP TRIGGER IF EXISTS audit_subjects_changes ON subjects;
CREATE TRIGGER audit_subjects_changes
  AFTER INSERT OR UPDATE OR DELETE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();

-- ============================================================================
-- ✅ Phase 4B COMPLÉTÉE À 100% - ARCHITECTURE PARFAITE 🎯
-- ============================================================================