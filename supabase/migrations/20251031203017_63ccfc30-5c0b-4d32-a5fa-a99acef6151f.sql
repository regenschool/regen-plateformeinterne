-- Phase 4B Étape 3: Supprimer colonnes dénormalisées de grades
-- Ces données sont accessibles via subject_id FK

ALTER TABLE grades 
DROP COLUMN IF EXISTS subject_name,
DROP COLUMN IF EXISTS class_name,
DROP COLUMN IF EXISTS school_year,
DROP COLUMN IF EXISTS semester;