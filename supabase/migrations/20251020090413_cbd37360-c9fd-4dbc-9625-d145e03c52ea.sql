-- Créer un bucket de stockage pour les photos d'étudiants
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-photos',
  'student-photos',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Policy: Tout le monde peut voir les photos (bucket public)
CREATE POLICY "Les photos d'étudiants sont publiques"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

-- Policy: Seuls les admins peuvent uploader des photos
CREATE POLICY "Seuls les admins peuvent uploader des photos d'étudiants"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- Policy: Seuls les admins peuvent supprimer des photos
CREATE POLICY "Seuls les admins peuvent supprimer des photos d'étudiants"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos'
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);