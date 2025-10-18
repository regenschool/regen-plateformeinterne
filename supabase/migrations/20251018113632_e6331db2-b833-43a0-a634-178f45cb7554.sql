-- Add signature_url and show_individual_grades to report_card_templates
ALTER TABLE report_card_templates
ADD COLUMN IF NOT EXISTS signature_url text,
ADD COLUMN IF NOT EXISTS show_individual_grades boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_min_max_grades boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_program_name boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS program_name text DEFAULT 'Programme de Formation';

COMMENT ON COLUMN report_card_templates.signature_url IS 'URL de la signature (upload depuis Supabase Storage)';
COMMENT ON COLUMN report_card_templates.show_individual_grades IS 'Afficher les notes individuelles des épreuves par matière';
COMMENT ON COLUMN report_card_templates.show_min_max_grades IS 'Afficher les moyennes min/max par matière';
COMMENT ON COLUMN report_card_templates.show_program_name IS 'Afficher le nom du programme dans l''en-tête';
COMMENT ON COLUMN report_card_templates.program_name IS 'Nom du programme de formation';