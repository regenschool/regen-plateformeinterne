-- Allow anonymous users to read students data for public quizzes
CREATE POLICY "Anyone can view students for public quizzes"
ON public.students
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read public quiz links
CREATE POLICY "Anyone can view active public quiz links"
ON public.public_quiz_links
FOR SELECT
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Allow anonymous users to update access count on public quiz links
CREATE POLICY "Anyone can update access count on public quiz links"
ON public.public_quiz_links
FOR UPDATE
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()))
WITH CHECK (is_active = true AND (expires_at IS NULL OR expires_at > now()));