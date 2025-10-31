-- Phase 4B Étape 5 (correction 2): Ajouter UNIQUE constraint sur teachers.id

-- La PK est actuellement sur user_id
-- On doit ajouter UNIQUE sur id pour permettre les FK

ALTER TABLE teachers
ADD CONSTRAINT teachers_id_unique UNIQUE (id);