-- Amélioration de la robustesse de l'application pour gérer la charge
-- Ajout d'indices pour optimiser les performances

-- Index pour la table grades (requêtes fréquentes par teacher_id, class_name, subject, etc.)
CREATE INDEX IF NOT EXISTS idx_grades_teacher_class_subject ON public.grades(teacher_id, class_name, subject, school_year, semester);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_created_at ON public.grades(created_at DESC);

-- Index pour la table students (requêtes fréquentes par class_name)
CREATE INDEX IF NOT EXISTS idx_students_class_name ON public.students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);

-- Index pour la table subjects (requêtes fréquentes par teacher_id, class_name, etc.)
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_class ON public.subjects(teacher_id, class_name, school_year, semester);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);

-- Index pour la table teacher_profiles
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON public.teacher_profiles(user_id);

-- Index pour la table teacher_invoices
CREATE INDEX IF NOT EXISTS idx_teacher_invoices_teacher_id ON public.teacher_invoices(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_invoices_date ON public.teacher_invoices(invoice_date DESC);

-- Index pour la table school_documents
CREATE INDEX IF NOT EXISTS idx_school_documents_teacher_id ON public.school_documents(teacher_id);

-- Index pour la table user_notes
CREATE INDEX IF NOT EXISTS idx_user_notes_user_student ON public.user_notes(user_id, student_id);

-- Index pour la table quiz_scores
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user_id ON public.quiz_scores(user_id);

-- Contrainte unique pour éviter les doublons de matières
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_unique ON public.subjects(teacher_id, class_name, subject_name, school_year, semester);

-- Activer l'auto-vacuum pour maintenir les performances
ALTER TABLE public.grades SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.students SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.subjects SET (autovacuum_vacuum_scale_factor = 0.1);