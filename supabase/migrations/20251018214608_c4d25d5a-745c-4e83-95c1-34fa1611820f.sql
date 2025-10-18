-- Mettre à jour le trigger pour calculer automatiquement is_complete
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
    -- Chercher l'assessment existant
    SELECT id, total_students INTO v_assessment_id, v_total_students
    FROM assessments
    WHERE assessment_name = NEW.assessment_name
      AND assessment_type = NEW.assessment_type
      AND subject = NEW.subject
      AND class_name = NEW.class_name
      AND school_year = NEW.school_year
      AND semester = NEW.semester
      AND teacher_id = NEW.teacher_id;
    
    -- Si l'assessment n'existe pas, le créer
    IF v_assessment_id IS NULL THEN
      -- Compter le nombre total d'étudiants dans cette classe/année
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
    -- Pour DELETE, utiliser OLD
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
  
  -- Mettre à jour le count de graded_students et is_complete
  IF v_assessment_id IS NOT NULL THEN
    -- Compter TOUS les étudiants qui ont une entrée (note ou absent)
    SELECT COUNT(DISTINCT student_id) INTO v_graded_count
    FROM grades
    WHERE assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
      AND assessment_type = COALESCE(NEW.assessment_type, OLD.assessment_type)
      AND subject = COALESCE(NEW.subject, OLD.subject)
      AND class_name = COALESCE(NEW.class_name, OLD.class_name)
      AND school_year = COALESCE(NEW.school_year, OLD.school_year)
      AND semester = COALESCE(NEW.semester, OLD.semester)
      AND teacher_id = COALESCE(NEW.teacher_id, OLD.teacher_id);
    
    -- Mettre à jour graded_students et is_complete
    UPDATE assessments
    SET 
      graded_students = v_graded_count,
      is_complete = (v_graded_count >= v_total_students AND v_total_students > 0)
    WHERE id = v_assessment_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;