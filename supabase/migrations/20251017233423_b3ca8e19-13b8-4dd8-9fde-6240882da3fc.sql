-- Ajouter plus de granularité dans les champs affichables du template
ALTER TABLE report_card_templates 
ADD COLUMN show_student_photo BOOLEAN DEFAULT true,
ADD COLUMN show_student_birth_date BOOLEAN DEFAULT true,
ADD COLUMN show_student_age BOOLEAN DEFAULT false,
ADD COLUMN show_logo BOOLEAN DEFAULT true,
ADD COLUMN show_footer BOOLEAN DEFAULT true,
ADD COLUMN show_subject_teacher BOOLEAN DEFAULT false,
ADD COLUMN show_general_appreciation BOOLEAN DEFAULT true,
ADD COLUMN grade_display_format TEXT DEFAULT 'fraction' CHECK (grade_display_format IN ('fraction', 'percentage', 'points'));

-- Ajouter des commentaires
COMMENT ON COLUMN report_card_templates.show_student_photo IS 'Afficher la photo de l''étudiant';
COMMENT ON COLUMN report_card_templates.show_student_birth_date IS 'Afficher la date de naissance';
COMMENT ON COLUMN report_card_templates.show_student_age IS 'Afficher l''âge de l''étudiant';
COMMENT ON COLUMN report_card_templates.show_logo IS 'Afficher le logo de l''établissement';
COMMENT ON COLUMN report_card_templates.show_footer IS 'Afficher le pied de page';
COMMENT ON COLUMN report_card_templates.show_subject_teacher IS 'Afficher le nom du professeur par matière';
COMMENT ON COLUMN report_card_templates.show_general_appreciation IS 'Afficher l''appréciation générale du bulletin';
COMMENT ON COLUMN report_card_templates.grade_display_format IS 'Format d''affichage des notes: fraction (15/20), percentage (75%), ou points (15pts)';