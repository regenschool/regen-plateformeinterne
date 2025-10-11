-- Add assessment_name column to grades table
ALTER TABLE public.grades
ADD COLUMN assessment_name text;

-- Create index for better performance when filtering by assessment
CREATE INDEX idx_grades_assessment ON public.grades(teacher_id, class_name, subject, school_year, semester, assessment_name);