-- Ajouter une contrainte UNIQUE pour éviter les doublons d'étudiants
-- Un même étudiant (prénom + nom) ne peut exister qu'une seule fois dans la table
-- Cela évite les importations en double tout en permettant la gestion des homonymies si nécessaire

ALTER TABLE public.students
ADD CONSTRAINT students_unique_name 
UNIQUE (first_name, last_name);

COMMENT ON CONSTRAINT students_unique_name ON public.students IS 
'Empêche la création de doublons d''étudiants (même prénom et nom)';