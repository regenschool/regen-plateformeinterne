-- ====================================
-- PHASE 2: Ajouter foreign keys aux tables existantes
-- ====================================

-- Ajouter class_id à students (garder class_name pour migration progressive)
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Ajouter teacher_id à students
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Ajouter level_id à students
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL;

-- Ajouter school_year_id à students
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Pour subjects: ajouter teacher_id FK (garder teacher_name/email pour migration)
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS teacher_fk_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Pour subjects: ajouter school_year_id FK
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS school_year_fk_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE;

-- Pour subjects: ajouter academic_period_id FK
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS academic_period_id UUID REFERENCES public.academic_periods(id) ON DELETE CASCADE;

-- Pour subjects: ajouter class_id FK
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS class_fk_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- Pour grades: ajouter academic_period_id FK
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS academic_period_fk_id UUID REFERENCES public.academic_periods(id) ON DELETE SET NULL;

-- Pour grades: ajouter class_id FK
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS class_fk_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- ====================================
-- PHASE 3: Migrer les données existantes
-- ====================================

-- Migrer les enseignants depuis auth.users qui ont des subjects ou grades
INSERT INTO public.teachers (user_id, full_name, email)
SELECT DISTINCT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.email
FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM public.subjects s WHERE s.teacher_id = u.id
  UNION
  SELECT 1 FROM public.grades g WHERE g.teacher_id = u.id
)
ON CONFLICT (email) DO NOTHING;

-- Migrer les enseignants depuis subjects.teacher_email
INSERT INTO public.teachers (email, full_name)
SELECT DISTINCT
  s.teacher_email,
  s.teacher_name
FROM public.subjects s
WHERE s.teacher_email IS NOT NULL
  AND s.teacher_email NOT IN (SELECT email FROM public.teachers WHERE email IS NOT NULL)
ON CONFLICT (email) DO NOTHING;

-- Lier students.class_id depuis class_name
UPDATE public.students st
SET class_id = c.id
FROM public.classes c
WHERE st.class_name = c.name
  AND st.class_id IS NULL;

-- Lier students.level_id depuis classes.level
UPDATE public.students st
SET level_id = l.id
FROM public.classes c
JOIN public.levels l ON c.level = l.name
WHERE st.class_id = c.id
  AND st.level_id IS NULL;

-- Lier subjects.teacher_fk_id
UPDATE public.subjects s
SET teacher_fk_id = t.id
FROM public.teachers t
WHERE (s.teacher_id = t.user_id OR s.teacher_email = t.email)
  AND s.teacher_fk_id IS NULL;

-- Lier subjects.class_fk_id
UPDATE public.subjects s
SET class_fk_id = c.id
FROM public.classes c
WHERE s.class_name = c.name
  AND s.class_fk_id IS NULL;

-- Lier subjects.school_year_fk_id
UPDATE public.subjects s
SET school_year_fk_id = sy.id
FROM public.school_years sy
WHERE s.school_year = sy.label
  AND s.school_year_fk_id IS NULL;

-- Lier subjects.academic_period_id via school_year + semester
UPDATE public.subjects s
SET academic_period_id = ap.id
FROM public.academic_periods ap
JOIN public.school_years sy ON ap.school_year_id = sy.id
WHERE s.school_year = sy.label
  AND s.semester = ap.label
  AND s.academic_period_id IS NULL;

-- Lier grades.class_fk_id
UPDATE public.grades g
SET class_fk_id = c.id
FROM public.classes c
WHERE g.class_name = c.name
  AND g.class_fk_id IS NULL;

-- Lier grades.academic_period_fk_id
UPDATE public.grades g
SET academic_period_fk_id = ap.id
FROM public.academic_periods ap
JOIN public.school_years sy ON ap.school_year_id = sy.id
WHERE g.school_year = sy.label
  AND g.semester = ap.label
  AND g.academic_period_fk_id IS NULL;

-- ====================================
-- PHASE 4: Ajouter des index pour performance
-- ====================================

-- Index pour students
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_level_id ON public.students(level_id) WHERE level_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_school_year_id ON public.students(school_year_id) WHERE school_year_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_assigned_teacher_id ON public.students(assigned_teacher_id) WHERE assigned_teacher_id IS NOT NULL;

-- Index pour subjects
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_fk_id ON public.subjects(teacher_fk_id) WHERE teacher_fk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_class_fk_id ON public.subjects(class_fk_id) WHERE class_fk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_school_year_fk_id ON public.subjects(school_year_fk_id) WHERE school_year_fk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_academic_period_id ON public.subjects(academic_period_id) WHERE academic_period_id IS NOT NULL;

-- Index pour grades
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_fk_id ON public.grades(class_fk_id) WHERE class_fk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grades_academic_period_fk_id ON public.grades(academic_period_fk_id) WHERE academic_period_fk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grades_student_period ON public.grades(student_id, academic_period_fk_id) WHERE academic_period_fk_id IS NOT NULL;

-- Index pour teachers
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email) WHERE email IS NOT NULL;

-- ====================================
-- PHASE 5: Créer des vues pour faciliter les requêtes
-- ====================================

-- Vue enrichie des étudiants avec toutes les relations
CREATE OR REPLACE VIEW public.v_students_enriched AS
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

-- Vue enrichie des notes
CREATE OR REPLACE VIEW public.v_grades_enriched AS
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