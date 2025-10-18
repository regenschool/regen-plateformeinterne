-- Fonction pour calculer les statistiques de classe par matière en SQL
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
SECURITY DEFINER
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

-- Index pour optimiser les requêtes sur grades
CREATE INDEX IF NOT EXISTS idx_grades_class_year_semester 
ON grades(class_name, school_year, semester);

CREATE INDEX IF NOT EXISTS idx_grades_student_subject 
ON grades(student_id, subject);

CREATE INDEX IF NOT EXISTS idx_subject_weights_lookup
ON subject_weights(class_name, school_year, semester, subject_id);

-- Fonction pour obtenir les coefficients d'une classe
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
SECURITY DEFINER
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