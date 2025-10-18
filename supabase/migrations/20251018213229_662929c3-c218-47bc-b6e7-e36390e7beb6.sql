-- ============================================
-- ÉTAPE 3: Grade Visibility pour Étudiants
-- ============================================

-- 1. Table assessments (évaluations) pour tracker la complétion et visibilité
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification de l'évaluation
  assessment_name TEXT NOT NULL,
  assessment_type assessment_type NOT NULL,
  assessment_custom_label TEXT,
  
  -- Contexte académique
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  school_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  class_fk_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  academic_period_fk_id UUID REFERENCES public.academic_periods(id) ON DELETE SET NULL,
  
  -- Enseignant
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  teacher_name TEXT,
  
  -- Tracking de complétion
  total_students INTEGER NOT NULL DEFAULT 0,
  graded_students INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN GENERATED ALWAYS AS (graded_students >= total_students AND total_students > 0) STORED,
  
  -- Visibilité pour étudiants (OPT-IN par prof/admin)
  is_visible_to_students BOOLEAN NOT NULL DEFAULT false,
  visibility_changed_at TIMESTAMPTZ,
  visibility_changed_by UUID REFERENCES auth.users(id),
  
  -- Métadonnées
  max_grade NUMERIC NOT NULL DEFAULT 20,
  weighting NUMERIC NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(assessment_name, assessment_type, subject, class_name, school_year, semester, teacher_id)
);

-- Index pour assessments
CREATE INDEX idx_assessments_teacher ON public.assessments(teacher_id);
CREATE INDEX idx_assessments_class ON public.assessments(class_name, school_year, semester);
CREATE INDEX idx_assessments_subject ON public.assessments(subject);
CREATE INDEX idx_assessments_visibility ON public.assessments(is_visible_to_students, is_complete);
CREATE INDEX idx_assessments_class_fk ON public.assessments(class_fk_id);
CREATE INDEX idx_assessments_period_fk ON public.assessments(academic_period_fk_id);

-- Trigger updated_at pour assessments
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Fonction pour auto-update graded_students count
-- ============================================
CREATE OR REPLACE FUNCTION public.update_assessment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment_id UUID;
  v_graded_count INTEGER;
BEGIN
  -- Récupérer ou créer l'assessment correspondant
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Chercher l'assessment existant
    SELECT id INTO v_assessment_id
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
        -- Compter le nombre total d'étudiants dans cette classe/année
        (SELECT COUNT(DISTINCT student_id) 
         FROM student_enrollments 
         WHERE class_name = NEW.class_name 
           AND school_year_id = (SELECT id FROM school_years WHERE label = NEW.school_year LIMIT 1))
      )
      RETURNING id INTO v_assessment_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Pour DELETE, utiliser OLD
    SELECT id INTO v_assessment_id
    FROM assessments
    WHERE assessment_name = OLD.assessment_name
      AND assessment_type = OLD.assessment_type
      AND subject = OLD.subject
      AND class_name = OLD.class_name
      AND school_year = OLD.school_year
      AND semester = OLD.semester
      AND teacher_id = OLD.teacher_id;
  END IF;
  
  -- Mettre à jour le count de graded_students
  IF v_assessment_id IS NOT NULL THEN
    -- Compter les notes distinctes (exclure absents si nécessaire)
    SELECT COUNT(DISTINCT student_id) INTO v_graded_count
    FROM grades
    WHERE assessment_name = COALESCE(NEW.assessment_name, OLD.assessment_name)
      AND assessment_type = COALESCE(NEW.assessment_type, OLD.assessment_type)
      AND subject = COALESCE(NEW.subject, OLD.subject)
      AND class_name = COALESCE(NEW.class_name, OLD.class_name)
      AND school_year = COALESCE(NEW.school_year, OLD.school_year)
      AND semester = COALESCE(NEW.semester, OLD.semester)
      AND teacher_id = COALESCE(NEW.teacher_id, OLD.teacher_id)
      AND is_absent = false; -- Ne compter que les notes réelles, pas les absences
    
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

-- Trigger sur grades pour auto-update assessments
DROP TRIGGER IF EXISTS trigger_update_assessment_completion ON public.grades;
CREATE TRIGGER trigger_update_assessment_completion
  AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assessment_completion();

-- ============================================
-- 3. View matérialisée pour grades visibles aux étudiants
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.student_visible_grades AS
SELECT 
  g.*,
  a.is_visible_to_students,
  a.is_complete
FROM grades g
INNER JOIN assessments a ON (
  g.assessment_name = a.assessment_name
  AND g.assessment_type = a.assessment_type
  AND g.subject = a.subject
  AND g.class_name = a.class_name
  AND g.school_year = a.school_year
  AND g.semester = a.semester
  AND g.teacher_id = a.teacher_id
)
WHERE a.is_complete = true 
  AND a.is_visible_to_students = true;

-- Index sur la view matérialisée
CREATE INDEX idx_student_visible_grades_student ON public.student_visible_grades(student_id);
CREATE INDEX idx_student_visible_grades_class ON public.student_visible_grades(class_name, school_year, semester);

-- Fonction pour rafraîchir la view (à appeler après changement de visibilité)
CREATE OR REPLACE FUNCTION public.refresh_student_visible_grades()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.student_visible_grades;
END;
$$;

-- ============================================
-- 4. RLS Policies pour assessments
-- ============================================
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all assessments"
  ON public.assessments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own assessments"
  ON public.assessments
  FOR SELECT
  USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can update their own assessments"
  ON public.assessments
  FOR UPDATE
  USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role));

-- Les étudiants ne peuvent PAS voir les assessments directement (privacy)
-- Ils verront uniquement les grades via student_visible_grades

-- ============================================
-- 5. RLS Policies pour student_visible_grades
-- ============================================
-- Note: Les materialized views n'ont pas de RLS natif, mais on peut créer une vue normale avec RLS

CREATE OR REPLACE VIEW public.v_student_grades_with_visibility AS
SELECT 
  g.*,
  a.is_visible_to_students,
  a.is_complete
FROM grades g
INNER JOIN assessments a ON (
  g.assessment_name = a.assessment_name
  AND g.assessment_type = a.assessment_type
  AND g.subject = a.subject
  AND g.class_name = a.class_name
  AND g.school_year = a.school_year
  AND g.semester = a.semester
  AND g.teacher_id = a.teacher_id
);

ALTER VIEW public.v_student_grades_with_visibility SET (security_invoker = true);

-- Note: Pour les étudiants, on utilisera cette view avec un filtre côté application