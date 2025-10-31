
-- PHASE 4B - ÉTAPE 1/6: Supprimer colonnes redondantes de students
-- Suppression une par une pour éviter les problèmes de dépendances

ALTER TABLE public.students DROP COLUMN IF EXISTS class_name CASCADE;
ALTER TABLE public.students DROP COLUMN IF EXISTS academic_background CASCADE;
ALTER TABLE public.students DROP COLUMN IF EXISTS company CASCADE;
