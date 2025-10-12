-- Nettoyage et renforcement de la sécurité pour la table subjects
-- Cette migration simplifie les RLS policies pour utiliser uniquement teacher_id

-- 1. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Teachers can create their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can delete their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can update their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.subjects;

-- 2. Créer les nouvelles policies simplifiées basées uniquement sur teacher_id
-- Les enseignants peuvent créer des matières (avec leur propre teacher_id)
CREATE POLICY "Teachers can create their own subjects"
ON public.subjects
FOR INSERT
WITH CHECK (
  (auth.uid() = teacher_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Les enseignants peuvent voir leurs propres matières, les admins voient tout
CREATE POLICY "Teachers can view their own subjects"
ON public.subjects
FOR SELECT
USING (
  (auth.uid() = teacher_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Les enseignants peuvent mettre à jour leurs propres matières, les admins peuvent tout mettre à jour
CREATE POLICY "Teachers can update their own subjects"
ON public.subjects
FOR UPDATE
USING (
  (auth.uid() = teacher_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Les enseignants peuvent supprimer leurs propres matières, les admins peuvent tout supprimer
CREATE POLICY "Teachers can delete their own subjects"
ON public.subjects
FOR DELETE
USING (
  (auth.uid() = teacher_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Créer une fonction pour résoudre teacher_id depuis un email
-- Cette fonction sera utilisée par les admins lors de l'import
CREATE OR REPLACE FUNCTION public.get_user_id_from_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM auth.users
  WHERE email = _email
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_user_id_from_email IS 'Retourne le user_id correspondant à un email donné. Utilisé pour l''import de matières par les admins.';