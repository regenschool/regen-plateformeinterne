/**
 * Utilitaires centralisés pour la gestion de la configuration des templates de bulletins
 * Utilisé par ReportCardEditor, ReportCardPreview et generate-report-card-pdf-v2
 */

export interface TemplateConfig {
  section_key: string;
  element_key: string;
  is_visible: boolean;
  is_editable: boolean;
  default_value?: string;
  style_options?: {
    format?: 'fraction' | 'percentage' | 'points';
    [key: string]: any;
  };
}

/**
 * Récupère une valeur de configuration depuis le tableau config
 * @param config - Tableau de configuration du template
 * @param sectionKey - Clé de la section (ex: 'header', 'student_info')
 * @param elementKey - Clé de l'élément (ex: 'title', 'first_name')
 * @param property - Propriété à récupérer ('is_visible', 'is_editable', 'default_value', 'style_options')
 * @returns La valeur de la propriété ou une valeur par défaut
 */
export const getConfigValue = <T = any>(
  config: TemplateConfig[] | undefined | null,
  sectionKey: string,
  elementKey: string,
  property: 'is_visible' | 'is_editable' | 'default_value' | 'style_options' = 'is_visible'
): T | undefined => {
  if (!config) {
    return property === 'is_visible' ? (true as T) : undefined;
  }
  
  const item = config.find(
    c => c.section_key === sectionKey && c.element_key === elementKey
  );
  
  if (!item) {
    return property === 'is_visible' ? (true as T) : undefined;
  }
  
  return item[property] as T;
};

/**
 * Vérifie si un élément est visible
 */
export const isVisible = (
  config: TemplateConfig[] | undefined | null,
  sectionKey: string,
  elementKey: string
): boolean => {
  return getConfigValue<boolean>(config, sectionKey, elementKey, 'is_visible') !== false;
};

/**
 * Vérifie si un élément est éditable
 */
export const isEditable = (
  config: TemplateConfig[] | undefined | null,
  sectionKey: string,
  elementKey: string
): boolean => {
  return getConfigValue<boolean>(config, sectionKey, elementKey, 'is_editable') !== false;
};

/**
 * Récupère la valeur par défaut d'un élément
 */
export const getDefaultValue = (
  config: TemplateConfig[] | undefined | null,
  sectionKey: string,
  elementKey: string,
  fallback: string = ''
): string => {
  return getConfigValue<string>(config, sectionKey, elementKey, 'default_value') || fallback;
};

/**
 * Met à jour ou crée une valeur dans la configuration
 */
export const updateConfigValue = (
  config: TemplateConfig[],
  sectionKey: string,
  elementKey: string,
  value: any,
  property: 'default_value' | 'is_visible' | 'is_editable' = 'default_value'
): TemplateConfig[] => {
  const newConfig = [...config];
  const itemIndex = newConfig.findIndex(
    c => c.section_key === sectionKey && c.element_key === elementKey
  );

  if (itemIndex >= 0) {
    newConfig[itemIndex] = { ...newConfig[itemIndex], [property]: value };
  } else {
    newConfig.push({
      section_key: sectionKey,
      element_key: elementKey,
      is_visible: true,
      is_editable: true,
      [property]: value,
    });
  }

  return newConfig;
};

/**
 * Valide la cohérence d'une configuration de template
 * Retourne un tableau d'erreurs (vide si tout est OK)
 */
export const validateTemplateConfig = (config: TemplateConfig[] | undefined | null): string[] => {
  const errors: string[] = [];

  if (!config || !Array.isArray(config)) {
    errors.push('Configuration du template manquante ou invalide');
    return errors;
  }

  // Vérifier que les éléments obligatoires sont présents
  const requiredElements = [
    { section: 'header', element: 'title' },
    { section: 'student_info', element: 'first_name' },
    { section: 'student_info', element: 'last_name' },
  ];

  requiredElements.forEach(({ section, element }) => {
    if (!isVisible(config, section, element)) {
      console.warn(`Élément recommandé masqué: ${section}.${element}`);
    }
  });

  return errors;
};

/**
 * Formate une note selon le format spécifié
 */
export const formatGrade = (grade: number, maxGrade: number, format?: string): string => {
  const normalized = (grade / maxGrade) * 20;
  
  switch (format) {
    case 'percentage':
      return `${((grade / maxGrade) * 100).toFixed(1)}%`;
    case 'points':
      return normalized.toFixed(2);
    case 'fraction':
    default:
      return `${normalized.toFixed(2)}/20`;
  }
};
