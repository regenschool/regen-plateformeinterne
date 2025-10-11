-- Revert student isolation - students should be accessible to all teachers
-- Remove the teacher_id requirement from students table

DROP POLICY IF EXISTS "Teachers can view their own students" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert their own students" ON public.students;
DROP POLICY IF EXISTS "Teachers can update their own students" ON public.students;
DROP POLICY IF EXISTS "Teachers can delete their own students" ON public.students;

-- Create policies for shared student access (all authenticated users can access)
CREATE POLICY "Authenticated users can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (true);

-- Remove teacher_id column as it's not needed for students
-- (We keep it in the schema for potential future use by the direction team)
-- But we don't use it for RLS policies