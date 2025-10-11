import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type NewSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: string, teacherName: string, schoolYear: string, semester: string) => void;
};

const currentYear = new Date().getFullYear();
const schoolYears = [
  `${currentYear - 1}-${currentYear}`,
  `${currentYear}-${currentYear + 1}`,
  `${currentYear + 1}-${currentYear + 2}`,
];

const semesters = ["Semestre 1", "Semestre 2", "Année complète"];

export const NewSubjectDialog = ({ open, onClose, onSubjectCreated }: NewSubjectDialogProps) => {
  const [teacherName, setTeacherName] = useState("");
  const [schoolYear, setSchoolYear] = useState(schoolYears[1]); // Current school year by default
  const [semester, setSemester] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherName.trim()) {
      toast.error("Veuillez saisir le nom de l'enseignant");
      return;
    }

    if (!schoolYear) {
      toast.error("Veuillez sélectionner l'année scolaire");
      return;
    }

    if (!semester) {
      toast.error("Veuillez sélectionner le semestre");
      return;
    }

    if (!subjectName.trim()) {
      toast.error("Veuillez saisir le nom de la matière");
      return;
    }

    onSubjectCreated(subjectName.trim(), teacherName.trim(), schoolYear, semester);
    
    // Reset form
    setTeacherName("");
    setSchoolYear(schoolYears[1]);
    setSemester("");
    setSubjectName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle matière</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nom et prénom de l'enseignant *</Label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Ex: Marie Dupont"
              required
            />
          </div>

          <div>
            <Label>Année scolaire *</Label>
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'année scolaire" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Semestre concerné *</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le semestre" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nom de la matière *</Label>
            <Input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ex: Mathématiques appliquées"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ce nom sera utilisé pour la gestion des notes. La direction composera le nom final pour le bulletin.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Créer la matière
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
