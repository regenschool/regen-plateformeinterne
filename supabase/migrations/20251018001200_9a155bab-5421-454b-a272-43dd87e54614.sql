-- CORRECTION CRITIQUE #1: Changer SECURITY DEFINER en SECURITY INVOKER pour les vues
-- Cela évite le bypass des RLS policies et améliore la sécurité

-- Recréer la vue v_students_enriched avec SECURITY INVOKER
DROP VIEW IF EXISTS public.v_students_enriched CASCADE;

CREATE VIEW public.v_students_enriched
WITH (security_invoker = true)
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
  s.class_name,
  s.class_id,
  s.level_id,
  s.school_year_id,
  s.teacher_id,
  s.assigned_teacher_id,
  s.created_at,
  s.updated_at,
  c.name as class_name_from_ref,
  c.level as class_level,
  l.name as level_name,
  sy.label as school_year_label,
  t.full_name as assigned_teacher_name,
  get_user_email(t.user_id) as assigned_teacher_email
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN levels l ON s.level_id = l.id
LEFT JOIN school_years sy ON s.school_year_id = sy.id
LEFT JOIN teachers t ON s.assigned_teacher_id = t.user_id;

-- Recréer la vue v_student_enrollments_enriched avec SECURITY INVOKER
DROP VIEW IF EXISTS public.v_student_enrollments_enriched CASCADE;

CREATE VIEW public.v_student_enrollments_enriched
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.student_id,
  e.school_year_id,
  e.class_id,
  e.class_name,
  e.level_id,
  e.academic_background,
  e.company,
  e.assigned_teacher_id,
  e.created_at,
  e.updated_at,
  s.first_name,
  s.last_name,
  s.photo_url,
  s.birth_date,
  s.age,
  s.special_needs,
  c.name as class_name_from_ref,
  c.level as class_level,
  l.name as level_name,
  sy.label as school_year_label,
  sy.is_active as school_year_is_active,
  t.full_name as assigned_teacher_name,
  get_user_email(t.user_id) as assigned_teacher_email
FROM student_enrollments e
LEFT JOIN students s ON e.student_id = s.id
LEFT JOIN classes c ON e.class_id = c.id
LEFT JOIN levels l ON e.level_id = l.id
LEFT JOIN school_years sy ON e.school_year_id = sy.id
LEFT JOIN teachers t ON e.assigned_teacher_id = t.user_id;

-- Recréer la vue v_grades_enriched avec SECURITY INVOKER
DROP VIEW IF EXISTS public.v_grades_enriched CASCADE;

CREATE VIEW public.v_grades_enriched
WITH (security_invoker = true)
AS
SELECT 
  g.id,
  g.student_id,
  g.subject,
  g.assessment_name,
  g.assessment_type,
  g.assessment_custom_label,
  g.grade,
  g.max_grade,
  g.weighting,
  g.appreciation,
  g.teacher_id,
  g.teacher_name,
  g.school_year,
  g.semester,
  g.class_name,
  g.is_absent,
  g.academic_period_fk_id,
  g.class_fk_id,
  g.created_at,
  g.updated_at,
  s.first_name as student_first_name,
  s.last_name as student_last_name,
  t.full_name as teacher_full_name,
  get_user_email(t.user_id) as teacher_email_from_ref,
  c.name as class_name_from_ref,
  sy.label as school_year_from_ref,
  ap.label as academic_period_label
FROM grades g
LEFT JOIN students s ON g.student_id = s.id
LEFT JOIN teachers t ON g.teacher_id = t.user_id
LEFT JOIN classes c ON g.class_fk_id = c.id
LEFT JOIN school_years sy ON EXISTS (
  SELECT 1 FROM academic_periods ap2 
  WHERE ap2.id = g.academic_period_fk_id 
  AND ap2.school_year_id = sy.id
)
LEFT JOIN academic_periods ap ON g.academic_period_fk_id = ap.id;

-- Recréer la vue v_teacher_profiles_enriched avec SECURITY INVOKER
DROP VIEW IF EXISTS public.v_teacher_profiles_enriched CASCADE;

CREATE VIEW public.v_teacher_profiles_enriched
WITH (security_invoker = true)
AS
SELECT 
  tp.id,
  tp.user_id,
  tp.email,
  tp.full_name,
  tp.first_name,
  tp.last_name,
  tp.secondary_email,
  tp.phone,
  tp.address,
  tp.created_at,
  tp.updated_at,
  CASE 
    WHEN checklist.checklist_completed = checklist.checklist_total THEN 'complete'
    WHEN checklist.checklist_completed > 0 THEN 'in_progress'
    ELSE 'pending'
  END as onboarding_status,
  docs.documents_approved,
  docs.documents_pending,
  docs.documents_rejected,
  checklist.checklist_completed,
  checklist.checklist_total,
  subjects.subjects
FROM teacher_profiles tp
LEFT JOIN (
  SELECT 
    teacher_id,
    COUNT(*) FILTER (WHERE status = 'approved') as documents_approved,
    COUNT(*) FILTER (WHERE status = 'pending') as documents_pending,
    COUNT(*) FILTER (WHERE status = 'rejected') as documents_rejected
  FROM teacher_documents
  GROUP BY teacher_id
) docs ON tp.user_id = docs.teacher_id
LEFT JOIN (
  SELECT 
    teacher_id,
    COUNT(*) FILTER (WHERE is_completed = true) as checklist_completed,
    COUNT(*) as checklist_total
  FROM onboarding_checklist
  GROUP BY teacher_id
) checklist ON tp.user_id = checklist.teacher_id
LEFT JOIN (
  SELECT 
    teacher_id,
    array_agg(DISTINCT subject_name ORDER BY subject_name) as subjects
  FROM teacher_subjects
  GROUP BY teacher_id
) subjects ON tp.user_id = subjects.teacher_id;