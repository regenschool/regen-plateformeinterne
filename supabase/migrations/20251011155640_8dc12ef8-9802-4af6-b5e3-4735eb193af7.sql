-- Add teacher_id to students table for data isolation
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS teacher_id UUID;

-- Create indexes for performance with multiple concurrent users (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON public.students(class_name);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON public.grades(subject);
CREATE INDEX IF NOT EXISTS idx_grades_class_name ON public.grades(class_name);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_student_id ON public.user_notes(student_id);

-- Update RLS policies for students to isolate by teacher
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- Create new restrictive policies for students
CREATE POLICY "Teachers can view their own students"
ON public.students
FOR SELECT
USING (auth.uid() = teacher_id OR teacher_id IS NULL);

CREATE POLICY "Teachers can insert their own students"
ON public.students
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own students"
ON public.students
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own students"
ON public.students
FOR DELETE
USING (auth.uid() = teacher_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_grades_teacher_class_subject ON public.grades(teacher_id, class_name, subject);
CREATE INDEX IF NOT EXISTS idx_students_teacher_class ON public.students(teacher_id, class_name);