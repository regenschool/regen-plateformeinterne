
-- ================================================================
-- CORRECTION TRIGGER update_assessment_completion()
-- Le trigger précédent n'a pas été correctement remplacé
-- ================================================================

-- Supprimer l'ancien trigger complètement
DROP TRIGGER IF EXISTS trigger_update_assessment_completion ON public.grades;
DROP FUNCTION IF EXISTS public.update_assessment_completion() CASCADE;

-- Recréer la fonction CORRECTE (architecture normalisée Phase 4B)
CREATE OR REPLACE FUNCTION public.update_assessment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

      -- Si pas trouvé via JOIN, mettre un défaut
      IF v_total_students IS NULL OR v_total_students = 0 THEN
        v_total_students := 0;
      END IF;

      -- Créer l'assessment
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
        total_students
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
        COALESCE(v_total_students, 0)
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

  -- Mettre à jour uniquement graded_students
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
$$;

-- Recréer le trigger
CREATE TRIGGER trigger_update_assessment_completion
  AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assessment_completion();

-- ================================================================
-- Maintenant on peut supprimer les données de test en sécurité
-- ================================================================
DELETE FROM subject_weights;
DELETE FROM grades;
DELETE FROM assessments;
DELETE FROM subjects;
