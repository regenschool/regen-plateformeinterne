-- Create enum for assessment types
CREATE TYPE public.assessment_type AS ENUM (
  'participation_individuelle',
  'oral_groupe',
  'oral_individuel',
  'ecrit_groupe',
  'ecrit_individuel',
  'memoire',
  'autre'
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  assessment_type assessment_type NOT NULL,
  assessment_custom_label TEXT,
  grade DECIMAL(5,2) NOT NULL,
  max_grade DECIMAL(5,2) NOT NULL DEFAULT 20,
  weighting DECIMAL(5,2) NOT NULL DEFAULT 1,
  appreciation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Teachers can view grades they created
CREATE POLICY "Teachers can view their own grades"
ON public.grades
FOR SELECT
USING (auth.uid() = teacher_id);

-- Teachers can create grades
CREATE POLICY "Teachers can create grades"
ON public.grades
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own grades
CREATE POLICY "Teachers can update their own grades"
ON public.grades
FOR UPDATE
USING (auth.uid() = teacher_id);

-- Teachers can delete their own grades
CREATE POLICY "Teachers can delete their own grades"
ON public.grades
FOR DELETE
USING (auth.uid() = teacher_id);

-- Trigger for updated_at
CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX idx_grades_class_name ON public.grades(class_name);