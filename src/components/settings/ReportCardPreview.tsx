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
      <div className="max-w-4xl mx-auto bg-white shadow-lg" style={{ 
        minHeight: "842px",
        fontFamily: "'Inter', sans-serif",
        fontSize: "10pt",
        lineHeight: "1.6",
        color: "#1a1a1a",
        padding: "40px 50px"
      }}>
        <div className="space-y-6">
          {/* En-tête */}
          {template.show_header && (
            <div 
              style={{ 
                borderBottom: `1px solid ${template.header_color}`,
                paddingBottom: "20px",
                marginBottom: "30px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between"
              }}
            >
              {template.logo_url && (
                <img 
                  src={template.logo_url} 
                  alt="Logo école" 
                  style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "contain", marginBottom: "10px" }}
                />
              )}
              <div style={{ flex: 1, textAlign: template.logo_url ? "center" : "left" }}>
                <h1 style={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "20pt",
                  fontWeight: "700",
                  color: template.header_color,
                  marginBottom: "4px",
                  letterSpacing: "0.5px"
                }}>BULLETIN SCOLAIRE</h1>
                <p style={{ fontSize: "9pt", color: "#666", fontWeight: "400", marginBottom: "2px" }}>
                  {sampleStudent.schoolYear} - {sampleStudent.period}
                </p>
              </div>
              {template.logo_url && <div style={{ width: "80px" }} />}
            </div>
          )}

          {/* Informations étudiant */}
          {template.show_student_info && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "25px",
              padding: "15px 0",
              borderTop: "1px solid #e5e7eb",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "14pt",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "4px"
                }}>
                  {sampleStudent.firstName} {sampleStudent.lastName}
                </div>
                <div style={{ fontSize: "9pt", color: "#666" }}>
                  Classe: {sampleStudent.className} • Né(e) le: 15/03/2000
                </div>
              </div>
            </div>
          )}

          {/* Informations académiques */}
          {template.show_academic_info && (
            <div style={{
              background: "#f9fafb",
              borderLeft: `2px solid ${template.header_color}`,
              padding: "15px 20px",
              marginBottom: "25px",
              fontSize: "9pt"
            }}>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span style={{ fontWeight: "500", color: "#555", width: "140px" }}>Année scolaire :</span>
                <span style={{ color: "#1a1a1a", fontWeight: "400" }}>{sampleStudent.schoolYear}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span style={{ fontWeight: "500", color: "#555", width: "140px" }}>Période :</span>
                <span style={{ color: "#1a1a1a", fontWeight: "400" }}>{sampleStudent.period}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ fontWeight: "500", color: "#555", width: "140px" }}>Niveau :</span>
                <span style={{ color: "#1a1a1a", fontWeight: "400" }}>{sampleStudent.className}</span>
              </div>
            </div>
          )}

          {/* Tableau des notes */}
          {template.show_grades_table && (
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ 
                fontFamily: "'Playfair Display', serif",
                fontSize: "12pt",
                fontWeight: "600",
                color: template.header_color,
                marginBottom: "15px",
                paddingBottom: "8px",
                borderBottom: "1px solid #e5e7eb"
              }}>Résultats par matière</h2>
              {sampleGrades.map((grade, idx) => (
                <div key={idx} style={{
                  marginBottom: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    background: `linear-gradient(to right, ${template.header_color}15, transparent)`,
                    padding: "10px 15px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "10pt", color: "#1a1a1a" }}>
                        {grade.subject}
                      </div>
                      {template.show_weighting && (
                        <div style={{ fontSize: "8pt", color: "#666" }}>
                          Coefficient: {grade.weighting}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "16pt",
                      fontWeight: "600",
                      color: template.header_color
                    }}>
                      {grade.grade}<span style={{ fontSize: "10pt", color: "#999" }}>/20</span>
                    </div>
                  </div>
                  {template.show_grade_detail && (
                    <div style={{ padding: "10px 15px", background: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "9pt" }}>
                        <span style={{ color: "#555" }}>{template.show_assessment_type ? grade.type : 'Évaluation'}</span>
                        <span style={{ fontWeight: "500", color: "#1a1a1a" }}>
                          {grade.grade} / {template.show_max_grade ? grade.max : 20}
                        </span>
                      </div>
                      {template.show_appreciation && grade.appreciation && (
                        <div style={{ fontSize: "9pt", color: "#666", fontStyle: "italic", marginTop: "4px" }}>
                          {grade.appreciation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Moyennes */}
          {template.show_average && (
            <div style={{
              background: `linear-gradient(135deg, ${template.header_color}10, ${template.header_color}05)`,
              border: `1px solid ${template.header_color}30`,
              borderRadius: "4px",
              padding: "20px",
              textAlign: "center",
              marginBottom: "25px"
            }}>
              <div style={{ fontSize: "10pt", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "500" }}>
                Moyenne générale
              </div>
              <div style={{ 
                fontFamily: "'Playfair Display', serif",
                fontSize: "32pt",
                fontWeight: "700",
                color: template.header_color,
                lineHeight: "1"
              }}>
                {average.toFixed(2)}<span style={{ fontSize: "14pt", color: "#999" }}>/20</span>
              </div>
              {template.show_class_average && (
                <div style={{ marginTop: "10px", fontSize: "9pt", color: "#666" }}>
                  Moyenne de classe : {classAverage.toFixed(2)}/20
                </div>
              )}
            </div>
          )}

          {/* Absences */}
          {template.show_absences && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px", marginBottom: "25px" }}>
              <div style={{ fontSize: "9pt" }}>
                <span style={{ fontWeight: "500" }}>Absences :</span> {absences} demi-journées
              </div>
            </div>
          )}

          {/* Appréciation générale */}
          {template.show_appreciation && (
            <div style={{
              background: "#f9fafb",
              borderLeft: `2px solid ${template.header_color}`,
              padding: "15px 20px",
              marginBottom: "25px",
              fontSize: "9pt",
              lineHeight: "1.6",
              color: "#333"
            }}>
              <h3 style={{ fontWeight: "600", marginBottom: "8px", color: "#1a1a1a" }}>
                Appréciation générale
              </h3>
              <div style={{ fontStyle: "italic" }}>
                Bon trimestre dans l'ensemble. L'élève fait preuve de sérieux et d'implication dans son travail.
              </div>
            </div>
          )}

          {/* Signature */}
          {template.show_signature && (
            <div style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9pt", color: "#666", marginBottom: "15px" }}>
                  Le Directeur des Études
                </div>
                <div style={{ width: "200px", borderTop: "1px solid #ccc", marginTop: "50px" }} />
              </div>
            </div>
          )}

          {/* Pied de page */}
          {template.footer_text && (
            <div style={{ 
              marginTop: "40px",
              paddingTop: "15px",
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              fontSize: "8pt",
              color: "#999"
            }}>
              {template.footer_text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
