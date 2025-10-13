-- ====================================================================
-- SCRIPT D'IMPORT DE DONNÉES - REGEN DIRECTORY MASTER
-- À exécuter APRÈS le remix du projet
-- ====================================================================
-- Ce script réimporte toutes vos données depuis les fichiers CSV
-- Exécutez-le depuis le backend du NOUVEAU projet remixé
-- ====================================================================

-- IMPORTANT : Désactiver temporairement les triggers et contraintes
-- pour éviter les problèmes lors de l'import
SET session_replication_role = 'replica';

-- 1. IMPORT DES DONNÉES DE RÉFÉRENCE
-- ====================================================================

-- Années scolaires
COPY school_years (id, label, start_date, end_date, is_active, created_at, updated_at)
FROM '/tmp/school_years.csv' WITH CSV HEADER;

-- Niveaux
COPY levels (id, name, is_active, created_at, updated_at)
FROM '/tmp/levels.csv' WITH CSV HEADER;

-- Classes
COPY classes (id, name, level, capacity, is_active, created_at, updated_at)
FROM '/tmp/classes.csv' WITH CSV HEADER;

-- Périodes académiques
COPY academic_periods (id, label, start_date, end_date, school_year_id, is_active, created_at, updated_at)
FROM '/tmp/academic_periods.csv' WITH CSV HEADER;

-- 2. IMPORT DES RÔLES UTILISATEURS
-- ====================================================================
-- ATTENTION : Les utilisateurs auth.users devront être recréés manuellement
-- Ce script importe uniquement les rôles pour référence

-- Rôles utilisateurs (à associer après recréation des comptes)
COPY user_roles (id, user_id, role, created_at)
FROM '/tmp/user_roles.csv' WITH CSV HEADER;

-- Dev role overrides
COPY dev_role_overrides (user_id, is_admin, updated_at)
FROM '/tmp/dev_role_overrides.csv' WITH CSV HEADER;

-- 3. IMPORT DES ENSEIGNANTS
-- ====================================================================

-- Enseignants (table principale)
COPY teachers (id, user_id, full_name, email, phone, created_at, updated_at)
FROM '/tmp/teachers.csv' WITH CSV HEADER;

-- Profils détaillés des enseignants
COPY teacher_profiles (id, user_id, full_name, email, phone, address, siret, bank_iban, bank_bic, created_at, updated_at)
FROM '/tmp/teacher_profiles.csv' WITH CSV HEADER;

-- 4. IMPORT DES ÉTUDIANTS
-- ====================================================================

-- Étudiants (table principale)
COPY students (id, first_name, last_name, birth_date, age, class_name, photo_url, 
               special_needs, company, academic_background, 
               class_id, level_id, school_year_id, assigned_teacher_id, teacher_id,
               created_at, updated_at)
FROM '/tmp/students.csv' WITH CSV HEADER;

-- Inscriptions des étudiants
COPY student_enrollments (id, student_id, school_year_id, class_id, level_id, assigned_teacher_id,
                          class_name, company, academic_background, created_at, updated_at)
FROM '/tmp/student_enrollments.csv' WITH CSV HEADER;

-- 5. IMPORT DES MATIÈRES
-- ====================================================================

COPY subjects (id, teacher_id, subject_name, class_name, school_year, semester,
               teacher_name, teacher_email, academic_period_id, 
               teacher_fk_id, class_fk_id, school_year_fk_id,
               created_at, updated_at)
FROM '/tmp/subjects.csv' WITH CSV HEADER;

-- 6. IMPORT DES NOTES
-- ====================================================================

COPY grades (id, student_id, teacher_id, subject, class_name, school_year, semester,
             assessment_type, assessment_name, assessment_custom_label,
             grade, max_grade, weighting, is_absent, appreciation,
             teacher_name, academic_period_fk_id, class_fk_id,
             created_at, updated_at)
FROM '/tmp/grades.csv' WITH CSV HEADER;

-- 7. IMPORT DES DOCUMENTS ET FACTURES (métadonnées seulement)
-- ====================================================================

-- Documents scolaires (les fichiers devront être réuploadés manuellement)
COPY school_documents (id, teacher_id, title, description, file_type, file_path, uploaded_by, created_at)
FROM '/tmp/school_documents.csv' WITH CSV HEADER;

-- Factures enseignants (les PDFs devront être régénérés)
COPY teacher_invoices (id, teacher_id, invoice_number, invoice_date, description,
                       hours, rate_per_hour, other_amount, total_amount, status,
                       pdf_path, created_at, updated_at)
FROM '/tmp/teacher_invoices.csv' WITH CSV HEADER;

-- 8. IMPORT DES DONNÉES UTILISATEURS
-- ====================================================================

-- Notes personnelles des utilisateurs
COPY user_notes (id, user_id, student_id, note, created_at, updated_at)
FROM '/tmp/user_notes.csv' WITH CSV HEADER;

-- Liens de quiz publics
COPY public_quiz_links (id, created_by, class_name, is_active, expires_at, access_count, created_at)
FROM '/tmp/public_quiz_links.csv' WITH CSV HEADER;

-- Scores de quiz
COPY quiz_scores (id, user_id, class_name, score, total, completed_at)
FROM '/tmp/quiz_scores.csv' WITH CSV HEADER;

-- 9. IMPORT DES LOGS D'AUDIT (si exportés)
-- ====================================================================

-- COPY audit_logs (id, user_id, action, table_name, record_id, 
--                  old_values, new_values, ip_address, user_agent, created_at)
-- FROM '/tmp/audit_logs.csv' WITH CSV HEADER;

-- ====================================================================
-- RÉACTIVER LES TRIGGERS ET CONTRAINTES
-- ====================================================================

SET session_replication_role = 'origin';

-- ====================================================================
-- MISE À JOUR DES SÉQUENCES (pour éviter les conflits d'IDs)
-- ====================================================================
-- Postgres met automatiquement à jour les séquences lors de l'import avec COPY
-- Mais si vous utilisez des INSERT, exécutez ceci :

-- SELECT setval(pg_get_serial_sequence('students', 'id'), (SELECT MAX(id) FROM students));
-- SELECT setval(pg_get_serial_sequence('teachers', 'id'), (SELECT MAX(id) FROM teachers));
-- ... etc pour toutes les tables avec des UUIDs générés

-- ====================================================================
-- VÉRIFICATION DE L'IMPORT
-- ====================================================================

SELECT 'school_years' as table_name, COUNT(*) as count FROM school_years
UNION ALL SELECT 'levels', COUNT(*) FROM levels
UNION ALL SELECT 'classes', COUNT(*) FROM classes
UNION ALL SELECT 'academic_periods', COUNT(*) FROM academic_periods
UNION ALL SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL SELECT 'teacher_profiles', COUNT(*) FROM teacher_profiles
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'student_enrollments', COUNT(*) FROM student_enrollments
UNION ALL SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL SELECT 'grades', COUNT(*) FROM grades
UNION ALL SELECT 'school_documents', COUNT(*) FROM school_documents
UNION ALL SELECT 'teacher_invoices', COUNT(*) FROM teacher_invoices
UNION ALL SELECT 'user_notes', COUNT(*) FROM user_notes
UNION ALL SELECT 'public_quiz_links', COUNT(*) FROM public_quiz_links
UNION ALL SELECT 'quiz_scores', COUNT(*) FROM quiz_scores
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles;

-- ====================================================================
-- FIN DE L'IMPORT
-- ====================================================================
