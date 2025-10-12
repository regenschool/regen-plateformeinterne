-- Corriger les vues pour qu'elles soient SECURITY INVOKER
-- Cela garantit que les permissions RLS de l'utilisateur sont appliquées

DROP VIEW IF EXISTS public.v_students_enriched;
DROP VIEW IF EXISTS public.v_grades_enriched;

-- Recréer v_students_enriched avec SECURITY INVOKER
CREATE VIEW public.v_students_enriched
WITH (security_invoker=true)
AS
SELECT 
  s.id,
  s.first_name,
  s.last_name,
  s.photo_url,
  s.birth_date,
  s.age,
  s.academic_background,
  s.company,
  s.special_needs,
  s.created_at,
  s.updated_at,
  -- Anciennes colonnes TEXT (pour compatibilité)
  s.class_name,
  -- Nouvelles relations
  s.class_id,
  c.name as class_name_from_ref,
  c.level as class_level,
  s.level_id,
  l.name as level_name,
  s.school_year_id,
  sy.label as school_year_label,
  s.assigned_teacher_id,
  t.full_name as assigned_teacher_name,
  t.email as assigned_teacher_email
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
LEFT JOIN public.levels l ON s.level_id = l.id
LEFT JOIN public.school_years sy ON s.school_year_id = sy.id
LEFT JOIN public.teachers t ON s.assigned_teacher_id = t.id;

-- Recréer v_grades_enriched avec SECURITY INVOKER
CREATE VIEW public.v_grades_enriched
WITH (security_invoker=true)
AS
SELECT 
  g.id,
  g.student_id,
  g.teacher_id,
  g.subject,
  g.assessment_type,
  g.assessment_name,
  g.assessment_custom_label,
  g.grade,
  g.max_grade,
  g.weighting,
  g.appreciation,
  g.is_absent,
  g.created_at,
  g.updated_at,
  -- Anciennes colonnes TEXT
  g.class_name,
  g.school_year,
  g.semester,
  g.teacher_name,
  -- Nouvelles relations
  g.class_fk_id,
  c.name as class_name_from_ref,
  g.academic_period_fk_id,
  ap.label as academic_period_label,
  sy.label as school_year_from_ref,
  -- Infos étudiant
  s.first_name as student_first_name,
  s.last_name as student_last_name,
  -- Infos enseignant
  t.full_name as teacher_full_name,
  t.email as teacher_email_from_ref
FROM public.grades g
LEFT JOIN public.classes c ON g.class_fk_id = c.id
LEFT JOIN public.academic_periods ap ON g.academic_period_fk_id = ap.id
LEFT JOIN public.school_years sy ON ap.school_year_id = sy.id
LEFT JOIN public.students s ON g.student_id = s.id
LEFT JOIN public.teachers t ON g.teacher_id = t.user_id;