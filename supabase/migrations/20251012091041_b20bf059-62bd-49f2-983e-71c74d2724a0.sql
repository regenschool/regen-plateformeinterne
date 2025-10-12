-- Restrict public quiz link creation to admins only
-- 1) Remove previous INSERT policy allowing any authenticated user
DROP POLICY IF EXISTS "Authenticated users can create quiz links" ON public.public_quiz_links;

-- 2) Create admin-only INSERT policy
CREATE POLICY "Admins can create quiz links"
ON public.public_quiz_links
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by
);
