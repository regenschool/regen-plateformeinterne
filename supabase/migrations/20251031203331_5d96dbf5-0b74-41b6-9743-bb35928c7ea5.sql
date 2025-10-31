-- Phase 4B Étape 5: FK partie 2/3 (retry après UNIQUE sur teachers.id)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_enrollments_program') THEN
    ALTER TABLE student_enrollments ADD CONSTRAINT fk_enrollments_program
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_enrollments_teacher') THEN
    ALTER TABLE student_enrollments ADD CONSTRAINT fk_enrollments_teacher
    FOREIGN KEY (assigned_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_subjects_teacher') THEN
    ALTER TABLE subjects ADD CONSTRAINT fk_subjects_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_subjects_class') THEN
    ALTER TABLE subjects ADD CONSTRAINT fk_subjects_class
    FOREIGN KEY (class_fk_id) REFERENCES classes(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_subjects_school_year') THEN
    ALTER TABLE subjects ADD CONSTRAINT fk_subjects_school_year
    FOREIGN KEY (school_year_fk_id) REFERENCES school_years(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_subjects_academic_period') THEN
    ALTER TABLE subjects ADD CONSTRAINT fk_subjects_academic_period
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id) ON DELETE SET NULL;
  END IF;
END $$;