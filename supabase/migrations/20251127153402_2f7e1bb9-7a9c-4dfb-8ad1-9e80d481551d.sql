
-- Supprimer les FKs dupliquées auto-générées (garder les nommées explicitement)
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_teacher_fk_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_class_fk_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_school_year_fk_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_academic_period_id_fkey;
