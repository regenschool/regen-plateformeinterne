-- Créer une table pour les liens de quiz publics
CREATE TABLE IF NOT EXISTS public.public_quiz_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  access_count integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.public_quiz_links ENABLE ROW LEVEL SECURITY;

-- Politique pour créer des liens (enseignants seulement)
CREATE POLICY "Authenticated users can create quiz links"
ON public.public_quiz_links FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Politique pour voir ses propres liens
CREATE POLICY "Users can view their own quiz links"
ON public.public_quiz_links FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Politique pour mettre à jour ses propres liens
CREATE POLICY "Users can update their own quiz links"
ON public.public_quiz_links FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Politique pour supprimer ses propres liens
CREATE POLICY "Users can delete their own quiz links"
ON public.public_quiz_links FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Politique publique pour accéder aux liens actifs (lecture seule)
CREATE POLICY "Anyone can view active quiz links by ID"
ON public.public_quiz_links FOR SELECT
TO anon, authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_public_quiz_links_id ON public.public_quiz_links(id);
CREATE INDEX IF NOT EXISTS idx_public_quiz_links_created_by ON public.public_quiz_links(created_by);