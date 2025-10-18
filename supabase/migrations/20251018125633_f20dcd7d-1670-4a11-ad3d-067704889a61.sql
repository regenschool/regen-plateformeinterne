-- Restructuration complète du système de modèles de bulletins
-- Architecture: sections → éléments pour plus de modularité

-- 1. Table des sections de bulletin
CREATE TABLE IF NOT EXISTS public.report_card_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE, -- 'header', 'student_info', 'grades_table', 'footer'
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Table des éléments de sections (configurables par template)
CREATE TABLE IF NOT EXISTS public.report_card_section_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL REFERENCES public.report_card_sections(section_key) ON DELETE CASCADE,
  element_key TEXT NOT NULL, -- 'title', 'logo', 'school_name', 'student_first_name', etc.
  label TEXT NOT NULL,
  element_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'variable', 'image', 'number'
  display_order INTEGER NOT NULL DEFAULT 0,
  is_editable_in_draft BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_key, element_key)
);

-- 3. Table de configuration des templates (relation template → section → élément)
CREATE TABLE IF NOT EXISTS public.report_card_template_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.report_card_templates(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL REFERENCES public.report_card_sections(section_key) ON DELETE CASCADE,
  element_key TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_editable BOOLEAN NOT NULL DEFAULT true,
  default_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (section_key, element_key) REFERENCES public.report_card_section_elements(section_key, element_key) ON DELETE CASCADE,
  UNIQUE(template_id, section_key, element_key)
);

-- Trigger pour updated_at
CREATE TRIGGER update_report_card_template_config_updated_at
  BEFORE UPDATE ON public.report_card_template_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Insertion des sections standards
INSERT INTO public.report_card_sections (section_key, label, display_order) VALUES
  ('header', 'En-tête du bulletin', 1),
  ('student_info', 'Section étudiant', 2),
  ('grades_table', 'Tableau des notes', 3),
  ('footer', 'Pied de page', 4)
ON CONFLICT (section_key) DO NOTHING;

-- 5. Insertion des éléments de chaque section

-- Section Header
INSERT INTO public.report_card_section_elements (section_key, element_key, label, element_type, display_order, is_editable_in_draft) VALUES
  ('header', 'title', 'Titre', 'text', 1, true),
  ('header', 'logo', 'Logo de l''établissement', 'image', 2, true),
  ('header', 'school_name', 'Nom de l''école', 'text', 3, true),
  ('header', 'school_year', 'Année scolaire', 'variable', 4, false),
  ('header', 'semester', 'Semestre', 'variable', 5, false)
ON CONFLICT (section_key, element_key) DO NOTHING;

-- Section Student Info
INSERT INTO public.report_card_section_elements (section_key, element_key, label, element_type, display_order, is_editable_in_draft) VALUES
  ('student_info', 'first_name', 'Prénom', 'variable', 1, false),
  ('student_info', 'last_name', 'Nom', 'variable', 2, false),
  ('student_info', 'age', 'Âge', 'variable', 3, false),
  ('student_info', 'program_name', 'Nom du programme', 'variable', 4, false),
  ('student_info', 'class_name', 'Classe', 'variable', 5, false),
  ('student_info', 'photo', 'Photo de l''étudiant', 'image', 6, false)
ON CONFLICT (section_key, element_key) DO NOTHING;

-- Section Grades Table
INSERT INTO public.report_card_section_elements (section_key, element_key, label, element_type, display_order, is_editable_in_draft) VALUES
  ('grades_table', 'subject_category', 'Catégorie de la matière', 'variable', 1, false),
  ('grades_table', 'subject_name', 'Nom de la matière', 'variable', 2, false),
  ('grades_table', 'student_subject_average', 'Moyenne générale de l''étudiant à la matière', 'number', 3, true),
  ('grades_table', 'individual_grades', 'Détail des notes de la matière', 'variable', 4, false),
  ('grades_table', 'class_subject_average', 'Moyenne générale de la classe à la matière', 'number', 5, false),
  ('grades_table', 'class_min_average', 'Moyenne minimale de la classe à la matière', 'number', 6, false),
  ('grades_table', 'class_max_average', 'Moyenne maximale de la classe à la matière', 'number', 7, false),
  ('grades_table', 'subject_appreciation', 'Appréciation de la matière', 'text', 8, true),
  ('grades_table', 'student_general_average', 'Moyenne générale de l''étudiant pour le semestre', 'number', 9, true),
  ('grades_table', 'subject_weighting', 'Pondération de la matière', 'number', 10, false),
  ('grades_table', 'teacher_name', 'Nom du professeur', 'variable', 11, false),
  ('grades_table', 'company_appreciation', 'Appréciation générale d''un tuteur en entreprise', 'text', 12, true),
  ('grades_table', 'school_appreciation', 'Appréciation générale de l''établissement', 'text', 13, true)
ON CONFLICT (section_key, element_key) DO NOTHING;

-- Section Footer
INSERT INTO public.report_card_section_elements (section_key, element_key, label, element_type, display_order, is_editable_in_draft) VALUES
  ('footer', 'signature', 'Signature', 'image', 1, true),
  ('footer', 'signatory_title', 'Titre du signataire', 'text', 2, true),
  ('footer', 'school_name_footer', 'Nom de l''établissement et copyright', 'text', 3, true)
ON CONFLICT (section_key, element_key) DO NOTHING;

-- 6. RLS Policies
ALTER TABLE public.report_card_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_section_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_template_config ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs authentifiés peuvent voir les sections et éléments
CREATE POLICY "Anyone authenticated can view sections" ON public.report_card_sections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can view section elements" ON public.report_card_section_elements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seuls les admins peuvent gérer les configurations de templates
CREATE POLICY "Admins can manage template config" ON public.report_card_template_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view template config" ON public.report_card_template_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 7. Ajouter une colonne pour le style display format dans la table template_config
ALTER TABLE public.report_card_template_config 
  ADD COLUMN IF NOT EXISTS style_options JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.report_card_template_config.style_options IS 'Options de style pour cet élément (ex: {"format": "fraction"} pour les notes)';