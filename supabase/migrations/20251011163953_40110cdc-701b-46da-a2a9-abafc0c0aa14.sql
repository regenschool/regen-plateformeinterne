-- Update subjects table RLS policies to include admin access
DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can create their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can update their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can delete their own subjects" ON public.subjects;

CREATE POLICY "Teachers can view their own subjects"
ON public.subjects
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create their own subjects"
ON public.subjects
FOR INSERT
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own subjects"
ON public.subjects
FOR UPDATE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own subjects"
ON public.subjects
FOR DELETE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- Update grades table RLS policies to include admin access
DROP POLICY IF EXISTS "Teachers can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can create grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can delete their own grades" ON public.grades;

CREATE POLICY "Teachers can view their own grades"
ON public.grades
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create grades"
ON public.grades
FOR INSERT
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own grades"
ON public.grades
FOR UPDATE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own grades"
ON public.grades
FOR DELETE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));