-- Supprimer la contrainte UNIQUE sur (first_name, last_name)
-- Cette contrainte était trop restrictive car elle empêchait les homonymes
-- La protection contre les doublons se fait via :
-- 1. Le code d'import qui vérifie manuellement les doublons
-- 2. La contrainte UNIQUE (student_id, school_year_id) sur student_enrollments

ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_unique_name;