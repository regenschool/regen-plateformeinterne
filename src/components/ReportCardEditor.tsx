import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Eye, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface Grade {
  subject: string;
  grade: number;
  maxGrade: number;
  weighting: number;
  assessmentType: string;
  appreciation?: string;
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
  averages?: {
    student: number;
    class: number;
  };
  generalAppreciation?: string;
}

interface ReportCardEditorProps {
  reportCardId: string;
  initialData: ReportCardData;
  onSave: (editedData: ReportCardData) => Promise<void>;
  onGeneratePdf: () => void;
}

export const ReportCardEditor = ({
  reportCardId,
  initialData,
  onSave,
  onGeneratePdf,
}: ReportCardEditorProps) => {
  const [editedData, setEditedData] = useState<ReportCardData>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedData);
      toast.success('Modifications enregistrées');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
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
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button onClick={onGeneratePdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Générer le PDF final
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
              Modifiez les notes et appréciations avant la génération finale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Appréciation générale */}
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

                <Separator />

                {/* Édition des notes */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Notes et appréciations par matière</h3>
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
                            <Label className="text-xs">Note</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={grade.maxGrade}
                                step="0.5"
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
              Visualisez les modifications avant génération
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                {/* Aperçu simplifié */}
                <div className="bg-primary text-primary-foreground p-4 rounded-lg">
                  <h2 className="text-xl font-bold">Bulletin Scolaire</h2>
                  <p className="text-sm opacity-90">
                    {editedData.academic.schoolYear} - {editedData.academic.semester}
                  </p>
                </div>

                <div className="bg-background p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold">
                    {editedData.student.firstName} {editedData.student.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Classe: {editedData.student.className}
                  </p>
                </div>

                <div className="bg-background p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Notes</h4>
                  {editedData.grades.map((grade, index) => (
                    <div key={index} className="space-y-1 pb-2 border-b last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{grade.subject}</span>
                        <span className="font-bold text-primary">
                          {grade.grade}/{grade.maxGrade}
                        </span>
                      </div>
                      {grade.appreciation && (
                        <p className="text-xs text-muted-foreground italic">
                          {grade.appreciation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {editedData.averages && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Moyenne élève</p>
                      <p className="text-2xl font-bold text-primary">
                        {editedData.averages.student.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Moyenne classe</p>
                      <p className="text-2xl font-bold text-primary">
                        {editedData.averages.class.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {editedData.generalAppreciation && (
                  <div className="bg-background p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Appréciation générale</h4>
                    <p className="text-sm text-muted-foreground italic">
                      {editedData.generalAppreciation}
                    </p>
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
