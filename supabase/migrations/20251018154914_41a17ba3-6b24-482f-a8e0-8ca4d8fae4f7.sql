-- Fonction pour vérifier si l'email d'un utilisateur est confirmé
CREATE OR REPLACE FUNCTION public.is_email_confirmed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email_confirmed_at IS NOT NULL
  FROM auth.users
  WHERE id = _user_id
$$;