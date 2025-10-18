-- Migration critique : Passer SECURITY DEFINER à SECURITY INVOKER pour respecter RLS
-- Cette modification force les fonctions à respecter les politiques RLS de l'utilisateur appelant

-- 1. Recréer calculate_class_subject_stats avec SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.calculate_class_subject_stats(
  p_class_name TEXT,
  p_school_year TEXT,
  p_semester TEXT
)
RETURNS TABLE (
  subject TEXT,
  class_avg NUMERIC,
  min_avg NUMERIC,
  max_avg NUMERIC,
  student_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER  -- CHANGÉ : De DEFINER à INVOKER pour respecter RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH student_subject_averages AS (
    SELECT 
      g.subject,
      g.student_id,
      SUM((g.grade / g.max_grade) * 20 * g.weighting) / NULLIF(SUM(g.weighting), 0) as avg
    FROM grades g
    WHERE g.class_name = p_class_name
      AND g.school_year = p_school_year
      AND g.semester = p_semester
    GROUP BY g.subject, g.student_id
    HAVING SUM(g.weighting) > 0
  )
  SELECT 
    ssa.subject,
    ROUND(AVG(ssa.avg)::numeric, 2) as class_avg,
    ROUND(MIN(ssa.avg)::numeric, 2) as min_avg,
    ROUND(MAX(ssa.avg)::numeric, 2) as max_avg,
    COUNT(DISTINCT ssa.student_id)::integer as student_count
  FROM student_subject_averages ssa
  GROUP BY ssa.subject;
END;
$$;

-- 2. Recréer get_subject_weights_for_class avec SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_subject_weights_for_class(
  p_class_name TEXT,
  p_school_year TEXT,
  p_semester TEXT
)
RETURNS TABLE (
  subject_name TEXT,
  weight NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- CHANGÉ : De DEFINER à INVOKER pour respecter RLS
SET search_path = public
AS $$
  SELECT 
    s.subject_name,
    sw.weight
  FROM subject_weights sw
  JOIN subjects s ON s.id = sw.subject_id
  WHERE sw.class_name = p_class_name
    AND sw.school_year = p_school_year
    AND sw.semester = p_semester;
$$;

-- 3. Ajouter un index composite pour optimiser les queries de génération de bulletins
CREATE INDEX IF NOT EXISTS idx_grades_bulletin_lookup
ON grades(student_id, school_year, semester, class_name);

-- 4. Ajouter un index pour les students lookups fréquents
CREATE INDEX IF NOT EXISTS idx_students_class_lookup
ON students(class_name, school_year_id) WHERE class_name IS NOT NULL;

-- 5. Ajouter un index pour les enrollments lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year
ON student_enrollments(school_year_id, class_id);

COMMENT ON FUNCTION public.calculate_class_subject_stats IS 'Calcule les stats de classe par matière en respectant RLS (SECURITY INVOKER)';
COMMENT ON FUNCTION public.get_subject_weights_for_class IS 'Récupère les coefficients par classe en respectant RLS (SECURITY INVOKER)';
