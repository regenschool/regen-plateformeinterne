-- Créer le bucket pour les bulletins scolaires
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-cards',
  'report-cards',
  true,
  10485760, -- 10MB max
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux admins d'uploader
CREATE POLICY "Admins can upload report cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-cards' AND
  (
    SELECT has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Politique pour permettre la lecture publique (pour téléchargement)
CREATE POLICY "Anyone can view report cards"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'report-cards');

-- Politique pour permettre aux admins de supprimer
CREATE POLICY "Admins can delete report cards"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-cards' AND
  (
    SELECT has_role(auth.uid(), 'admin'::app_role)
  )
);