import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FileDown } from 'lucide-react';
import { useSaveDraft, useGenerateFinalPDF } from '@/hooks/useReportCardActions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  getConfigValue, 
  isVisible as checkVisible, 
  isEditable as checkEditable,
  getDefaultValue,
  updateConfigValue as updateConfig
} from '@/lib/templateConfigUtils';
import { toast } from '@/hooks/use-toast';

interface ReportCardEditorProps {
  reportCardId: string;
  initialData: any;
  onClose?: () => void;
}

export const ReportCardEditor = ({
  reportCardId,
  initialData,
  onClose,
}: ReportCardEditorProps) => {
  const [editedData, setEditedData] = useState(initialData);
  const saveDraft = useSaveDraft();
  const generatePDF = useGenerateFinalPDF();

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  const handleSave = () => {
    saveDraft.mutate({ reportCardId, data: editedData });
  };

  const handleGeneratePdf = async () => {
    try {
      const result = await generatePDF.mutateAsync({ reportCardId, data: editedData });
      if (result.pdfUrl) {
        window.open(result.pdfUrl, '_blank');
      }
      if (onClose) onClose();
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF. Vérifiez la configuration.",
        variant: "destructive"
      });
    }
  };

  const updateGradeField = (index: number, field: string, value: any) => {
    const newGrades = [...editedData.grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setEditedData({ ...editedData, grades: newGrades });
  };

  const handleUpdateConfigValue = (sectionKey: string, elementKey: string, value: any) => {
    const currentConfig = editedData.template?.config || [];
    const newConfig = updateConfig(currentConfig, sectionKey, elementKey, value);
    
    setEditedData({ 
      ...editedData, 
      template: { ...editedData.template, config: newConfig }
    });
  };

  const isElementVisible = (section: string, element: string) => 
    checkVisible(editedData.template?.config, section, element);
  
  const isElementEditable = (section: string, element: string) => 
    checkEditable(editedData.template?.config, section, element);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Édition - {editedData.student.firstName} {editedData.student.lastName}
              </CardTitle>
              <CardDescription>
                {editedData.academic.schoolYear} - {editedData.academic.semester}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saveDraft.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveDraft.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button onClick={handleGeneratePdf} disabled={generatePDF.isPending}>
                <FileDown className="h-4 w-4 mr-2" />
                {generatePDF.isPending ? 'Génération...' : 'Générer PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Édition des champs</CardTitle>
          <CardDescription>
            Seuls les champs configurés comme éditables peuvent être modifiés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <Accordion type="multiple" defaultValue={['grades', 'appreciation']} className="space-y-4">
              
              {/* Section En-tête */}
              {isElementVisible('header', 'title') && isElementEditable('header', 'title') && (
                <AccordionItem value="header">
                  <Card>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <h4 className="font-semibold">En-tête du bulletin</h4>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="space-y-4 pt-4">
                        {isElementVisible('header', 'title') && isElementEditable('header', 'title') && (
                          <div className="space-y-2">
                            <Label>Titre du bulletin</Label>
                            <Input
                              value={getDefaultValue(editedData.template?.config, 'header', 'title', 'Bulletin de Notes')}
                              onChange={(e) => handleUpdateConfigValue('header', 'title', e.target.value)}
                            />
                          </div>
                        )}
                        {isElementVisible('header', 'school_name') && isElementEditable('header', 'school_name') && (
                          <div className="space-y-2">
                            <Label>Nom de l'école</Label>
                            <Input
                              value={getDefaultValue(editedData.template?.config, 'header', 'school_name', '')}
                              onChange={(e) => handleUpdateConfigValue('header', 'school_name', e.target.value)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              )}

              {/* Section Notes */}
              <AccordionItem value="grades">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <h4 className="font-semibold">Notes et appréciations par matière</h4>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-4">
                      {editedData.grades.map((grade: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{grade.subject}</p>
                                {isElementVisible('grades_table', 'subject_category') && grade.subject_category && (
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {grade.subject_category}
                                  </span>
                                )}
                              </div>
                              {isElementVisible('grades_table', 'subject_weighting') && grade.weighting && (
                                <span className="text-xs font-medium">Coef. {grade.weighting}</span>
                              )}
                            </div>

                            {isElementVisible('grades_table', 'teacher_name') && grade.teacher_name && (
                              <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                <span className="font-medium">Enseignant :</span> {grade.teacher_name}
                              </div>
                            )}

                            {isElementVisible('grades_table', 'individual_grades') && grade.individualGrades && grade.individualGrades.length > 1 && (
                              <div className="mt-2 p-2 bg-muted/50 rounded border">
                                <Label className="text-xs font-semibold mb-2 block">
                                  Détail des évaluations (lecture seule)
                                </Label>
                                <div className="space-y-1">
                                  {grade.individualGrades.map((g: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">
                                        {g.assessment_name || g.assessment_type}
                                      </span>
                                      <span className="font-medium">
                                        {((g.grade / g.max_grade) * 20).toFixed(2)}/20
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {isElementVisible('grades_table', 'student_subject_average') && 
                               isElementEditable('grades_table', 'student_subject_average') && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Moyenne élève</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="20"
                                      step="0.01"
                                      value={grade.grade}
                                      onChange={(e) => 
                                        updateGradeField(index, 'grade', parseFloat(e.target.value) || 0)
                                      }
                                      className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">/20</span>
                                  </div>
                                </div>
                              )}

                              {isElementVisible('grades_table', 'class_subject_average') && grade.classAverage && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Moy. classe</Label>
                                  <p className="text-sm font-medium bg-muted/30 px-2 py-1 rounded">
                                    {grade.classAverage.toFixed(2)}/20
                                  </p>
                                </div>
                              )}
                            </div>

                            {(isElementVisible('grades_table', 'class_min_average') || 
                              isElementVisible('grades_table', 'class_max_average')) && 
                             (grade.minAverage || grade.maxAverage) && (
                              <div className="flex gap-2 text-xs bg-muted/30 px-2 py-1 rounded">
                                {isElementVisible('grades_table', 'class_min_average') && grade.minAverage && (
                                  <span className="text-red-600 font-medium">
                                    Min: {grade.minAverage.toFixed(2)}/20
                                  </span>
                                )}
                                {isElementVisible('grades_table', 'class_max_average') && grade.maxAverage && (
                                  <span className="text-green-600 font-medium">
                                    Max: {grade.maxAverage.toFixed(2)}/20
                                  </span>
                                )}
                              </div>
                            )}

                             {isElementVisible('grades_table', 'subject_appreciation') && 
                             isElementEditable('grades_table', 'subject_appreciation') && (
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  Appréciation - {(grade.appreciation || '').length}/100 caractères
                                </Label>
                                <Textarea
                                  value={grade.appreciation || ''}
                                  onChange={(e) => {
                                    const text = e.target.value;
                                    if (text.length <= 100) {
                                      updateGradeField(index, 'appreciation', text);
                                    }
                                  }}
                                  placeholder="Une phrase concise..."
                                  rows={2}
                                  maxLength={100}
                                />
                                {(grade.appreciation || '').length >= 100 && (
                                  <p className="text-xs text-amber-600">
                                    Limite atteinte
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Appréciations générales */}
              <AccordionItem value="appreciation">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <h4 className="font-semibold">Appréciations générales</h4>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-4">
                      {isElementVisible('appreciation', 'school_appreciation') && 
                       isElementEditable('appreciation', 'school_appreciation') && (
                        <div className="space-y-2">
                          <Label>Appréciation de l'établissement</Label>
                          <Textarea
                            value={getDefaultValue(editedData.template?.config, 'appreciation', 'school_appreciation_text', '')}
                            onChange={(e) => handleUpdateConfigValue('appreciation', 'school_appreciation_text', e.target.value)}
                            placeholder="Appréciation générale du semestre..."
                            rows={4}
                          />
                        </div>
                      )}

                      {isElementVisible('appreciation', 'company_appreciation') && 
                       isElementEditable('appreciation', 'company_appreciation') && (
                        <div className="space-y-2">
                          <Label>Appréciation du tuteur en entreprise</Label>
                          <Textarea
                            value={getDefaultValue(editedData.template?.config, 'appreciation', 'company_appreciation_text', '')}
                            onChange={(e) => handleUpdateConfigValue('appreciation', 'company_appreciation_text', e.target.value)}
                            placeholder="Appréciation du tuteur..."
                            rows={4}
                          />
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Section Pied de page */}
              {(isElementVisible('footer', 'signatory_title') && isElementEditable('footer', 'signatory_title')) && (
                <AccordionItem value="footer">
                  <Card>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <h4 className="font-semibold">Pied de page</h4>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="space-y-4 pt-4">
                        {isElementVisible('footer', 'signatory_title') && isElementEditable('footer', 'signatory_title') && (
                          <div className="space-y-2">
                            <Label>Titre du signataire</Label>
                            <Input
                              value={getDefaultValue(editedData.template?.config, 'footer', 'signatory_title', 'Le Directeur des Études')}
                              onChange={(e) => handleUpdateConfigValue('footer', 'signatory_title', e.target.value)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              )}

            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
