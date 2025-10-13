-- ====================================================================
-- SCRIPT D'EXPORT DE DONNÉES - REGEN DIRECTORY MASTER
-- À exécuter AVANT le remix du projet
-- ====================================================================
-- Ce script génère des fichiers CSV avec toutes vos données
-- Exécutez-le depuis le backend Lovable Cloud (bouton "View Backend")
-- ====================================================================

-- 1. EXPORT DES DONNÉES DE RÉFÉRENCE (ordre important pour les FK)
-- ====================================================================

-- Années scolaires
COPY (
  SELECT id, label, start_date, end_date, is_active, created_at, updated_at
  FROM school_years
  ORDER BY start_date
) TO '/tmp/school_years.csv' WITH CSV HEADER;

-- Niveaux
COPY (
  SELECT id, name, is_active, created_at, updated_at
  FROM levels
  ORDER BY name
) TO '/tmp/levels.csv' WITH CSV HEADER;

-- Classes
COPY (
  SELECT id, name, level, capacity, is_active, created_at, updated_at
  FROM classes
  ORDER BY name
) TO '/tmp/classes.csv' WITH CSV HEADER;

-- Périodes académiques
COPY (
  SELECT id, label, start_date, end_date, school_year_id, is_active, created_at, updated_at
  FROM academic_periods
  ORDER BY start_date
) TO '/tmp/academic_periods.csv' WITH CSV HEADER;

-- 2. EXPORT DES UTILISATEURS ET RÔLES
-- ====================================================================

-- Liste des utilisateurs (depuis auth.users)
COPY (
  SELECT id, email, created_at
  FROM auth.users
  ORDER BY created_at
) TO '/tmp/auth_users.csv' WITH CSV HEADER;

-- Rôles utilisateurs
COPY (
  SELECT id, user_id, role, created_at
  FROM user_roles
  ORDER BY user_id, role
) TO '/tmp/user_roles.csv' WITH CSV HEADER;

-- Dev role overrides (pour les comptes admin de développement)
COPY (
  SELECT user_id, is_admin, updated_at
  FROM dev_role_overrides
) TO '/tmp/dev_role_overrides.csv' WITH CSV HEADER;

-- 3. EXPORT DES ENSEIGNANTS
-- ====================================================================

-- Enseignants (table principale)
COPY (
  SELECT id, user_id, full_name, email, phone, created_at, updated_at
  FROM teachers
  ORDER BY full_name
) TO '/tmp/teachers.csv' WITH CSV HEADER;

-- Profils détaillés des enseignants
COPY (
  SELECT id, user_id, full_name, email, phone, address, siret, bank_iban, bank_bic, created_at, updated_at
  FROM teacher_profiles
  ORDER BY full_name
) TO '/tmp/teacher_profiles.csv' WITH CSV HEADER;

-- 4. EXPORT DES ÉTUDIANTS
-- ====================================================================

-- Étudiants (table principale)
COPY (
  SELECT id, first_name, last_name, birth_date, age, class_name, photo_url, 
         special_needs, company, academic_background, 
         class_id, level_id, school_year_id, assigned_teacher_id, teacher_id,
         created_at, updated_at
  FROM students
  ORDER BY last_name, first_name
) TO '/tmp/students.csv' WITH CSV HEADER;

-- Inscriptions des étudiants
COPY (
  SELECT id, student_id, school_year_id, class_id, level_id, assigned_teacher_id,
         class_name, company, academic_background, created_at, updated_at
  FROM student_enrollments
  ORDER BY student_id, school_year_id
) TO '/tmp/student_enrollments.csv' WITH CSV HEADER;

-- 5. EXPORT DES MATIÈRES
-- ====================================================================

COPY (
  SELECT id, teacher_id, subject_name, class_name, school_year, semester,
         teacher_name, teacher_email, academic_period_id, 
         teacher_fk_id, class_fk_id, school_year_fk_id,
         created_at, updated_at
  FROM subjects
  ORDER BY school_year, semester, class_name, subject_name
) TO '/tmp/subjects.csv' WITH CSV HEADER;

-- 6. EXPORT DES NOTES
-- ====================================================================

COPY (
  SELECT id, student_id, teacher_id, subject, class_name, school_year, semester,
         assessment_type, assessment_name, assessment_custom_label,
         grade, max_grade, weighting, is_absent, appreciation,
         teacher_name, academic_period_fk_id, class_fk_id,
         created_at, updated_at
  FROM grades
  ORDER BY school_year, semester, class_name, student_id, subject, created_at
) TO '/tmp/grades.csv' WITH CSV HEADER;

-- 7. EXPORT DES DOCUMENTS ET FACTURES
-- ====================================================================

-- Documents scolaires (métadonnées seulement - les fichiers seront perdus)
COPY (
  SELECT id, teacher_id, title, description, file_type, file_path, uploaded_by, created_at
  FROM school_documents
  ORDER BY created_at DESC
) TO '/tmp/school_documents.csv' WITH CSV HEADER;

-- Factures enseignants (métadonnées seulement - les PDFs seront perdus)
COPY (
  SELECT id, teacher_id, invoice_number, invoice_date, description,
         hours, rate_per_hour, other_amount, total_amount, status,
         pdf_path, created_at, updated_at
  FROM teacher_invoices
  ORDER BY invoice_date DESC
) TO '/tmp/teacher_invoices.csv' WITH CSV HEADER;

-- 8. EXPORT DES DONNÉES UTILISATEURS
-- ====================================================================

-- Notes personnelles des utilisateurs
COPY (
  SELECT id, user_id, student_id, note, created_at, updated_at
  FROM user_notes
  ORDER BY user_id, student_id
) TO '/tmp/user_notes.csv' WITH CSV HEADER;

-- Liens de quiz publics
COPY (
  SELECT id, created_by, class_name, is_active, expires_at, access_count, created_at
  FROM public_quiz_links
  ORDER BY created_at DESC
) TO '/tmp/public_quiz_links.csv' WITH CSV HEADER;

-- Scores de quiz
COPY (
  SELECT id, user_id, class_name, score, total, completed_at
  FROM quiz_scores
  ORDER BY completed_at DESC
) TO '/tmp/quiz_scores.csv' WITH CSV HEADER;

-- 9. EXPORT DES LOGS D'AUDIT (OPTIONNEL - peut être très volumineux)
-- ====================================================================
-- Décommentez si vous voulez conserver l'historique complet

-- COPY (
--   SELECT id, user_id, action, table_name, record_id, 
--          old_values, new_values, ip_address, user_agent, created_at
--   FROM audit_logs
--   ORDER BY created_at DESC
--   LIMIT 10000  -- Limitez si trop volumineux
-- ) TO '/tmp/audit_logs.csv' WITH CSV HEADER;

-- ====================================================================
-- FIN DE L'EXPORT
-- ====================================================================
-- Les fichiers CSV sont générés dans /tmp/
-- Vous devez maintenant les télécharger depuis le backend
-- ====================================================================
