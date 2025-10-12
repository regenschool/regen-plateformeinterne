-- Ajouter le champ teacher_email à la table subjects
ALTER TABLE public.subjects 
ADD COLUMN teacher_email text;

-- Créer une fonction pour obtenir l'email de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text
  FROM auth.users
  WHERE id = _user_id
$$;

-- Modifier les politiques RLS pour inclure les matières assignées par email
DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can create their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can update their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can delete their own subjects" ON public.subjects;

-- Permettre aux enseignants de voir leurs matières (créées par eux OU assignées via email)
CREATE POLICY "Teachers can view their own subjects" 
ON public.subjects 
FOR SELECT 
USING (
  auth.uid() = teacher_id 
  OR teacher_email = get_user_email(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Permettre aux enseignants et admins de créer des matières
CREATE POLICY "Teachers can create their own subjects" 
ON public.subjects 
FOR INSERT 
WITH CHECK (
  auth.uid() = teacher_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Permettre aux enseignants de modifier leurs matières et aux admins de tout modifier
CREATE POLICY "Teachers can update their own subjects" 
ON public.subjects 
FOR UPDATE 
USING (
  auth.uid() = teacher_id 
  OR teacher_email = get_user_email(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Permettre aux enseignants de supprimer leurs matières et aux admins de tout supprimer
CREATE POLICY "Teachers can delete their own subjects" 
ON public.subjects 
FOR DELETE 
USING (
  auth.uid() = teacher_id 
  OR teacher_email = get_user_email(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);