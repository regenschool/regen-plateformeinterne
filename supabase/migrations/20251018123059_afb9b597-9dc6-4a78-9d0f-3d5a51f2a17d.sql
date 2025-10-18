-- Create programs referential table
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for programs
CREATE POLICY "Admins can manage programs"
ON public.programs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can view programs"
ON public.programs
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add program_id to classes table
ALTER TABLE public.classes
ADD COLUMN program_id UUID REFERENCES public.programs(id);

-- Add program_id to student_enrollments table (optional override)
ALTER TABLE public.student_enrollments
ADD COLUMN program_id UUID REFERENCES public.programs(id);

-- Create trigger for updated_at on programs
CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_classes_program_id ON public.classes(program_id);
CREATE INDEX idx_student_enrollments_program_id ON public.student_enrollments(program_id);

-- Migrate existing program_name from report_card_templates if needed
-- This creates a default program if there's a common program_name
INSERT INTO public.programs (name, description, is_active)
SELECT DISTINCT program_name, 'Programme créé automatiquement lors de la migration', true
FROM public.report_card_templates
WHERE program_name IS NOT NULL AND program_name != 'Programme de Formation'
ON CONFLICT (name) DO NOTHING;