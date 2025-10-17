-- Ajouter une politique pour permettre aux enseignants de supprimer leurs propres documents uploadés
CREATE POLICY "Teachers can delete their own uploaded documents"
ON teacher_documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = teacher_id 
  AND upload_source = 'teacher'
);