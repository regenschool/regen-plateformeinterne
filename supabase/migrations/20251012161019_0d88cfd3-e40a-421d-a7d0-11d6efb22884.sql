-- Add unique constraint to prevent duplicate grades for same assessment per student
-- A student can only have one grade per assessment (identified by assessment_name, type, and custom_label)
ALTER TABLE public.grades 
ADD CONSTRAINT grades_student_assessment_unique 
UNIQUE (student_id, subject, school_year, semester, assessment_name, assessment_type, assessment_custom_label);