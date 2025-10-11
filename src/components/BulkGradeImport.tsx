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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";

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

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({ ...prev, [studentId]: value }));
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

          <div className="border-t pt-4">
            <h3 className="font-medium mb-4">Saisie des notes</h3>
            <div className="space-y-3">
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
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSubmit} className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Importer les notes
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
