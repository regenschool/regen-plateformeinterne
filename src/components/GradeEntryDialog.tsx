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
import { ClipboardList } from "lucide-react";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
};

type GradeEntryDialogProps = {
  student: Student;
  subject: string;
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

const weightingOptions = [
  "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"
];

export const GradeEntryDialog = ({ student, subject, onGradeUpdated }: GradeEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [grade, setGrade] = useState("");
  const [maxGrade, setMaxGrade] = useState("20");
  const [weighting, setWeighting] = useState("1");
  const [appreciation, setAppreciation] = useState("");

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

    const { error } = await supabase.from("grades").insert(gradeData);

    if (error) {
      toast.error("Erreur lors de l'enregistrement de la note");
      return;
    }

    toast.success("Note enregistrée avec succès");
    setOpen(false);
    
    // Reset form
    setAssessmentType("");
    setCustomLabel("");
    setGrade("");
    setMaxGrade("20");
    setWeighting("1");
    setAppreciation("");
    
    onGradeUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <ClipboardList className="w-4 h-4 mr-2" />
          Ajouter une note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Ajouter une note - {student.first_name} {student.last_name}
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
            <p className="text-xs text-muted-foreground mt-1">
              Ex: 1 pour coefficient normal, 2 pour double, 0.5 pour demi
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
