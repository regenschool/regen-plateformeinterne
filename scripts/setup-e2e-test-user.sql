-- Script pour configurer l'utilisateur de test E2E
-- Email: test-e2e@example.com
-- À exécuter manuellement dans le backend Lovable Cloud

-- 1. Mettre à jour les métadonnées de l'utilisateur
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', 'Test E2E Admin',
    'email', 'test-e2e@example.com'
  ),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'test-e2e@example.com';

-- 2. Créer une entrée dans la table teachers si elle n'existe pas
INSERT INTO public.teachers (id, email, full_name)
SELECT 
  id,
  email,
  'Test E2E Admin'
FROM auth.users
WHERE email = 'test-e2e@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- 3. Vérifier/créer des données de test minimales

-- Créer un niveau si inexistant
INSERT INTO public.levels (name, created_at, updated_at)
VALUES ('Test Level', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Créer une classe si inexistante
INSERT INTO public.classes (name, level_id, created_at, updated_at)
SELECT 'Test Class', id, NOW(), NOW()
FROM public.levels
WHERE name = 'Test Level'
ON CONFLICT (name) DO NOTHING;

-- Créer une année scolaire si inexistante
INSERT INTO public.school_years (year, start_date, end_date, is_active, created_at, updated_at)
VALUES ('2024-2025', '2024-09-01', '2025-06-30', true, NOW(), NOW())
ON CONFLICT (year) DO UPDATE
SET is_active = EXCLUDED.is_active;

-- Créer une période académique si inexistante
INSERT INTO public.academic_periods (name, school_year_id, start_date, end_date, created_at, updated_at)
SELECT 'Semestre 1', id, '2024-09-01', '2025-01-31', NOW(), NOW()
FROM public.school_years
WHERE year = '2024-2025'
ON CONFLICT (name, school_year_id) DO NOTHING;

-- Créer une catégorie de matière si inexistante
INSERT INTO public.subject_categories (name, created_at, updated_at)
VALUES ('Sciences', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Créer une matière de test
INSERT INTO public.subjects (
  subject_name,
  class_name,
  school_year,
  semester,
  teacher_id,
  coefficient,
  category_id,
  created_at,
  updated_at
)
SELECT 
  'Mathématiques Test',
  'Test Class',
  '2024-2025',
  'Semestre 1',
  u.id,
  1.5,
  sc.id,
  NOW(),
  NOW()
FROM auth.users u
CROSS JOIN public.subject_categories sc
WHERE u.email = 'test-e2e@example.com'
  AND sc.name = 'Sciences'
ON CONFLICT (subject_name, class_name, school_year, semester, teacher_id) 
DO UPDATE SET updated_at = NOW();

-- Créer 3 étudiants de test
INSERT INTO public.students (first_name, last_name, date_of_birth, gender, created_at, updated_at)
VALUES 
  ('Alice', 'Dupont', '2010-05-15', 'F', NOW(), NOW()),
  ('Bob', 'Martin', '2010-08-22', 'M', NOW(), NOW()),
  ('Charlie', 'Bernard', '2010-03-10', 'M', NOW(), NOW())
ON CONFLICT (first_name, last_name, date_of_birth) DO NOTHING;

-- Inscrire les étudiants dans la classe de test
INSERT INTO public.student_enrollments (student_id, class_name, school_year, created_at, updated_at)
SELECT s.id, 'Test Class', '2024-2025', NOW(), NOW()
FROM public.students s
WHERE (s.first_name, s.last_name) IN (
  ('Alice', 'Dupont'),
  ('Bob', 'Martin'),
  ('Charlie', 'Bernard')
)
ON CONFLICT (student_id, class_name, school_year) DO NOTHING;

-- Afficher un résumé
SELECT 
  'Configuration terminée pour test-e2e@example.com' as message,
  (SELECT COUNT(*) FROM public.subjects WHERE teacher_id = (SELECT id FROM auth.users WHERE email = 'test-e2e@example.com')) as nb_subjects,
  (SELECT COUNT(*) FROM public.students WHERE id IN (
    SELECT student_id FROM public.student_enrollments WHERE class_name = 'Test Class'
  )) as nb_students;
