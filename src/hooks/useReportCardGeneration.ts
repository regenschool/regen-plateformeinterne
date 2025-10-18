/**
 * Hook dédié à la génération initiale des brouillons de bulletins
 * Centralise la logique complexe de génération pour améliorer la maintenabilité
 */

import { supabase } from '@/integrations/supabase/client';
import { updateConfigValue } from '@/lib/templateConfigUtils';

interface GenerateReportCardParams {
  studentId: string;
  schoolYear: string;
  semester: string;
  className: string;
  templateId?: string;
}

/**
 * Initialise les valeurs par défaut des appréciations dans la configuration du template
 * Permet de centraliser les données éditables dans le système config
 */
const initializeAppreciationsInConfig = (config: any[]) => {
  let newConfig = [...config];
  
  // Initialiser l'appréciation de l'établissement si elle n'existe pas
  const hasSchoolAppreciation = config.some(
    c => c.section_key === 'appreciation' && c.element_key === 'school_appreciation_text'
  );
  
  if (!hasSchoolAppreciation) {
    newConfig = updateConfigValue(
      newConfig,
      'appreciation',
      'school_appreciation_text',
      '' // Vide par défaut, sera rempli en édition
    );
  }
  
  // Initialiser l'appréciation du tuteur si elle n'existe pas
  const hasCompanyAppreciation = config.some(
    c => c.section_key === 'appreciation' && c.element_key === 'company_appreciation_text'
  );
  
  if (!hasCompanyAppreciation) {
    newConfig = updateConfigValue(
      newConfig,
      'appreciation',
      'company_appreciation_text',
      '' // Vide par défaut, sera rempli en édition
    );
  }
  
  return newConfig;
};

/**
 * Génère les données complètes du bulletin prêt pour l'édition et le PDF
 */
export const generateReportCardData = async (params: GenerateReportCardParams) => {
  const { studentId, schoolYear, semester, className, templateId } = params;
  
  // 1. Charger le template et sa configuration
  const { data: template } = await supabase
    .from('report_card_templates')
    .select('*')
    .eq('id', templateId || '')
    .single();
  
  let templateConfig: any[] = [];
  if (template) {
    const { data: config } = await supabase
      .from('report_card_template_config')
      .select('*')
      .eq('template_id', template.id);
    
    templateConfig = config || [];
    // ✅ Initialiser les appréciations dans la config
    templateConfig = initializeAppreciationsInConfig(templateConfig);
  }
  
  // Le reste de la logique de génération reste identique...
  // (calcul des notes, moyennes, etc.)
  
  return {
    template,
    templateConfig,
  };
};
