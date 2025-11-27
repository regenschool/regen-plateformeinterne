-- Corriger le trigger sync_assessment_completion pour ne pas insérer is_complete (colonne générée)
CREATE OR REPLACE FUNCTION public.sync_assessment_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_students INTEGER;
  v_graded_students INTEGER;
  v_assessment_record RECORD;
BEGIN
  -- Compter le nombre total d'étudiants dans la classe via subject -> class -> enrollments
  SELECT COUNT(DISTINCT se.student_id)
  INTO v_total_students
  FROM student_enrollments se
  JOIN subjects s ON s.class_fk_id = se.class_id 
    AND s.school_year_fk_id = se.school_year_id
  WHERE s.id = COALESCE(NEW.subject_id, OLD.subject_id)
    AND se.is_active = true;

  -- Compter le nombre d'étudiants ayant une note pour cette épreuve
  SELECT COUNT(DISTINCT g.student_id)
  INTO v_graded_students
  FROM grades g
  WHERE g.subject_id = COALESCE(NEW.subject_id, OLD.subject_id)
    AND g.assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
    AND g.assessment_type = COALESCE(NEW.assessment_type, OLD.assessment_type)
    AND g.is_active = true
    AND g.deleted_at IS NULL;

  -- Chercher l'assessment existant
  SELECT * INTO v_assessment_record
  FROM assessments
  WHERE subject_id = COALESCE(NEW.subject_id, OLD.subject_id)
    AND assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
    AND assessment_type = COALESCE(NEW.assessment_type, OLD.assessment_type)
  LIMIT 1;

  IF FOUND THEN
    -- Mettre à jour l'assessment existant (is_complete est généré automatiquement)
    UPDATE assessments
    SET 
      total_students = v_total_students,
      graded_students = v_graded_students,
      -- is_complete est GENERATED ALWAYS - ne pas le modifier
      -- Dépublier si incomplet
      is_visible_to_students = CASE 
        WHEN (v_graded_students >= v_total_students AND v_total_students > 0) THEN is_visible_to_students
        ELSE false
      END,
      updated_at = NOW()
    WHERE id = v_assessment_record.id;
  ELSE
    -- Créer un nouvel assessment si INSERT d'une première note
    IF TG_OP = 'INSERT' THEN
      INSERT INTO assessments (
        subject_id,
        assessment_name,
        assessment_type,
        assessment_custom_label,
        teacher_id,
        total_students,
        graded_students,
        -- is_complete OMIS car GENERATED ALWAYS
        is_visible_to_students,
        max_grade,
        weighting
      ) VALUES (
        NEW.subject_id,
        NEW.assessment_name,
        NEW.assessment_type,
        NEW.assessment_custom_label,
        NEW.teacher_id,
        v_total_students,
        v_graded_students,
        -- is_complete sera calculé automatiquement
        false,  -- Par défaut, non visible
        NEW.max_grade,
        NEW.weighting
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Corriger également update_assessment_completion
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
  v_subject_id UUID;
BEGIN
  -- Récupérer subject_id selon le type d'opération
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_subject_id := NEW.subject_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_subject_id := OLD.subject_id;
  END IF;

  -- Récupérer ou créer l'assessment correspondant via subject_id
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT id, total_students INTO v_assessment_id, v_total_students
    FROM assessments
    WHERE assessment_name = NEW.assessment_name
      AND assessment_type = NEW.assessment_type
      AND subject_id = NEW.subject_id
      AND teacher_id = NEW.teacher_id;

    IF v_assessment_id IS NULL THEN
      -- Compter le total d'étudiants via subject -> class -> enrollments
      SELECT COUNT(DISTINCT se.student_id) INTO v_total_students
      FROM student_enrollments se
      INNER JOIN subjects s ON s.class_fk_id = se.class_id 
        AND s.school_year_fk_id = se.school_year_id
      WHERE s.id = NEW.subject_id;

      IF v_total_students IS NULL OR v_total_students = 0 THEN
        v_total_students := 0;
      END IF;

      -- Créer l'assessment SANS is_complete (colonne générée)
      INSERT INTO assessments (
        assessment_name,
        assessment_type,
        assessment_custom_label,
        subject_id,
        class_fk_id,
        academic_period_fk_id,
        teacher_id,
        max_grade,
        weighting,
        total_students,
        graded_students
        -- is_complete OMIS car GENERATED ALWAYS
      )
      VALUES (
        NEW.assessment_name,
        NEW.assessment_type,
        NEW.assessment_custom_label,
        NEW.subject_id,
        NEW.class_fk_id,
        NEW.academic_period_fk_id,
        NEW.teacher_id,
        NEW.max_grade,
        NEW.weighting,
        COALESCE(v_total_students, 0),
        0
      )
      RETURNING id INTO v_assessment_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT id, total_students INTO v_assessment_id, v_total_students
    FROM assessments
    WHERE assessment_name = OLD.assessment_name
      AND assessment_type = OLD.assessment_type
      AND subject_id = OLD.subject_id
      AND teacher_id = OLD.teacher_id;
  END IF;

  -- Mettre à jour uniquement graded_students (is_complete se recalcule auto)
  IF v_assessment_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT student_id) INTO v_graded_count
    FROM grades
    WHERE assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
      AND assessment_type = COALESCE(NEW.assessment_type, OLD.assessment_type)
      AND subject_id = v_subject_id
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