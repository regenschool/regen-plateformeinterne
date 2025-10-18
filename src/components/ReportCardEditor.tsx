import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Eye, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveDraft, useGenerateFinalPDF } from '@/hooks/useReportCardActions';

interface Grade {
  subject: string;
  grade: number;
  maxGrade: number;
  weighting: number;
  assessmentType: string;
  appreciation?: string;
  classAverage?: number;
  minAverage?: number;
  maxAverage?: number;
}

interface ReportCardData {
  student: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    className: string;
    photoUrl?: string;
  };
  academic: {
    schoolYear: string;
    semester: string;
  };
  grades: Grade[];
  template?: {
    id?: string;
    name: string;
    headerColor: string;
    logoUrl?: string;
    footerText?: string;
    sections: string[];
    htmlTemplate?: string;
    cssTemplate?: string;
    useCustomHtml?: boolean;
    show_header?: boolean;
    show_footer?: boolean;
    show_student_info?: boolean;
    show_academic_info?: boolean;
    show_grades_table?: boolean;
    show_average?: boolean;
    show_class_average?: boolean;
    show_appreciation?: boolean;
    show_student_photo?: boolean;
    show_logo?: boolean;
  };
  averages?: {
    student: number;
    class: number;
  };
  generalAppreciation?: string;
  title?: string;
  headerText?: string;
}

interface ReportCardEditorProps {
  reportCardId: string;
  initialData: ReportCardData;
  onClose?: () => void;
}

export const ReportCardEditor = ({
  reportCardId,
  initialData,
  onClose,
}: ReportCardEditorProps) => {
  const [editedData, setEditedData] = useState<ReportCardData>(initialData);
  const saveDraft = useSaveDraft();
  const generatePDF = useGenerateFinalPDF();

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  const handleSave = () => {
    saveDraft.mutate({ reportCardId, data: editedData });
  };

  const handleGeneratePdf = async () => {
    const result = await generatePDF.mutateAsync({ reportCardId, data: editedData });
    if (result.pdfUrl && onClose) {
      // Télécharger automatiquement le PDF
      window.open(result.pdfUrl, '_blank');
      onClose();
    }
  };

  const updateGradeAppreciation = (index: number, appreciation: string) => {
    const newGrades = [...editedData.grades];
    newGrades[index] = { ...newGrades[index], appreciation };
    setEditedData({ ...editedData, grades: newGrades });
  };

  const updateGradeValue = (index: number, grade: number) => {
    const newGrades = [...editedData.grades];
    newGrades[index] = { ...newGrades[index], grade };
    setEditedData({ ...editedData, grades: newGrades });
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Édition du bulletin - {editedData.student.firstName} {editedData.student.lastName}
              </CardTitle>
              <CardDescription>
                {editedData.academic.schoolYear} - {editedData.academic.semester} - {editedData.student.className}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSave} 
                disabled={saveDraft.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveDraft.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button 
                onClick={handleGeneratePdf}
                disabled={generatePDF.isPending}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {generatePDF.isPending ? 'Génération...' : 'Générer le PDF final'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche - Édition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Édition des données</CardTitle>
            <CardDescription>
              Modifiez les moyennes et appréciations avant la génération finale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Sections éditables selon le template */}
                {editedData.template?.show_header && (
                  <div className="space-y-2">
                    <Label>Titre du bulletin</Label>
                    <Input
                      value={editedData.title || 'BULLETIN SCOLAIRE'}
                      onChange={(e) =>
                        setEditedData({ ...editedData, title: e.target.value })
                      }
                      placeholder="Titre du bulletin..."
                    />
                  </div>
                )}

                {editedData.template?.show_header && (
                  <div className="space-y-2">
                    <Label>Texte d'en-tête (sous le titre)</Label>
                    <Input
                      value={editedData.headerText || ''}
                      onChange={(e) =>
                        setEditedData({ ...editedData, headerText: e.target.value })
                      }
                      placeholder="Texte facultatif sous le titre..."
                    />
                  </div>
                )}

                {editedData.template?.show_footer && (
                  <div className="space-y-2">
                    <Label>Texte du pied de page</Label>
                    <Textarea
                      value={editedData.template?.footerText || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          template: { ...editedData.template!, footerText: e.target.value },
                        })
                      }
                      placeholder="Informations de contact, mentions légales..."
                      rows={2}
                    />
                  </div>
                )}

                <Separator />

                {/* Appréciation générale */}
                {editedData.template?.show_appreciation && (
                  <div className="space-y-2">
                    <Label>Appréciation générale du bulletin</Label>
                    <Textarea
                      value={editedData.generalAppreciation || ''}
                      onChange={(e) =>
                        setEditedData({ ...editedData, generalAppreciation: e.target.value })
                      }
                      placeholder="Appréciation générale du semestre..."
                      rows={4}
                    />
                  </div>
                )}

                <Separator />

                {/* Édition des notes */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Moyennes et appréciations par matière</h3>
                  {editedData.grades.map((grade, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{grade.subject}</p>
                          <span className="text-sm text-muted-foreground">
                            {grade.assessmentType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Moyenne</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={grade.maxGrade}
                                step="0.01"
                                value={grade.grade}
                                onChange={(e) =>
                                  updateGradeValue(index, parseFloat(e.target.value) || 0)
                                }
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">
                                / {grade.maxGrade}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Coefficient</Label>
                            <p className="text-sm font-medium pt-2">{grade.weighting}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Appréciation</Label>
                          <Textarea
                            value={grade.appreciation || ''}
                            onChange={(e) => updateGradeAppreciation(index, e.target.value)}
                            placeholder="Appréciation pour cette matière..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Colonne droite - Aperçu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu en temps réel
            </CardTitle>
            <CardDescription>
              Visualisez les modifications avant génération (identique au PDF final)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4 bg-white p-6 rounded-lg border shadow-sm">
                {/* En-tête */}
                {editedData.template?.show_header !== false && (
                  <div 
                    className="p-6 rounded-lg flex items-center justify-between" 
                    style={{ backgroundColor: editedData.template?.headerColor || '#1e40af', color: 'white' }}
                  >
                    {editedData.template?.show_logo && editedData.template?.logoUrl && (
                      <img src={editedData.template.logoUrl} alt="Logo" className="h-16 object-contain" />
                    )}
                    <div className="text-center flex-1">
                      <h2 className="text-2xl font-bold">{editedData.title || 'BULLETIN SCOLAIRE'}</h2>
                      <p className="text-sm mt-1">{editedData.academic.schoolYear} - {editedData.academic.semester}</p>
                      {editedData.headerText && (
                        <p className="text-xs mt-1 opacity-90">{editedData.headerText}</p>
                      )}
                    </div>
                    {editedData.template?.show_logo && editedData.template?.logoUrl && <div className="w-16" />}
                  </div>
                )}

                {/* Informations de l'élève */}
                {editedData.template?.show_student_info !== false && (
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold text-lg">Informations de l'élève</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Nom:</strong> {editedData.student.lastName}</div>
                      <div><strong>Prénom:</strong> {editedData.student.firstName}</div>
                      <div><strong>Classe:</strong> {editedData.student.className}</div>
                      {editedData.student.birthDate && (
                        <div><strong>Date de naissance:</strong> {editedData.student.birthDate}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tableau des notes */}
                {editedData.template?.show_grades_table !== false && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Notes et Moyennes par Matière</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border p-3 text-left">Matière</th>
                            <th className="border p-3 text-center">Moyenne Élève</th>
                            {editedData.template?.show_class_average && (
                              <>
                                <th className="border p-3 text-center">Moy. Classe</th>
                                <th className="border p-3 text-center">Min</th>
                                <th className="border p-3 text-center">Max</th>
                              </>
                            )}
                            <th className="border p-3 text-center">Coef.</th>
                            <th className="border p-3 text-left">Appréciation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedData.grades.map((grade, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="border p-3 font-medium">{grade.subject}</td>
                              <td className="border p-3 text-center font-bold text-primary">
                                {grade.grade.toFixed(2)}/{grade.maxGrade}
                              </td>
                              {editedData.template?.show_class_average && (
                                <>
                                  <td className="border p-3 text-center text-muted-foreground">
                                    {grade.classAverage?.toFixed(2) || '-'}
                                  </td>
                                  <td className="border p-3 text-center text-xs text-destructive">
                                    {grade.minAverage?.toFixed(2) || '-'}
                                  </td>
                                  <td className="border p-3 text-center text-xs text-green-600">
                                    {grade.maxAverage?.toFixed(2) || '-'}
                                  </td>
                                </>
                              )}
                              <td className="border p-3 text-center">{grade.weighting}</td>
                              <td className="border p-3 text-sm italic text-muted-foreground">
                                {grade.appreciation || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-primary/5 font-bold">
                            <td className="border p-3" colSpan={editedData.template?.show_class_average ? 5 : 1}>
                              Moyenne générale
                            </td>
                            <td className="border p-3 text-center text-primary text-lg" colSpan={2}>
                              {editedData.averages?.student.toFixed(2)}/20
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Moyennes - uniquement si affichage séparé demandé */}
                {editedData.template?.show_average && editedData.averages && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Moyenne générale de l'élève</p>
                      <p className="text-3xl font-bold text-primary mt-1">
                        {editedData.averages.student.toFixed(2)}/20
                      </p>
                    </div>
                    {editedData.template?.show_class_average && (
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Moyenne de la classe</p>
                        <p className="text-3xl font-bold mt-1">
                          {editedData.averages.class.toFixed(2)}/20
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Appréciation générale */}
                {editedData.template?.show_appreciation !== false && editedData.generalAppreciation && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Appréciation générale</h4>
                    <p className="text-sm text-muted-foreground italic">
                      {editedData.generalAppreciation}
                    </p>
                  </div>
                )}

                {/* Footer */}
                {editedData.template?.show_footer !== false && editedData.template?.footerText && (
                  <div className="border-t pt-4 text-xs text-center text-muted-foreground">
                    {editedData.template.footerText}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
