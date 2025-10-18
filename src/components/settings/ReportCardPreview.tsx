import { ScrollArea } from "@/components/ui/scroll-area";
import { useTemplateConfig } from "@/hooks/useReportCardTemplateConfig";
import { Loader2 } from "lucide-react";
import { 
  isVisible as checkVisible, 
  getDefaultValue 
} from "@/lib/templateConfigUtils";

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
  const { data: config, isLoading, dataUpdatedAt } = useTemplateConfig(template.id);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const headerColor = template.header_color || '#1e40af';
  const title = getDefaultValue(config, 'header', 'title', 'Bulletin de Notes');
  const schoolName = getDefaultValue(config, 'header', 'school_name', 'École Exemple');
  const logo = getDefaultValue(config, 'header', 'logo') || template.logo_url;
  const signature = getDefaultValue(config, 'footer', 'signature');
  const signatoryTitle = getDefaultValue(config, 'footer', 'signatory_title', 'Le Directeur');
  const footerText = getDefaultValue(config, 'footer', 'school_name_footer') || template.footer_text || 'Document généré automatiquement';
  const schoolAppreciation = getDefaultValue(config, 'appreciation', 'school_appreciation_text', 'Bon trimestre. L\'élève montre de l\'intérêt et de la motivation. Continuez vos efforts.');
  const companyAppreciation = getDefaultValue(config, 'appreciation', 'company_appreciation_text', 'Excellente intégration dans l\'équipe. L\'élève fait preuve d\'autonomie et de professionnalisme.');

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
    <ScrollArea className="h-[70vh]" key={`preview-${template.id}-${dataUpdatedAt}`}>
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-3xl mx-auto">
        
        {/* En-tête */}
        {checkVisible(config, 'header', 'title') && (
          <div 
            className="mb-6 p-6 rounded-lg"
            style={{ backgroundColor: headerColor, color: 'white' }}
          >
            <div className="flex items-center justify-between">
              {checkVisible(config, 'header', 'logo') && logo && (
                <img src={logo} alt="Logo" className="h-16 object-contain" />
              )}
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {checkVisible(config, 'header', 'school_name') && (
                  <p className="text-lg opacity-90">{schoolName}</p>
                )}
                {checkVisible(config, 'header', 'school_year') && (
                  <p className="text-sm opacity-80 mt-2">2024-2025 - 1er Semestre</p>
                )}
              </div>
              {checkVisible(config, 'header', 'logo') && logo && (
                <div className="w-16" />
              )}
            </div>
          </div>
        )}

        {/* Informations étudiant */}
        {(checkVisible(config, 'student_info', 'first_name') || 
          checkVisible(config, 'student_info', 'last_name') ||
          checkVisible(config, 'student_info', 'birth_date') ||
          checkVisible(config, 'student_info', 'class_name') ||
          checkVisible(config, 'student_info', 'age') ||
          checkVisible(config, 'student_info', 'program_name')) && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-lg mb-3" style={{ color: headerColor }}>
              Informations de l'élève
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {checkVisible(config, 'student_info', 'first_name') && (
                <div><strong>Prénom :</strong> Jean</div>
              )}
              {checkVisible(config, 'student_info', 'last_name') && (
                <div><strong>Nom :</strong> DUPONT</div>
              )}
              {checkVisible(config, 'student_info', 'birth_date') && (
                <div><strong>Date de naissance :</strong> 15/03/2010</div>
              )}
              {checkVisible(config, 'student_info', 'class_name') && (
                <div><strong>Classe :</strong> 3ème A</div>
              )}
              {checkVisible(config, 'student_info', 'age') && (
                <div><strong>Âge :</strong> 14 ans</div>
              )}
              {checkVisible(config, 'student_info', 'program_name') && (
                <div><strong>Programme :</strong> BTS Services Informatiques</div>
              )}
            </div>
          </div>
        )}

        {/* Tableau des notes */}
        {checkVisible(config, 'grades_table', 'table') && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3" style={{ color: headerColor }}>
              Résultats par matière
            </h2>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {checkVisible(config, 'grades_table', 'subject_name') && (
                    <th className="border p-2 text-left">Matière</th>
                  )}
                  {checkVisible(config, 'grades_table', 'student_subject_average') && (
                    <th className="border p-2 text-center">Moyenne</th>
                  )}
                  {checkVisible(config, 'grades_table', 'class_subject_average') && (
                    <th className="border p-2 text-center">Moy. Classe</th>
                  )}
                  {checkVisible(config, 'grades_table', 'class_min_average') && (
                    <th className="border p-2 text-center">Min</th>
                  )}
                  {checkVisible(config, 'grades_table', 'class_max_average') && (
                    <th className="border p-2 text-center">Max</th>
                  )}
                  {checkVisible(config, 'grades_table', 'subject_weighting') && (
                    <th className="border p-2 text-center">Coef.</th>
                  )}
                  {checkVisible(config, 'grades_table', 'teacher_name') && (
                    <th className="border p-2">Enseignant</th>
                  )}
                  {checkVisible(config, 'grades_table', 'subject_appreciation') && (
                    <th className="border p-2">Appréciation</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sampleGrades.map((grade, idx) => (
                  <tr key={idx}>
                    {checkVisible(config, 'grades_table', 'subject_name') && (
                      <td className="border p-2">
                        <div>
                          {grade.subject}
                          {checkVisible(config, 'grades_table', 'subject_category') && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {grade.category}
                            </span>
                          )}
                        </div>
                        {checkVisible(config, 'grades_table', 'individual_grades') && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                            <div className="font-semibold text-gray-600 mb-1">Détail des évaluations :</div>
                            <div className="flex justify-between"><span>Contrôle 1</span><span className="font-bold" style={{ color: headerColor }}>{(grade.grade - 1).toFixed(2)}/20</span></div>
                            <div className="flex justify-between"><span>Devoir Surveillé</span><span className="font-bold" style={{ color: headerColor }}>{(grade.grade + 0.5).toFixed(2)}/20</span></div>
                            <div className="flex justify-between"><span>TP</span><span className="font-bold" style={{ color: headerColor }}>{(grade.grade + 1).toFixed(2)}/20</span></div>
                          </div>
                        )}
                      </td>
                    )}
                    {checkVisible(config, 'grades_table', 'student_subject_average') && (
                      <td className="border p-2 text-center font-bold" style={{ color: headerColor }}>
                        {grade.grade.toFixed(2)}/20
                      </td>
                    )}
                    {checkVisible(config, 'grades_table', 'class_subject_average') && (
                      <td className="border p-2 text-center text-gray-600">{grade.classAvg.toFixed(2)}</td>
                    )}
                    {checkVisible(config, 'grades_table', 'class_min_average') && (
                      <td className="border p-2 text-center text-xs text-red-600">{grade.min.toFixed(2)}</td>
                    )}
                    {checkVisible(config, 'grades_table', 'class_max_average') && (
                      <td className="border p-2 text-center text-xs text-green-600">{grade.max.toFixed(2)}</td>
                    )}
                    {checkVisible(config, 'grades_table', 'subject_weighting') && (
                      <td className="border p-2 text-center">{grade.coef}</td>
                    )}
                    {checkVisible(config, 'grades_table', 'teacher_name') && (
                      <td className="border p-2 text-xs">{grade.teacher}</td>
                    )}
                    {checkVisible(config, 'grades_table', 'subject_appreciation') && (
                      <td className="border p-2 italic text-gray-600 text-xs">{grade.appreciation}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Moyenne générale */}
        {checkVisible(config, 'average', 'student_average') && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg mb-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Moyenne générale</p>
            <p className="text-4xl font-bold" style={{ color: headerColor }}>
              {studentAverage.toFixed(2)}<span className="text-xl text-gray-500">/20</span>
            </p>
            {checkVisible(config, 'average', 'class_average') && (
              <p className="text-sm text-gray-600 mt-2">
                Moyenne de classe : {classAverage.toFixed(2)}/20
              </p>
            )}
          </div>
        )}

        {/* Appréciations */}
        {checkVisible(config, 'appreciation', 'school_appreciation') && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2" style={{ color: headerColor }}>
              Appréciation de l'établissement
            </h3>
            <p className="text-sm text-gray-700 italic">
              {schoolAppreciation}
            </p>
          </div>
        )}

        {checkVisible(config, 'appreciation', 'company_appreciation') && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2" style={{ color: headerColor }}>
              Appréciation du tuteur en entreprise
            </h3>
            <p className="text-sm text-gray-700 italic">
              {companyAppreciation}
            </p>
          </div>
        )}

        {/* Signature */}
        {checkVisible(config, 'footer', 'signature') && (
          <div className="flex justify-end mt-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">{signatoryTitle}</p>
              {signature && (
                <>
                  <img src={signature} alt="Signature" className="max-w-[150px] max-h-[60px] object-contain mx-auto mb-2" />
                  <div className="w-48 border-t border-gray-400" />
                </>
              )}
              {!signature && (
                <div className="w-48 h-16 border-t border-gray-400 mt-4" />
              )}
            </div>
          </div>
        )}

        {/* Pied de page */}
        {checkVisible(config, 'footer', 'school_name_footer') && (
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
            {footerText}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
