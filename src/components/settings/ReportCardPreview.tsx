import { ScrollArea } from "@/components/ui/scroll-area";
import { useTemplateConfig } from "@/hooks/useReportCardTemplateConfig";
import { Loader2 } from "lucide-react";

interface ReportCardTemplate {
  id: string;
  name: string;
  header_color?: string;
  logo_url?: string;
  footer_text?: string;
}

interface Props {
  template: ReportCardTemplate;
}

export const ReportCardPreview = ({ template }: Props) => {
  const { data: config, isLoading } = useTemplateConfig(template.id);

  const getConfigValue = (sectionKey: string, elementKey: string, property: 'is_visible' | 'default_value' = 'is_visible'): any => {
    if (!config) return property === 'is_visible' ? true : undefined;
    const item = config.find(c => c.section_key === sectionKey && c.element_key === elementKey);
    if (!item) return property === 'is_visible' ? true : undefined;
    return item[property];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const headerColor = template.header_color || '#1e40af';
  const title = getConfigValue('header', 'title', 'default_value') || 'Bulletin de Notes';
  const schoolName = getConfigValue('header', 'school_name', 'default_value') || 'École Exemple';
  const logo = getConfigValue('header', 'logo', 'default_value') || template.logo_url;
  const signature = getConfigValue('footer', 'signature', 'default_value');
  const signatoryTitle = getConfigValue('footer', 'signatory_title', 'default_value') || 'Le Directeur';
  const footerText = getConfigValue('footer', 'school_name_footer', 'default_value') || template.footer_text || 'Document généré automatiquement';

  // Données d'exemple
  const sampleGrades = [
    { subject: 'Mathématiques', category: 'Sciences', grade: 15.5, coef: 3, appreciation: 'Très bon travail', teacher: 'M. Dupont', classAvg: 12.3, min: 8.5, max: 18.2 },
    { subject: 'Français', category: 'Lettres', grade: 14.0, coef: 3, appreciation: 'Bonne progression', teacher: 'Mme Martin', classAvg: 13.1, min: 9.0, max: 17.5 },
    { subject: 'Anglais', category: 'Langues', grade: 16.5, coef: 2, appreciation: 'Excellent niveau', teacher: 'Mrs Smith', classAvg: 14.2, min: 10.5, max: 18.0 },
    { subject: 'Histoire-Géo', category: 'Sciences Humaines', grade: 13.0, coef: 2, appreciation: 'Travail satisfaisant', teacher: 'M. Bernard', classAvg: 12.8, min: 7.5, max: 16.5 },
  ];

  const studentAverage = 14.8;
  const classAverage = 13.1;

  return (
    <ScrollArea className="h-[70vh]">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-3xl mx-auto">
        
        {/* En-tête */}
        {getConfigValue('header', 'title', 'is_visible') && (
          <div 
            className="mb-6 p-6 rounded-lg"
            style={{ backgroundColor: headerColor, color: 'white' }}
          >
            <div className="flex items-center justify-between">
              {getConfigValue('header', 'logo', 'is_visible') && logo && (
                <img src={logo} alt="Logo" className="h-16 object-contain" />
              )}
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {getConfigValue('header', 'school_name', 'is_visible') && (
                  <p className="text-lg opacity-90">{schoolName}</p>
                )}
                {getConfigValue('header', 'school_year', 'is_visible') && (
                  <p className="text-sm opacity-80 mt-2">2024-2025 - 1er Semestre</p>
                )}
              </div>
              {getConfigValue('header', 'logo', 'is_visible') && logo && (
                <div className="w-16" />
              )}
            </div>
          </div>
        )}

        {/* Informations étudiant */}
        {getConfigValue('student_info', 'first_name', 'is_visible') && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-lg mb-3" style={{ color: headerColor }}>
              Informations de l'élève
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {getConfigValue('student_info', 'first_name', 'is_visible') && (
                <div><strong>Prénom :</strong> Jean</div>
              )}
              {getConfigValue('student_info', 'last_name', 'is_visible') && (
                <div><strong>Nom :</strong> DUPONT</div>
              )}
              {getConfigValue('student_info', 'class_name', 'is_visible') && (
                <div><strong>Classe :</strong> 3ème A</div>
              )}
              {getConfigValue('student_info', 'age', 'is_visible') && (
                <div><strong>Âge :</strong> 14 ans</div>
              )}
              {getConfigValue('student_info', 'program_name', 'is_visible') && (
                <div><strong>Programme :</strong> Général</div>
              )}
            </div>
          </div>
        )}

        {/* Tableau des notes */}
        {getConfigValue('grades_table', 'subject_name', 'is_visible') && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3" style={{ color: headerColor }}>
              Résultats par matière
            </h2>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {getConfigValue('grades_table', 'subject_name', 'is_visible') && (
                    <th className="border p-2 text-left">Matière</th>
                  )}
                  {getConfigValue('grades_table', 'student_subject_average', 'is_visible') && (
                    <th className="border p-2 text-center">Moyenne</th>
                  )}
                  {getConfigValue('grades_table', 'class_subject_average', 'is_visible') && (
                    <th className="border p-2 text-center">Moy. Classe</th>
                  )}
                  {getConfigValue('grades_table', 'class_min_average', 'is_visible') && (
                    <th className="border p-2 text-center">Min</th>
                  )}
                  {getConfigValue('grades_table', 'class_max_average', 'is_visible') && (
                    <th className="border p-2 text-center">Max</th>
                  )}
                  {getConfigValue('grades_table', 'subject_weighting', 'is_visible') && (
                    <th className="border p-2 text-center">Coef.</th>
                  )}
                  {getConfigValue('grades_table', 'teacher_name', 'is_visible') && (
                    <th className="border p-2">Enseignant</th>
                  )}
                  {getConfigValue('grades_table', 'subject_appreciation', 'is_visible') && (
                    <th className="border p-2">Appréciation</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sampleGrades.map((grade, idx) => (
                  <tr key={idx}>
                    {getConfigValue('grades_table', 'subject_name', 'is_visible') && (
                      <td className="border p-2">
                        {grade.subject}
                        {getConfigValue('grades_table', 'subject_category', 'is_visible') && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {grade.category}
                          </span>
                        )}
                      </td>
                    )}
                    {getConfigValue('grades_table', 'student_subject_average', 'is_visible') && (
                      <td className="border p-2 text-center font-bold" style={{ color: headerColor }}>
                        {grade.grade.toFixed(2)}/20
                      </td>
                    )}
                    {getConfigValue('grades_table', 'class_subject_average', 'is_visible') && (
                      <td className="border p-2 text-center text-gray-600">{grade.classAvg.toFixed(2)}</td>
                    )}
                    {getConfigValue('grades_table', 'class_min_average', 'is_visible') && (
                      <td className="border p-2 text-center text-xs text-red-600">{grade.min.toFixed(2)}</td>
                    )}
                    {getConfigValue('grades_table', 'class_max_average', 'is_visible') && (
                      <td className="border p-2 text-center text-xs text-green-600">{grade.max.toFixed(2)}</td>
                    )}
                    {getConfigValue('grades_table', 'subject_weighting', 'is_visible') && (
                      <td className="border p-2 text-center">{grade.coef}</td>
                    )}
                    {getConfigValue('grades_table', 'teacher_name', 'is_visible') && (
                      <td className="border p-2 text-xs">{grade.teacher}</td>
                    )}
                    {getConfigValue('grades_table', 'subject_appreciation', 'is_visible') && (
                      <td className="border p-2 italic text-gray-600 text-xs">{grade.appreciation}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Moyenne générale */}
        {getConfigValue('grades_table', 'student_general_average', 'is_visible') && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg mb-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Moyenne générale</p>
            <p className="text-4xl font-bold" style={{ color: headerColor }}>
              {studentAverage.toFixed(2)}<span className="text-xl text-gray-500">/20</span>
            </p>
            {getConfigValue('grades_table', 'class_subject_average', 'is_visible') && (
              <p className="text-sm text-gray-600 mt-2">
                Moyenne de classe : {classAverage.toFixed(2)}/20
              </p>
            )}
          </div>
        )}

        {/* Appréciations */}
        {getConfigValue('grades_table', 'school_appreciation', 'is_visible') && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2" style={{ color: headerColor }}>
              Appréciation de l'établissement
            </h3>
            <p className="text-sm text-gray-700 italic">
              Bon trimestre. L'élève montre de l'intérêt et de la motivation. Continuez vos efforts.
            </p>
          </div>
        )}

        {getConfigValue('grades_table', 'company_appreciation', 'is_visible') && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2" style={{ color: headerColor }}>
              Appréciation du tuteur en entreprise
            </h3>
            <p className="text-sm text-gray-700 italic">
              Exemple d'appréciation du tuteur...
            </p>
          </div>
        )}

        {/* Signature */}
        {getConfigValue('footer', 'signature', 'is_visible') && signature && (
          <div className="flex justify-end mt-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">{signatoryTitle}</p>
              <img src={signature} alt="Signature" className="max-w-[150px] max-h-[60px] object-contain mx-auto mb-2" />
              <div className="w-48 border-t border-gray-400" />
            </div>
          </div>
        )}

        {/* Pied de page */}
        {getConfigValue('footer', 'school_name_footer', 'is_visible') && (
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
            {footerText}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
