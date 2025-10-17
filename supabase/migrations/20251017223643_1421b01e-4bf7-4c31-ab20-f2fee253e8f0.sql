-- Créer la table des catégories de matières (référentiels)
CREATE TABLE public.subject_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter la catégorie aux matières (obligatoire)
ALTER TABLE public.subjects 
ADD COLUMN category_id UUID REFERENCES public.subject_categories(id);

-- Table pour stocker les pondérations par semestre/classe
CREATE TABLE public.subject_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  semester TEXT NOT NULL,
  school_year TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, class_name, semester, school_year)
);

-- Table pour stocker les bulletins générés et édités
CREATE TABLE public.student_report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  class_name TEXT NOT NULL,
  template_id UUID REFERENCES public.report_card_templates(id),
  generated_data JSONB NOT NULL,
  edited_data JSONB,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, school_year, semester)
);

-- Modifier la table des templates (retirer photo, ajouter options d'affichage)
ALTER TABLE public.report_card_templates
DROP COLUMN IF EXISTS show_student_photo,
ADD COLUMN IF NOT EXISTS show_grade_detail BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_subject_average BOOLEAN DEFAULT false;

-- RLS pour subject_categories
ALTER TABLE public.subject_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subject categories"
ON public.subject_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view subject categories"
ON public.subject_categories FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS pour subject_weights
ALTER TABLE public.subject_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subject weights"
ON public.subject_weights FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view subject weights"
ON public.subject_weights FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS pour student_report_cards
ALTER TABLE public.student_report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage report cards"
ON public.student_report_cards FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view report cards"
ON public.student_report_cards FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_subject_categories_updated_at
BEFORE UPDATE ON public.subject_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subject_weights_updated_at
BEFORE UPDATE ON public.subject_weights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_report_cards_updated_at
BEFORE UPDATE ON public.student_report_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();