
-- PHASE 4B - ÉTAPE 1b/6: Supprimer 4 autres colonnes de students
ALTER TABLE public.students DROP COLUMN IF EXISTS school_year_id CASCADE;
ALTER TABLE public.students DROP COLUMN IF EXISTS class_id CASCADE;
ALTER TABLE public.students DROP COLUMN IF EXISTS assigned_teacher_id CASCADE;
ALTER TABLE public.students DROP COLUMN IF EXISTS teacher_id CASCADE;
