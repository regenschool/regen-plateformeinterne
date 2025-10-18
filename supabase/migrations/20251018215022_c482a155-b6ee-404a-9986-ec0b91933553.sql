-- Corriger la fonction: ne pas mettre à jour la colonne générée is_complete
CREATE OR REPLACE FUNCTION public.update_assessment_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_assessment_id UUID;
  v_graded_count INTEGER;
  v_total_students INTEGER;
BEGIN
  -- Récupérer ou créer l'assessment correspondant
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT id, total_students INTO v_assessment_id, v_total_students
    FROM assessments
    WHERE assessment_name = NEW.assessment_name
      AND assessment_type = NEW.assessment_type
      AND subject = NEW.subject
      AND class_name = NEW.class_name
      AND school_year = NEW.school_year
      AND semester = NEW.semester
      AND teacher_id = NEW.teacher_id;

    IF v_assessment_id IS NULL THEN
      SELECT COUNT(DISTINCT student_id) INTO v_total_students
      FROM student_enrollments 
      WHERE class_name = NEW.class_name 
        AND school_year_id = (SELECT id FROM school_years WHERE label = NEW.school_year LIMIT 1);

      INSERT INTO assessments (
        assessment_name,
        assessment_type,
        assessment_custom_label,
        subject,
        class_name,
        school_year,
        semester,
        class_fk_id,
        academic_period_fk_id,
        teacher_id,
        teacher_name,
        max_grade,
        weighting,
        total_students
      )
      VALUES (
        NEW.assessment_name,
        NEW.assessment_type,
        NEW.assessment_custom_label,
        NEW.subject,
        NEW.class_name,
        NEW.school_year,
        NEW.semester,
        NEW.class_fk_id,
        NEW.academic_period_fk_id,
        NEW.teacher_id,
        NEW.teacher_name,
        NEW.max_grade,
        NEW.weighting,
        v_total_students
      )
      RETURNING id INTO v_assessment_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT id, total_students INTO v_assessment_id, v_total_students
    FROM assessments
    WHERE assessment_name = OLD.assessment_name
      AND assessment_type = OLD.assessment_type
      AND subject = OLD.subject
      AND class_name = OLD.class_name
      AND school_year = OLD.school_year
      AND semester = OLD.semester
      AND teacher_id = OLD.teacher_id;
  END IF;

  -- Mettre à jour uniquement graded_students (is_complete est une colonne générée)
  IF v_assessment_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT student_id) INTO v_graded_count
    FROM grades
    WHERE assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
      AND assessment_type = COALESCE(NEW.assessment_type, OLD.assessment_type)
      AND subject = COALESCE(NEW.subject, OLD.subject)
      AND class_name = COALESCE(NEW.class_name, OLD.class_name)
      AND school_year = COALESCE(NEW.school_year, OLD.school_year)
      AND semester = COALESCE(NEW.semester, OLD.semester)
      AND teacher_id = COALESCE(NEW.teacher_id, OLD.teacher_id);

    UPDATE assessments
    SET graded_students = v_graded_count
    WHERE id = v_assessment_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Backfill du total d'élèves par classe/année à partir des inscriptions
WITH enroll_counts AS (
  SELECT se.class_name,
         sy.label AS school_year,
         COUNT(DISTINCT se.student_id) AS total_students
  FROM student_enrollments se
  JOIN school_years sy ON sy.id = se.school_year_id
  GROUP BY se.class_name, sy.label
)
UPDATE assessments a
SET total_students = ec.total_students
FROM enroll_counts ec
WHERE a.class_name = ec.class_name AND a.school_year = ec.school_year;

-- Backfill seulement graded_students (ne pas toucher is_complete)
WITH grades_counts AS (
  SELECT assessment_name, assessment_type, subject, class_name, school_year, semester, teacher_id,
         COUNT(DISTINCT student_id) AS graded_count
  FROM grades
  GROUP BY assessment_name, assessment_type, subject, class_name, school_year, semester, teacher_id
)
UPDATE assessments a
SET graded_students = COALESCE(gc.graded_count, 0)
FROM grades_counts gc
WHERE a.assessment_name = gc.assessment_name
  AND a.assessment_type = gc.assessment_type
  AND a.subject = gc.subject
  AND a.class_name = gc.class_name
  AND a.school_year = gc.school_year
  AND a.semester = gc.semester
  AND a.teacher_id = gc.teacher_id;