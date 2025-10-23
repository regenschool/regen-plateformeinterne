-- Phase 1: Ajout de subject_id aux tables grades et assessments
-- Cette colonne sera nullable initialement pour permettre la migration progressive

-- Ajouter subject_id à la table grades
ALTER TABLE public.grades
ADD COLUMN subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances des JOINs
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);

-- Ajouter subject_id à la table assessments
ALTER TABLE public.assessments
ADD COLUMN subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances des JOINs
CREATE INDEX idx_assessments_subject_id ON public.assessments(subject_id);

-- Ajouter un commentaire pour documenter la migration
COMMENT ON COLUMN public.grades.subject_id IS 'Foreign key vers subjects. Permet de relier une note à sa matière et facilite le swap enseignant.';
COMMENT ON COLUMN public.assessments.subject_id IS 'Foreign key vers subjects. Permet de relier une évaluation à sa matière et facilite le swap enseignant.';