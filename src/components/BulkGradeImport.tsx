import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileSpreadsheet } from "lucide-react";

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

export const BulkGradeImport = ({ students, classname, subject, onClose, onImportComplete }: BulkGradeImportProps) => {
  const [assessmentType, setAssessmentType] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [maxGrade, setMaxGrade] = useState("20");
  const [weighting, setWeighting] = useState("1");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [csvData, setCsvData] = useState("");

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const parseCSV = () => {
    if (!csvData.trim()) {
      toast.error("Veuillez coller des données CSV");
      return;
    }

    const lines = csvData.trim().split('\n');
    const newGrades: Record<string, string> = {};
    
    lines.forEach((line, index) => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      
      // Si on a 3 colonnes (Nom, Prénom, Note) ou 2 colonnes (Nom complet, Note)
      if (parts.length >= 2) {
        const gradeValue = parts[parts.length - 1];
        const studentName = parts.slice(0, -1).join(' ').toLowerCase();
        
        // Trouver l'étudiant correspondant
        const student = students.find(s => {
          const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
          const reverseName = `${s.last_name} ${s.first_name}`.toLowerCase();
          return fullName.includes(studentName) || reverseName.includes(studentName) || studentName.includes(fullName);
        });
        
        if (student && gradeValue && !isNaN(parseFloat(gradeValue))) {
          newGrades[student.id] = gradeValue;
        }
      } 
      // Si on a juste une note par ligne (ordre des étudiants)
      else if (parts.length === 1 && index < students.length) {
        const gradeValue = parts[0];
        if (gradeValue && !isNaN(parseFloat(gradeValue))) {
          newGrades[students[index].id] = gradeValue;
        }
      }
    });

    if (Object.keys(newGrades).length === 0) {
      toast.error("Aucune note valide n'a été détectée. Format attendu: 'Nom Prénom Note' ou juste 'Note' par ligne");
      return;
    }

    setGrades(newGrades);
    toast.success(`${Object.keys(newGrades).length} notes importées depuis le CSV`);
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté");
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
      .filter(([_, grade]) => grade && grade.trim() !== "")
      .map(([studentId, grade]) => ({
        student_id: studentId,
        teacher_id: user.id,
        class_name: classname,
        subject: subject,
        assessment_type: assessmentType as "participation_individuelle" | "oral_groupe" | "oral_individuel" | "ecrit_groupe" | "ecrit_individuel" | "memoire" | "autre",
        assessment_custom_label: assessmentType === "autre" ? customLabel : null,
        grade: parseFloat(grade),
        max_grade: parseFloat(maxGrade),
        weighting: parseFloat(weighting),
        appreciation: null,
      }));

    if (gradeEntries.length === 0) {
      toast.error("Veuillez saisir au moins une note");
      return;
    }

    const { error } = await supabase.from("grades").insert(gradeEntries);

    if (error) {
      toast.error("Erreur lors de l'import des notes");
      return;
    }

    toast.success(`${gradeEntries.length} notes importées avec succès`);
    onImportComplete();
    onClose();
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import en masse - {classname} - {subject}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
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
                step="0.01"
                value={maxGrade}
                onChange={(e) => setMaxGrade(e.target.value)}
                placeholder="20"
              />
            </div>
            <div>
              <Label>Pondération *</Label>
              <Input
                type="number"
                step="0.01"
                value={weighting}
                onChange={(e) => setWeighting(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Saisie visuelle</TabsTrigger>
              <TabsTrigger value="csv">Import CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Saisie des notes</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
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
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Note"
                        value={grades[student.id] || ""}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="csv" className="border-t pt-4 mt-4 space-y-4">
              <div>
                <Label>Coller vos données CSV *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Formats acceptés:<br/>
                  • Une note par ligne (dans l'ordre affiché)<br/>
                  • Nom Prénom Note (séparés par virgule, point-virgule ou tabulation)<br/>
                  • Prénom Nom Note
                </p>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Exemple:&#10;Jean Dupont, 15.5&#10;Marie Martin, 18&#10;&#10;Ou simplement:&#10;15.5&#10;18&#10;16"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <Button onClick={parseCSV} variant="outline" className="w-full">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Parser le CSV
              </Button>
              
              {Object.keys(grades).length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <p className="text-sm font-medium mb-2">{Object.keys(grades).length} notes détectées:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {students
                      .filter(s => grades[s.id])
                      .map(student => (
                        <div key={student.id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0">
                            {student.photo_url ? (
                              <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary/30">
                                {student.first_name[0]}{student.last_name[0]}
                              </div>
                            )}
                          </div>
                          <span className="flex-1">{student.first_name} {student.last_name}</span>
                          <span className="font-bold">{grades[student.id]}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSubmit} className="flex-1" disabled={Object.keys(grades).length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              Importer {Object.keys(grades).length} note{Object.keys(grades).length > 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
