-- Corriger le search_path pour la fonction sync_assessment_completion
CREATE OR REPLACE FUNCTION sync_assessment_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_students INTEGER;
  v_graded_students INTEGER;
  v_is_complete BOOLEAN;
  v_assessment_record RECORD;
BEGIN
  -- Compter le nombre total d'étudiants dans la classe
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
    AND g.is_active = true
    AND g.deleted_at IS NULL;

  -- Déterminer si l'épreuve est complète
  v_is_complete := (v_graded_students >= v_total_students AND v_total_students > 0);

  -- Mettre à jour ou créer l'enregistrement d'assessment
  SELECT * INTO v_assessment_record
  FROM assessments
  WHERE subject_id = COALESCE(NEW.subject_id, OLD.subject_id)
    AND assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
  LIMIT 1;

  IF FOUND THEN
    -- Mettre à jour l'assessment existant
    UPDATE assessments
    SET 
      total_students = v_total_students,
      graded_students = v_graded_students,
      is_complete = v_is_complete,
      -- ✅ Dépublier automatiquement si l'épreuve n'est plus complète
      is_visible_to_students = CASE 
        WHEN v_is_complete THEN is_visible_to_students  -- Garder l'état actuel si complète
        ELSE false  -- Forcer à false si incomplète
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
        is_complete,
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
        v_is_complete,
        false,  -- Par défaut, non visible
        NEW.max_grade,
        NEW.weighting
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;