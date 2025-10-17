-- Ajouter un champ html_template dans report_card_templates pour le template HTML personnalisé
ALTER TABLE report_card_templates 
ADD COLUMN html_template TEXT,
ADD COLUMN css_template TEXT,
ADD COLUMN use_custom_html BOOLEAN DEFAULT false;

-- Ajouter des commentaires
COMMENT ON COLUMN report_card_templates.html_template IS 'Template HTML personnalisé avec des variables {{student.firstName}}, {{grades}}, etc.';
COMMENT ON COLUMN report_card_templates.css_template IS 'CSS personnalisé pour le bulletin';
COMMENT ON COLUMN report_card_templates.use_custom_html IS 'Si true, utilise le template HTML personnalisé au lieu du template par défaut';