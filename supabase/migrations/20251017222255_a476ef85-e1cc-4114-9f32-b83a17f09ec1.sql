-- Table de configuration des modèles de bulletins
CREATE TABLE public.report_card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Configuration des sections
  show_header BOOLEAN DEFAULT true,
  show_student_photo BOOLEAN DEFAULT true,
  show_student_info BOOLEAN DEFAULT true,
  show_academic_info BOOLEAN DEFAULT true,
  show_grades_table BOOLEAN DEFAULT true,
  show_average BOOLEAN DEFAULT true,
  show_class_average BOOLEAN DEFAULT true,
  show_appreciation BOOLEAN DEFAULT true,
  show_absences BOOLEAN DEFAULT true,
  show_signature BOOLEAN DEFAULT true,
  
  -- Ordre des sections (JSON array avec ordre des sections)
  sections_order JSONB DEFAULT '["header", "student_info", "academic_info", "grades_table", "average", "appreciation", "absences", "signature"]'::jsonb,
  
  -- Personnalisation visuelle
  header_color TEXT DEFAULT '#1e40af',
  logo_url TEXT,
  footer_text TEXT,
  
  -- Champs affichés pour l'étudiant
  student_fields JSONB DEFAULT '["first_name", "last_name", "birth_date", "class_name"]'::jsonb,
  
  -- Configuration des notes
  show_weighting BOOLEAN DEFAULT true,
  show_max_grade BOOLEAN DEFAULT true,
  show_assessment_type BOOLEAN DEFAULT true
);

-- Activer RLS
ALTER TABLE public.report_card_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage report card templates"
  ON public.report_card_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view report card templates"
  ON public.report_card_templates
  FOR SELECT
  USING (is_active = true);

-- Trigger pour updated_at
CREATE TRIGGER update_report_card_templates_updated_at
  BEFORE UPDATE ON public.report_card_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer un modèle par défaut
INSERT INTO public.report_card_templates (
  name,
  is_default,
  is_active
) VALUES (
  'Modèle Standard',
  true,
  true
);