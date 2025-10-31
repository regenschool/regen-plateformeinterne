-- Phase 4B Étape 2: Supprimer colonnes dénormalisées de subjects
-- Ces données sont maintenant accessibles via les FK normalisées

ALTER TABLE subjects 
DROP COLUMN IF EXISTS class_name,
DROP COLUMN IF EXISTS school_year,
DROP COLUMN IF EXISTS semester;