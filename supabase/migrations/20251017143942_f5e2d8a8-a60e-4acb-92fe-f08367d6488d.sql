-- Create teacher-invoices bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-invoices', 'teacher-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for teacher-invoices bucket
-- Teachers can upload their own documents
CREATE POLICY "Teachers can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'teacher-invoices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can view their own documents
CREATE POLICY "Teachers can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teacher-invoices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can delete their own documents
CREATE POLICY "Teachers can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teacher-invoices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all documents in teacher-invoices bucket
CREATE POLICY "Admins can manage all teacher documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'teacher-invoices' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'teacher-invoices' AND
  has_role(auth.uid(), 'admin'::app_role)
);