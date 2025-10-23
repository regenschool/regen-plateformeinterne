import { useState } from "react";
import { OptimizedImage } from "@/components/OptimizedImage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rateLimiter";
import { logAuditAction } from "@/hooks/useAuditLog";
import { useAddGradeNormalized } from "@/hooks/useGradesNormalized";
import { supabase } from "@/integrations/supabase/client";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
};

type BulkGradeImportProps = {
  students: Student[];
  classname: string;
  subject: string;
  subjectId: string; // ✅ NOUVEAU - subject_id (FK normalisée)
  subjectMetadata: {
    teacherName: string;
    schoolYear: string;
    semester: string;
  } | null;
  onClose: () => void;
  onImportComplete: () => void;
};

const assessmentTypes = [
  { value: "participation_individuelle", label: "Participation individuelle" },
  { value: "oral_groupe", label: "Oral - travail de groupe" },
  { value: "oral_individuel", label: "Oral - travail individuel" },
  { value: "ecrit_groupe", label: "Écrit - travail de groupe" },
  { value: "ecrit_individuel", label: "Écrit - travail individuel" },
  { value: "memoire", label: "Mémoire" },
  { value: "autre", label: "Autre" },
];

const weightingOptions = [
  "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"
];

export const BulkGradeImport = ({ students, classname, subject, subjectId, subjectMetadata, onClose, onImportComplete }: BulkGradeImportProps) => {
  const [assessmentName, setAssessmentName] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [maxGrade, setMaxGrade] = useState("20");
  const [weighting, setWeighting] = useState("1");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [weightings, setWeightings] = useState<Record<string, string>>({});
  const [absences, setAbsences] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Utiliser le hook normalisé
  const addGradeMutation = useAddGradeNormalized();

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const handleAbsenceChange = (studentId: string, isAbsent: boolean) => {
    setAbsences(prev => ({ ...prev, [studentId]: isAbsent }));
    if (isAbsent) {
      setGrades(prev => ({ ...prev, [studentId]: "0" }));
    }
  };


  const handleSubmit = async () => {
    if (isSubmitting) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    // Vérifier le rate limiting
    try {
      await checkRateLimit(RATE_LIMITS.BULK_GRADES);
    } catch (error) {
      if (error instanceof RateLimitError) {
        toast.error(`Limite d'import atteinte. Réessayez dans ${error.retryAfter} secondes`);
        return;
      }
      throw error;
    }

    if (!assessmentName.trim()) {
      toast.error("Veuillez saisir un nom d'épreuve");
      return;
    }

    if (!assessmentType) {
      toast.error("Veuillez sélectionner un type d'épreuve");
      return;
    }

    if (assessmentType === "autre" && !customLabel) {
      toast.error("Veuillez préciser le type d'épreuve");
      return;
    }

    const gradeEntries = Object.entries(grades)
      .filter(([studentId, grade]) => absences[studentId] || (grade && grade.trim() !== ""));

    if (gradeEntries.length === 0) {
      toast.error("Veuillez saisir au moins une note ou marquer des absences");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ ARCHITECTURE NORMALISÉE - Utiliser subject_id
      let successCount = 0;
      let errorCount = 0;

      for (const [studentId, grade] of gradeEntries) {
        try {
          const isAbsent = absences[studentId] || false;
          await addGradeMutation.mutateAsync({
            student_id: studentId,
            subject_id: subjectId,
            teacher_id: user.id,
            assessment_name: assessmentName.trim(),
            assessment_type: assessmentType as "participation_individuelle" | "oral_groupe" | "oral_individuel" | "ecrit_groupe" | "ecrit_individuel" | "memoire" | "autre",
            assessment_custom_label: assessmentType === "autre" ? customLabel : null,
            grade: isAbsent ? 0 : parseFloat(grade),
            max_grade: parseFloat(maxGrade),
            weighting: parseFloat(weightings[studentId] || weighting),
            is_absent: isAbsent,
            appreciation: null,
            // Colonnes temporaires pour backward compatibility
            class_name: classname,
            subject: subject,
            teacher_name: subjectMetadata?.teacherName || null,
            school_year: subjectMetadata?.schoolYear || null,
            semester: subjectMetadata?.semester || null,
          });
          successCount++;
        } catch (error) {
          console.error('Error importing grade:', error);
          errorCount++;
        }
      }

      // Logger l'action d'audit
      await logAuditAction('IMPORT', 'grades', {
        assessment_name: assessmentName,
        total_grades: successCount,
        errors: errorCount,
        class_name: classname,
        subject,
        subject_id: subjectId,
      });

      if (successCount > 0) {
        toast.success(`${successCount} notes importées avec succès${errorCount > 0 ? ` (${errorCount} erreurs)` : ''}`);
        onImportComplete();
        onClose();
      } else {
        toast.error("Erreur lors de l'import des notes");
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error("Erreur lors de l'import des notes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import en masse - {classname} - {subject}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div>
            <Label>Nom de l'épreuve * (max 50 caractères)</Label>
            <Input
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value.slice(0, 50))}
              placeholder="Ex: Contrôle continu 1, Examen final..."
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">{assessmentName.length}/50 caractères</p>
          </div>

          <div>
            <Label>Type d'épreuve *</Label>
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type d'épreuve" />
              </SelectTrigger>
              <SelectContent>
                {assessmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {assessmentType === "autre" && (
            <div>
              <Label>Précisez le type d'épreuve *</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Ex: Projet de fin d'année"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Note maximale *</Label>
              <Input
                type="number"
                step="0.1"
                value={maxGrade}
                onChange={(e) => setMaxGrade(e.target.value)}
                placeholder="20"
              />
            </div>
            <div>
              <Label>Pondération par défaut *</Label>
              <Select value={weighting} onValueChange={setWeighting}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la pondération" />
                </SelectTrigger>
                <SelectContent>
                  {weightingOptions.map((weight) => (
                    <SelectItem key={weight} value={weight}>
                      {weight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Saisie visuelle</TabsTrigger>
              <TabsTrigger value="table">Tableau Excel</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Saisie des notes</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                      {student.photo_url ? (
                        <OptimizedImage
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary/30">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {student.first_name} {student.last_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Note"
                        value={grades[student.id] || ""}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        disabled={absences[student.id]}
                        className="w-24"
                      />
                      <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={absences[student.id] || false}
                          onChange={(e) => handleAbsenceChange(student.id, e.target.checked)}
                          className="rounded border-input"
                        />
                        Absent
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="table" className="border-t pt-4 mt-4">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Mode Tableau Excel :</strong> Copiez vos données depuis Excel/LibreOffice et collez-les directement dans le tableau ci-dessous (Ctrl+V ou Cmd+V)
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Photo</th>
                      <th className="px-3 py-2 text-left font-medium">Étudiant</th>
                      <th className="px-3 py-2 text-left font-medium w-24">Note /{maxGrade}</th>
                      <th className="px-3 py-2 text-left font-medium w-20">Coef.</th>
                      <th className="px-3 py-2 text-left font-medium w-16">Absent</th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y"
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text');
                      const lines = pastedData.trim().split('\n');
                      const newGrades: Record<string, string> = {};
                      const newWeightings: Record<string, string> = {};
                      
                      lines.forEach((line, index) => {
                        if (index < students.length) {
                          const parts = line.split('\t').map(p => p.trim());
                          const gradeValue = parts[0];
                          const weightValue = parts[1] || weighting;
                          
                          if (gradeValue && !isNaN(parseFloat(gradeValue))) {
                            newGrades[students[index].id] = gradeValue;
                            newWeightings[students[index].id] = weightValue;
                          }
                        }
                      });
                      
                      if (Object.keys(newGrades).length > 0) {
                        setGrades(prev => ({ ...prev, ...newGrades }));
                        setWeightings(prev => ({ ...prev, ...newWeightings }));
                        toast.success(`${Object.keys(newGrades).length} notes collées depuis Excel`);
                      }
                    }}
                  >
                    {students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                            {student.photo_url ? (
                              <OptimizedImage
                                src={student.photo_url}
                                alt={`${student.first_name} ${student.last_name}`}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary/30">
                                {student.first_name[0]}{student.last_name[0]}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Note"
                            value={grades[student.id] || ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            disabled={absences[student.id]}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.5"
                            placeholder={weighting}
                            value={weightings[student.id] || ""}
                            onChange={(e) => setWeightings(prev => ({ ...prev, [student.id]: e.target.value }))}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={absences[student.id] || false}
                            onChange={(e) => handleAbsenceChange(student.id, e.target.checked)}
                            className="rounded border-input"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.keys(grades).length > 0 && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ {Object.keys(grades).length} note(s) saisie(s)
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              disabled={Object.keys(grades).length === 0 || isSubmitting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isSubmitting 
                ? "Import en cours..." 
                : `Importer ${Object.keys(grades).length} note${Object.keys(grades).length > 1 ? 's' : ''}`
              }
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
