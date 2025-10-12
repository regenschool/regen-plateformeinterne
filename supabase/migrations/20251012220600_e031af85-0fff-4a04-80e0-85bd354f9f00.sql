-- ============================================
-- PHASE 1: OPTIMISATION - INDEX MANQUANTS
-- ============================================

-- Index pour améliorer les performances des queries fréquentes

-- 1. GRADES - Recherche par étudiant et matière
CREATE INDEX IF NOT EXISTS idx_grades_student_subject 
ON grades(student_id, subject);

-- 2. GRADES - Recherche par professeur et période
CREATE INDEX IF NOT EXISTS idx_grades_teacher_period 
ON grades(teacher_id, academic_period_fk_id);

-- 3. GRADES - Recherche par classe
CREATE INDEX IF NOT EXISTS idx_grades_class 
ON grades(class_name);

-- 4. STUDENT_ENROLLMENTS - Recherche par année scolaire et classe
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year_class 
ON student_enrollments(school_year_id, class_id);

-- 5. STUDENT_ENROLLMENTS - Recherche par étudiant
CREATE INDEX IF NOT EXISTS idx_enrollments_student 
ON student_enrollments(student_id);

-- 6. STUDENTS - Recherche par date de naissance (pour calcul d'âge)
CREATE INDEX IF NOT EXISTS idx_students_birth_date 
ON students(birth_date) WHERE birth_date IS NOT NULL;

-- 7. STUDENTS - Recherche par nom
CREATE INDEX IF NOT EXISTS idx_students_name 
ON students(last_name, first_name);

-- 8. SUBJECTS - Recherche par professeur
CREATE INDEX IF NOT EXISTS idx_subjects_teacher 
ON subjects(teacher_id);

-- 9. SUBJECTS - Recherche par classe et année
CREATE INDEX IF NOT EXISTS idx_subjects_class_year 
ON subjects(class_name, school_year);

-- 10. USER_NOTES - Recherche par utilisateur et étudiant
CREATE INDEX IF NOT EXISTS idx_user_notes_user_student 
ON user_notes(user_id, student_id);

-- 11. QUIZ_SCORES - Recherche par utilisateur et classe
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user_class 
ON quiz_scores(user_id, class_name);

-- 12. TEACHER_INVOICES - Recherche par professeur et statut
CREATE INDEX IF NOT EXISTS idx_invoices_teacher_status 
ON teacher_invoices(teacher_id, status);

-- 13. SCHOOL_YEARS - Recherche par année active
CREATE INDEX IF NOT EXISTS idx_school_years_active 
ON school_years(is_active) WHERE is_active = true;

-- 14. CLASSES - Recherche par classes actives
CREATE INDEX IF NOT EXISTS idx_classes_active 
ON classes(is_active) WHERE is_active = true;

-- ============================================
-- ANALYSE ET STATISTIQUES
-- ============================================

-- Mettre à jour les statistiques PostgreSQL pour l'optimiseur
ANALYZE grades;
ANALYZE student_enrollments;
ANALYZE students;
ANALYZE subjects;
ANALYZE user_notes;

-- Commentaires pour documentation
COMMENT ON INDEX idx_grades_student_subject IS 'Optimise les recherches de notes par étudiant et matière';
COMMENT ON INDEX idx_grades_teacher_period IS 'Optimise les recherches de notes par professeur et période académique';
COMMENT ON INDEX idx_enrollments_school_year_class IS 'Optimise les recherches d''inscriptions par année et classe';
COMMENT ON INDEX idx_students_birth_date IS 'Optimise le calcul d''âge et les recherches par date de naissance';