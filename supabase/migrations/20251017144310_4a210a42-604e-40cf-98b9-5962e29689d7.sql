-- Ensure private school-documents bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-documents', 'school-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Teachers can upload their own school documents (path starts with their user_id)
CREATE POLICY "Teachers can upload their own school docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'school-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can view their own school documents
CREATE POLICY "Teachers can view their own school docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'school-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can delete their own school documents
CREATE POLICY "Teachers can delete their own school docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'school-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all school documents
CREATE POLICY "Admins can manage all school docs"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'school-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'school-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);