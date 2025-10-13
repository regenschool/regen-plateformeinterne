-- ====================================================================
-- REQUÊTES DE VÉRIFICATION POST-MIGRATION
-- ====================================================================
-- Utilisez ces requêtes pour vérifier que tout a été correctement importé
-- ====================================================================

-- 1. COMPARAISON DES COMPTAGES
-- ====================================================================
-- Exécutez cette requête AVANT et APRÈS la migration pour comparer

SELECT 
  'school_years' as table_name, 
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_records
FROM school_years

UNION ALL

SELECT 
  'levels',
  COUNT(*),
  COUNT(CASE WHEN is_active = true THEN 1 END)
FROM levels

UNION ALL

SELECT 
  'classes',
  COUNT(*),
  COUNT(CASE WHEN is_active = true THEN 1 END)
FROM classes

UNION ALL

SELECT 
  'academic_periods',
  COUNT(*),
  COUNT(CASE WHEN is_active = true THEN 1 END)
FROM academic_periods

UNION ALL

SELECT 
  'students',
  COUNT(*),
  COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as with_photo
FROM students

UNION ALL

SELECT 
  'teachers',
  COUNT(*),
  COUNT(*)
FROM teachers

UNION ALL

SELECT 
  'subjects',
  COUNT(*),
  COUNT(DISTINCT teacher_id) as unique_teachers
FROM subjects

UNION ALL

SELECT 
  'grades',
  COUNT(*),
  COUNT(CASE WHEN is_absent = false THEN 1 END) as with_grade
FROM grades

UNION ALL

SELECT 
  'user_roles',
  COUNT(*),
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM user_roles

ORDER BY table_name;

-- 2. VÉRIFICATION DES RELATIONS (INTÉGRITÉ RÉFÉRENTIELLE)
-- ====================================================================

-- Étudiants sans inscription
SELECT 
  'Students without enrollment' as check_name,
  COUNT(*) as count
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM student_enrollments se 
  WHERE se.student_id = s.id
)

UNION ALL

-- Notes sans étudiant
SELECT 
  'Grades without student',
  COUNT(*)
FROM grades g
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.id = g.student_id
)

UNION ALL

-- Matières sans enseignant
SELECT 
  'Subjects without teacher',
  COUNT(*)
FROM subjects sub
WHERE NOT EXISTS (
  SELECT 1 FROM teachers t 
  WHERE t.id = sub.teacher_id
)

UNION ALL

-- Enseignants sans user_id valide
SELECT 
  'Teachers without valid user_id',
  COUNT(*)
FROM teachers t
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = t.user_id
);

-- 3. VÉRIFICATION DES DONNÉES CRITIQUES
-- ====================================================================

-- Top 5 des classes par nombre d'étudiants
SELECT 
  class_name,
  COUNT(*) as student_count,
  COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as with_photo
FROM students
WHERE class_name IS NOT NULL
GROUP BY class_name
ORDER BY student_count DESC
LIMIT 5;

-- Top 5 des enseignants par nombre de matières
SELECT 
  t.full_name,
  COUNT(DISTINCT s.id) as subject_count,
  COUNT(DISTINCT g.id) as grade_count
FROM teachers t
LEFT JOIN subjects s ON s.teacher_id = t.id
LEFT JOIN grades g ON g.teacher_id = t.id
GROUP BY t.id, t.full_name
ORDER BY subject_count DESC
LIMIT 5;

-- Répartition des notes par année scolaire
SELECT 
  school_year,
  COUNT(*) as total_grades,
  ROUND(AVG(grade), 2) as avg_grade,
  COUNT(CASE WHEN is_absent = true THEN 1 END) as absent_count
FROM grades
GROUP BY school_year
ORDER BY school_year DESC;

-- 4. VÉRIFICATION DES UTILISATEURS ET RÔLES
-- ====================================================================

-- Distribution des rôles
SELECT 
  role,
  COUNT(*) as user_count
FROM user_roles
GROUP BY role
ORDER BY user_count DESC;

-- Utilisateurs avec plusieurs rôles
SELECT 
  user_id,
  array_agg(role::text) as roles,
  COUNT(*) as role_count
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Admin sans profil enseignant
SELECT 
  ur.user_id,
  COALESCE(t.full_name, 'No teacher profile') as name
FROM user_roles ur
LEFT JOIN teachers t ON t.user_id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY t.full_name;

-- 5. VÉRIFICATION DES FICHIERS ET STORAGE
-- ====================================================================

-- Documents sans fichier (file_path NULL)
SELECT 
  'Documents without file_path' as check_name,
  COUNT(*) as count
FROM school_documents
WHERE file_path IS NULL OR file_path = '';

-- Factures sans PDF
SELECT 
  'Invoices without PDF',
  COUNT(*)
FROM teacher_invoices
WHERE pdf_path IS NULL OR pdf_path = '';

-- Photos d'étudiants manquantes
SELECT 
  'Students without photo',
  COUNT(*)
FROM students
WHERE photo_url IS NULL OR photo_url = '';

-- Liste détaillée des étudiants sans photo
SELECT 
  id,
  first_name,
  last_name,
  class_name
FROM students
WHERE photo_url IS NULL OR photo_url = ''
ORDER BY class_name, last_name, first_name;

-- 6. VÉRIFICATION DES DATES
-- ====================================================================

-- Périodes académiques chevauchantes
SELECT 
  a1.label as period_1,
  a2.label as period_2,
  a1.start_date,
  a1.end_date,
  a2.start_date,
  a2.end_date
FROM academic_periods a1
JOIN academic_periods a2 ON a1.id < a2.id
WHERE a1.school_year_id = a2.school_year_id
  AND (
    (a1.start_date BETWEEN a2.start_date AND a2.end_date)
    OR (a1.end_date BETWEEN a2.start_date AND a2.end_date)
    OR (a2.start_date BETWEEN a1.start_date AND a1.end_date)
  );

-- Années scolaires actives multiples (peut être normal)
SELECT 
  label,
  start_date,
  end_date,
  is_active
FROM school_years
WHERE is_active = true
ORDER BY start_date DESC;

-- 7. STATISTIQUES GLOBALES
-- ====================================================================

-- Résumé général
SELECT 
  'Total Students' as metric,
  COUNT(*)::text as value
FROM students

UNION ALL

SELECT 
  'Total Teachers',
  COUNT(*)::text
FROM teachers

UNION ALL

SELECT 
  'Total Grades',
  COUNT(*)::text
FROM grades

UNION ALL

SELECT 
  'Total Subjects',
  COUNT(*)::text
FROM subjects

UNION ALL

SELECT 
  'Total Classes',
  COUNT(*)::text
FROM classes

UNION ALL

SELECT 
  'Active School Years',
  COUNT(*)::text
FROM school_years
WHERE is_active = true

UNION ALL

SELECT 
  'Total Enrollments',
  COUNT(*)::text
FROM student_enrollments

UNION ALL

SELECT 
  'Total Documents',
  COUNT(*)::text
FROM school_documents

UNION ALL

SELECT 
  'Total Invoices',
  COUNT(*)::text
FROM teacher_invoices;

-- 8. VÉRIFICATION DES TRIGGERS ET FONCTIONS
-- ====================================================================

-- Liste des triggers actifs
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Fonctions personnalisées
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- ====================================================================
-- RÉSULTAT ATTENDU
-- ====================================================================
-- Toutes les requêtes doivent retourner des résultats cohérents
-- Si des anomalies apparaissent, consultez le README pour le dépannage
-- ====================================================================
