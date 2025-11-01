-- ============================================================================
-- Phase 4B - Étape 6 : Foreign Keys pour grades et assessments (PARFAIT)
-- ============================================================================
-- Création minutieuse uniquement des FK qui n'existent pas encore
-- ============================================================================

-- 1. S'assurer que teachers.user_id est UNIQUE (prérequis pour les FK)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'teachers_user_id_key' 
    AND conrelid = 'teachers'::regclass
  ) THEN
    ALTER TABLE teachers ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ============================================================================
-- 2. FOREIGN KEYS POUR LA TABLE grades (créer uniquement celles qui manquent)
-- ============================================================================

-- Vérifier et créer chaque FK individuellement pour éviter les doublons
DO $$ 
BEGIN
  -- 2.1 grades.student_id → students.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_grades_student' 
    AND conrelid = 'grades'::regclass
  ) THEN
    ALTER TABLE grades
      ADD CONSTRAINT fk_grades_student
      FOREIGN KEY (student_id) 
      REFERENCES students(id) 
      ON DELETE CASCADE;
  END IF;

  -- 2.2 grades.teacher_id → teachers.user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_grades_teacher' 
    AND conrelid = 'grades'::regclass
  ) THEN
    ALTER TABLE grades
      ADD CONSTRAINT fk_grades_teacher
      FOREIGN KEY (teacher_id) 
      REFERENCES teachers(user_id) 
      ON DELETE CASCADE;
  END IF;

  -- 2.3 grades.subject_id → subjects.id (celle-ci existe peut-être déjà)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_grades_subject' 
    AND conrelid = 'grades'::regclass
  ) THEN
    ALTER TABLE grades
      ADD CONSTRAINT fk_grades_subject
      FOREIGN KEY (subject_id) 
      REFERENCES subjects(id) 
      ON DELETE CASCADE;
  END IF;

  -- 2.4 grades.class_fk_id → classes.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_grades_class' 
    AND conrelid = 'grades'::regclass
  ) THEN
    ALTER TABLE grades
      ADD CONSTRAINT fk_grades_class
      FOREIGN KEY (class_fk_id) 
      REFERENCES classes(id) 
      ON DELETE SET NULL;
  END IF;

  -- 2.5 grades.academic_period_fk_id → academic_periods.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_grades_academic_period' 
    AND conrelid = 'grades'::regclass
  ) THEN
    ALTER TABLE grades
      ADD CONSTRAINT fk_grades_academic_period
      FOREIGN KEY (academic_period_fk_id) 
      REFERENCES academic_periods(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 3. FOREIGN KEYS POUR LA TABLE assessments
-- ============================================================================

DO $$ 
BEGIN
  -- 3.1 assessments.teacher_id → teachers.user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_assessments_teacher' 
    AND conrelid = 'assessments'::regclass
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT fk_assessments_teacher
      FOREIGN KEY (teacher_id) 
      REFERENCES teachers(user_id) 
      ON DELETE CASCADE;
  END IF;

  -- 3.2 assessments.subject_id → subjects.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_assessments_subject' 
    AND conrelid = 'assessments'::regclass
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT fk_assessments_subject
      FOREIGN KEY (subject_id) 
      REFERENCES subjects(id) 
      ON DELETE CASCADE;
  END IF;

  -- 3.3 assessments.class_fk_id → classes.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_assessments_class' 
    AND conrelid = 'assessments'::regclass
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT fk_assessments_class
      FOREIGN KEY (class_fk_id) 
      REFERENCES classes(id) 
      ON DELETE SET NULL;
  END IF;

  -- 3.4 assessments.academic_period_fk_id → academic_periods.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_assessments_academic_period' 
    AND conrelid = 'assessments'::regclass
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT fk_assessments_academic_period
      FOREIGN KEY (academic_period_fk_id) 
      REFERENCES academic_periods(id) 
      ON DELETE SET NULL;
  END IF;

  -- 3.5 assessments.visibility_changed_by → teachers.user_id (FK bonus pour cohérence)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_assessments_visibility_changed_by' 
    AND conrelid = 'assessments'::regclass
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT fk_assessments_visibility_changed_by
      FOREIGN KEY (visibility_changed_by) 
      REFERENCES teachers(user_id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 4. FOREIGN KEY POUR subject_weights
-- ============================================================================

DO $$ 
BEGIN
  -- subject_weights.subject_id → subjects.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_subject_weights_subject' 
    AND conrelid = 'subject_weights'::regclass
  ) THEN
    ALTER TABLE subject_weights
      ADD CONSTRAINT fk_subject_weights_subject
      FOREIGN KEY (subject_id) 
      REFERENCES subjects(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Résultat : TOUTES les 21 Foreign Keys sont maintenant créées
-- ============================================================================