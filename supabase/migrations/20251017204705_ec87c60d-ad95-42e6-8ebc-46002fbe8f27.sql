-- Optimisation: Supprimer les colonnes redondantes de teachers
-- Étape 1: Recréer les vues qui dépendent de teachers.email

-- 1. Supprimer les vues existantes
DROP VIEW IF EXISTS public.v_students_enriched CASCADE;
DROP VIEW IF EXISTS public.v_grades_enriched CASCADE;
DROP VIEW IF EXISTS public.v_student_enrollments_enriched CASCADE;

-- 2. Supprimer les colonnes redondantes de teachers
ALTER TABLE public.teachers 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- 3. Supprimer le trigger obsolète
DROP TRIGGER IF EXISTS sync_teacher_email_trigger ON public.teachers;

-- 4. Recréer v_students_enriched (utilisant teacher_profiles.email au lieu de teachers.email)
CREATE OR REPLACE VIEW public.v_students_enriched AS
SELECT 
  s.*,
  c.name as class_name_from_ref,
  c.level as class_level,
  l.name as level_name,
  sy.label as school_year_label,
  t.full_name as assigned_teacher_name,
  tp.email as assigned_teacher_email
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
LEFT JOIN public.levels l ON s.level_id = l.id
LEFT JOIN public.school_years sy ON s.school_year_id = sy.id
LEFT JOIN public.teachers t ON s.assigned_teacher_id = t.user_id
LEFT JOIN public.teacher_profiles tp ON t.user_id = tp.user_id;

-- 5. Recréer v_student_enrollments_enriched
CREATE OR REPLACE VIEW public.v_student_enrollments_enriched AS
SELECT 
  se.*,
  s.first_name,
  s.last_name,
  s.birth_date,
  s.age,
  s.photo_url,
  s.special_needs,
  c.name as class_name_from_ref,
  c.level as class_level,
  l.name as level_name,
  sy.label as school_year_label,
  sy.is_active as school_year_is_active,
  t.full_name as assigned_teacher_name,
  tp.email as assigned_teacher_email
FROM public.student_enrollments se
LEFT JOIN public.students s ON se.student_id = s.id
LEFT JOIN public.classes c ON se.class_id = c.id
LEFT JOIN public.levels l ON se.level_id = l.id
LEFT JOIN public.school_years sy ON se.school_year_id = sy.id
LEFT JOIN public.teachers t ON se.assigned_teacher_id = t.user_id
LEFT JOIN public.teacher_profiles tp ON t.user_id = tp.user_id;

-- 6. Recréer v_grades_enriched
CREATE OR REPLACE VIEW public.v_grades_enriched AS
SELECT 
  g.*,
  s.first_name as student_first_name,
  s.last_name as student_last_name,
  t.full_name as teacher_full_name,
  tp.email as teacher_email_from_ref,
  c.name as class_name_from_ref,
  sy.label as school_year_from_ref,
  ap.label as academic_period_label
FROM public.grades g
LEFT JOIN public.students s ON g.student_id = s.id
LEFT JOIN public.teachers t ON g.teacher_id = t.user_id
LEFT JOIN public.teacher_profiles tp ON t.user_id = tp.user_id
LEFT JOIN public.classes c ON g.class_fk_id = c.id
LEFT JOIN public.school_years sy ON g.class_fk_id = sy.id
LEFT JOIN public.academic_periods ap ON g.academic_period_fk_id = ap.id;