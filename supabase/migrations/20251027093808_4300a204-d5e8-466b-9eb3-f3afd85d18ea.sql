-- Migration Phase 3A : Réécrire calculate_class_subject_stats() pour utiliser subject_id avec JOIN
-- Cette fonction utilise maintenant subject_id au lieu des colonnes dénormalisées

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
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH student_subject_averages AS (
    -- ✅ Utilisation de subject_id avec JOIN sur subjects pour récupérer subject_name
    SELECT 
      s.subject_name as subject,
      g.student_id,
      SUM((g.grade / g.max_grade) * 20 * g.weighting) / NULLIF(SUM(g.weighting), 0) as avg
    FROM grades g
    -- ✅ JOIN sur subjects via subject_id (architecture normalisée)
    INNER JOIN subjects s ON s.id = g.subject_id
    WHERE s.class_name = p_class_name
      AND s.school_year = p_school_year
      AND s.semester = p_semester
    GROUP BY s.subject_name, g.student_id
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

COMMENT ON FUNCTION public.calculate_class_subject_stats IS 
'Calcule les stats de classe par matière en utilisant subject_id (architecture normalisée Phase 3A)';

-- Index pour optimiser les JOINs sur subject_id
CREATE INDEX IF NOT EXISTS idx_grades_subject_id 
ON grades(subject_id);

CREATE INDEX IF NOT EXISTS idx_subjects_class_year_semester 
ON subjects(class_name, school_year, semester);