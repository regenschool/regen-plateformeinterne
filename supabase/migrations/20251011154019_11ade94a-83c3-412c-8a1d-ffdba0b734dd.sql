-- Add teacher and course metadata to grades table
ALTER TABLE public.grades
ADD COLUMN teacher_name TEXT,
ADD COLUMN school_year TEXT,
ADD COLUMN semester TEXT;

-- Create index for better querying
CREATE INDEX idx_grades_teacher_name ON public.grades(teacher_name);
CREATE INDEX idx_grades_school_year ON public.grades(school_year);
CREATE INDEX idx_grades_semester ON public.grades(semester);