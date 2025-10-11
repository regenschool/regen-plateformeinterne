-- Create subjects table to store subject definitions independently of grades
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  school_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_name, subject_name, school_year, semester)
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for subjects
CREATE POLICY "Teachers can view their own subjects"
ON public.subjects
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own subjects"
ON public.subjects
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own subjects"
ON public.subjects
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own subjects"
ON public.subjects
FOR DELETE
USING (auth.uid() = teacher_id);

-- Create indexes for performance
CREATE INDEX idx_subjects_teacher_id ON public.subjects(teacher_id);
CREATE INDEX idx_subjects_class_name ON public.subjects(class_name);
CREATE INDEX idx_subjects_school_year_semester ON public.subjects(school_year, semester);

-- Create trigger for updated_at
CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();