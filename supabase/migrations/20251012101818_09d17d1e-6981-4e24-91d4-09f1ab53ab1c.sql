-- Create dev override table (development helper)
CREATE TABLE IF NOT EXISTS public.dev_role_overrides (
  user_id uuid PRIMARY KEY,
  is_admin boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_role_overrides ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exist then recreate)
DROP POLICY IF EXISTS "Users can view their own dev override" ON public.dev_role_overrides;
DROP POLICY IF EXISTS "Users can insert their own dev override" ON public.dev_role_overrides;
DROP POLICY IF EXISTS "Users can update their own dev override" ON public.dev_role_overrides;

CREATE POLICY "Users can view their own dev override"
ON public.dev_role_overrides
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dev override"
ON public.dev_role_overrides
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dev override"
ON public.dev_role_overrides
FOR UPDATE
USING (auth.uid() = user_id);

-- Extend has_role to consider dev overrides for admin in development
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    OR (
      _role = 'admin'::app_role AND
      EXISTS (
        SELECT 1 FROM public.dev_role_overrides
        WHERE user_id = _user_id AND is_admin = true
      )
    );
$$;