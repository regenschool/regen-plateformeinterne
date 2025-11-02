
-- Activer RLS sur subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent tout gérer
CREATE POLICY "Admins can manage subjects"
ON subjects
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Politique pour que les enseignants puissent créer leurs propres matières
CREATE POLICY "Teachers can create their own subjects"
ON subjects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_fk_id
    AND teachers.user_id = auth.uid()
  )
);

-- Politique pour que les enseignants puissent voir leurs propres matières
CREATE POLICY "Teachers can view their own subjects"
ON subjects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_fk_id
    AND teachers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour que les enseignants puissent modifier leurs propres matières
CREATE POLICY "Teachers can update their own subjects"
ON subjects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_fk_id
    AND teachers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_fk_id
    AND teachers.user_id = auth.uid()
  )
);

-- Politique pour que les enseignants puissent supprimer leurs propres matières
CREATE POLICY "Teachers can delete their own subjects"
ON subjects
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_fk_id
    AND teachers.user_id = auth.uid()
  )
);
