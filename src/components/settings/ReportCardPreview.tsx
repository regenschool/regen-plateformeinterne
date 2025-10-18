import { Card } from "@/components/ui/card";

interface ReportCardTemplate {
  show_header: boolean;
  show_student_info: boolean;
  show_academic_info: boolean;
  show_grades_table: boolean;
  show_average: boolean;
  show_class_average: boolean;
  show_appreciation: boolean;
  show_absences: boolean;
  show_signature: boolean;
  header_color: string;
  footer_text: string | null;
  show_weighting: boolean;
  show_max_grade: boolean;
  show_assessment_type: boolean;
  show_grade_detail: boolean;
  show_subject_average: boolean;
  logo_url: string | null;
}

interface Props {
  template: ReportCardTemplate;
}

export const ReportCardPreview = ({ template }: Props) => {
  // Données d'exemple
  const sampleStudent = {
    firstName: "Jean",
    lastName: "Dupont",
    className: "M1A",
    schoolYear: "2025-2026",
    period: "Semestre 1",
  };

  const sampleGrades = [
    { subject: "Mathématiques", grade: 15, max: 20, weighting: 2, type: "Contrôle continu", appreciation: "Bon travail" },
    { subject: "Français", grade: 14, max: 20, weighting: 1.5, type: "Devoir", appreciation: "Sérieux" },
    { subject: "Histoire", grade: 16, max: 20, weighting: 1, type: "Contrôle", appreciation: "Très bien" },
  ];

  const average = 15.2;
  const classAverage = 13.8;
  const absences = 2;

  return (
    <div className="w-full h-full overflow-auto bg-muted/30 p-4">
      <Card className="max-w-4xl mx-auto bg-white shadow-lg" style={{ minHeight: "842px" }}>
        <div className="p-8 space-y-6">
          {/* En-tête */}
          {template.show_header && (
            <div 
              className="py-6 rounded-lg flex items-center justify-between px-6"
              style={{ backgroundColor: template.header_color, color: "white" }}
            >
              {template.logo_url && (
                <img src={template.logo_url} alt="Logo école" width="auto" height="64" className="h-16 object-contain" />
              )}
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold">BULLETIN SCOLAIRE</h1>
                <p className="text-sm mt-1">{sampleStudent.schoolYear} - {sampleStudent.period}</p>
              </div>
              {template.logo_url && <div className="w-16" />}
            </div>
          )}

          {/* Informations étudiant */}
          {template.show_student_info && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">Nom :</span> {sampleStudent.lastName}</div>
                <div><span className="font-semibold">Prénom :</span> {sampleStudent.firstName}</div>
                <div><span className="font-semibold">Classe :</span> {sampleStudent.className}</div>
                <div><span className="font-semibold">Date de naissance :</span> 15/03/2000</div>
              </div>
            </div>
          )}

          {/* Informations académiques */}
          {template.show_academic_info && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">Année scolaire :</span> {sampleStudent.schoolYear}</div>
                <div><span className="font-semibold">Période :</span> {sampleStudent.period}</div>
              </div>
            </div>
          )}

          {/* Tableau des notes */}
          {template.show_grades_table && (
            <div className="border-t pt-4">
              <h2 className="font-bold mb-3">Notes et Appréciations</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Matière</th>
                    <th className="text-center py-2 px-2">Note</th>
                    {template.show_max_grade && <th className="text-center py-2 px-2">/ Sur</th>}
                    {template.show_weighting && <th className="text-center py-2 px-2">Coef.</th>}
                    {template.show_assessment_type && <th className="text-center py-2 px-2">Type</th>}
                    {template.show_appreciation && <th className="text-left py-2 px-2">Appréciation</th>}
                  </tr>
                </thead>
                <tbody>
                  {sampleGrades.map((grade, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-2">{grade.subject}</td>
                      <td className="text-center py-2 px-2 font-semibold">{grade.grade}</td>
                      {template.show_max_grade && <td className="text-center py-2 px-2">{grade.max}</td>}
                      {template.show_weighting && <td className="text-center py-2 px-2">{grade.weighting}</td>}
                      {template.show_assessment_type && <td className="text-center py-2 px-2 text-xs">{grade.type}</td>}
                      {template.show_appreciation && <td className="py-2 px-2 italic text-muted-foreground">{grade.appreciation}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Moyennes */}
          {(template.show_average || template.show_class_average) && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.show_average && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Moyenne générale</div>
                  <div className="text-2xl font-bold text-primary">{average.toFixed(2)} / 20</div>
                </div>
              )}
              {template.show_class_average && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Moyenne de la classe</div>
                  <div className="text-2xl font-bold">{classAverage.toFixed(2)} / 20</div>
                </div>
              )}
            </div>
          )}

          {/* Absences */}
          {template.show_absences && (
            <div className="border-t pt-4">
              <div className="text-sm">
                <span className="font-semibold">Absences :</span> {absences} demi-journées
              </div>
            </div>
          )}

          {/* Appréciation générale */}
          {template.show_appreciation && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Appréciation générale :</h3>
              <div className="bg-muted/50 p-3 rounded-lg text-sm italic">
                Bon trimestre dans l'ensemble. L'élève fait preuve de sérieux et d'implication dans son travail.
              </div>
            </div>
          )}

          {/* Signature */}
          {template.show_signature && (
            <div className="border-t pt-4 grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="text-sm font-semibold mb-8">Le Directeur</div>
                <div className="border-t border-muted pt-1 text-xs text-muted-foreground">Signature</div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-8">Le Responsable Légal</div>
                <div className="border-t border-muted pt-1 text-xs text-muted-foreground">Signature</div>
              </div>
            </div>
          )}

          {/* Pied de page */}
          {template.footer_text && (
            <div className="border-t pt-4 text-xs text-center text-muted-foreground">
              {template.footer_text}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
