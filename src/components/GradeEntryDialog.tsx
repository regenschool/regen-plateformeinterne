import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, Pencil } from "lucide-react";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
};

type Grade = {
  id: string;
  assessment_type: string;
  assessment_custom_label: string | null;
  grade: number;
  max_grade: number;
  weighting: number;
  appreciation: string | null;
};

type GradeEntryDialogProps = {
  student: Student;
  subject: string;
  existingGrade?: Grade;
  onGradeUpdated: () => void;
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

export const GradeEntryDialog = ({ student, subject, existingGrade, onGradeUpdated }: GradeEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState(existingGrade?.assessment_type || "");
  const [customLabel, setCustomLabel] = useState(existingGrade?.assessment_custom_label || "");
  const [grade, setGrade] = useState(existingGrade?.grade?.toString() || "");
  const [maxGrade, setMaxGrade] = useState(existingGrade?.max_grade?.toString() || "20");
  const [weighting, setWeighting] = useState(existingGrade?.weighting?.toString() || "1");
  const [appreciation, setAppreciation] = useState(existingGrade?.appreciation || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const gradeData = {
      student_id: student.id,
      teacher_id: user.id,
      class_name: student.class_name,
      subject: subject,
      assessment_type: assessmentType as "participation_individuelle" | "oral_groupe" | "oral_individuel" | "ecrit_groupe" | "ecrit_individuel" | "memoire" | "autre",
      assessment_custom_label: assessmentType === "autre" ? customLabel : null,
      grade: parseFloat(grade),
      max_grade: parseFloat(maxGrade),
      weighting: parseFloat(weighting),
      appreciation: appreciation || null,
    };

    let error;
    if (existingGrade) {
      ({ error } = await supabase
        .from("grades")
        .update(gradeData)
        .eq("id", existingGrade.id));
    } else {
      ({ error } = await supabase.from("grades").insert(gradeData));
    }

    if (error) {
      toast.error("Erreur lors de l'enregistrement de la note");
      return;
    }

    toast.success("Note enregistrée avec succès");
    setOpen(false);
    onGradeUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={existingGrade ? "outline" : "default"} className="w-full">
          {existingGrade ? (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </>
          ) : (
            <>
              <ClipboardList className="w-4 h-4 mr-2" />
              Saisir une note
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingGrade ? "Modifier la note" : "Saisir une note"} - {student.first_name} {student.last_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>Note *</Label>
              <Input
                type="number"
                step="0.01"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="15.5"
                required
              />
            </div>
            <div>
              <Label>Sur *</Label>
              <Input
                type="number"
                step="0.01"
                value={maxGrade}
                onChange={(e) => setMaxGrade(e.target.value)}
                placeholder="20"
                required
              />
            </div>
          </div>

          <div>
            <Label>Pondération dans la note finale *</Label>
            <Input
              type="number"
              step="0.01"
              value={weighting}
              onChange={(e) => setWeighting(e.target.value)}
              placeholder="1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: 1 pour un coefficient normal, 2 pour double, 0.5 pour demi
            </p>
          </div>

          <div>
            <Label>Appréciation</Label>
            <Textarea
              value={appreciation}
              onChange={(e) => setAppreciation(e.target.value)}
              placeholder="Commentaire sur la performance de l'étudiant..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
