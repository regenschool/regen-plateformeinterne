-- Vérifier et ajouter CASCADE DELETE sur la FK student_enrollments -> students
-- D'abord, supprimer l'ancienne contrainte si elle existe sans CASCADE
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_enrollments_student_id_fkey'
    AND table_name = 'student_enrollments'
  ) THEN
    ALTER TABLE public.student_enrollments 
    DROP CONSTRAINT student_enrollments_student_id_fkey;
  END IF;
END $$;

-- Ajouter la nouvelle contrainte avec CASCADE DELETE
ALTER TABLE public.student_enrollments
ADD CONSTRAINT student_enrollments_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.students(id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT student_enrollments_student_id_fkey ON public.student_enrollments IS 
'Supprime automatiquement les inscriptions quand un étudiant est supprimé';