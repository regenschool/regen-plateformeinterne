import { useState, useEffect } from "react";
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
import { Edit2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Grade = {
  id: string;
  student_id: string;
  subject: string;
  assessment_type: string;
  assessment_custom_label: string | null;
  grade: number;
  max_grade: number;
  weighting: number;
  appreciation: string | null;
  teacher_name: string | null;
  school_year: string | null;
  semester: string | null;
};

type EditGradeDialogProps = {
  grade: Grade;
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

export const EditGradeDialog = ({ grade, onGradeUpdated }: EditGradeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assessmentType, setAssessmentType] = useState(grade.assessment_type);
  const [customLabel, setCustomLabel] = useState(grade.assessment_custom_label || "");
  const [gradeValue, setGradeValue] = useState(grade.grade.toString());
  const [maxGrade, setMaxGrade] = useState(grade.max_grade.toString());
  const [weighting, setWeighting] = useState(grade.weighting.toString());
  const [appreciation, setAppreciation] = useState(grade.appreciation || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAssessmentType(grade.assessment_type);
      setCustomLabel(grade.assessment_custom_label || "");
      setGradeValue(grade.grade.toString());
      setMaxGrade(grade.max_grade.toString());
      setWeighting(grade.weighting.toString());
      setAppreciation(grade.appreciation || "");
    }
  }, [open, grade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!assessmentType) {
      toast.error("Veuillez sélectionner un type d'épreuve");
      return;
    }

    if (assessmentType === "autre" && !customLabel.trim()) {
      toast.error("Veuillez préciser le type d'épreuve");
      return;
    }

    if (!gradeValue || parseFloat(gradeValue) < 0) {
      toast.error("Veuillez saisir une note valide");
      return;
    }

    if (!maxGrade || parseFloat(maxGrade) <= 0) {
      toast.error("La note maximale doit être supérieure à 0");
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        assessment_type: assessmentType as "participation_individuelle" | "oral_groupe" | "oral_individuel" | "ecrit_groupe" | "ecrit_individuel" | "memoire" | "autre",
        assessment_custom_label: assessmentType === "autre" ? customLabel.trim() : null,
        grade: parseFloat(gradeValue),
        max_grade: parseFloat(maxGrade),
        weighting: parseFloat(weighting),
        appreciation: appreciation.trim() || null,
      };

      const { error } = await supabase
        .from("grades")
        .update(updateData)
        .eq("id", grade.id);

      if (error) throw error;

      toast.success("Note modifiée avec succès");
      setOpen(false);
      onGradeUpdated();
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("Erreur lors de la modification de la note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("grades")
        .delete()
        .eq("id", grade.id);

      if (error) throw error;

      toast.success("Note supprimée avec succès");
      setShowDeleteDialog(false);
      setOpen(false);
      onGradeUpdated();
    } catch (error) {
      console.error("Error deleting grade:", error);
      toast.error("Erreur lors de la suppression de la note");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la note</DialogTitle>
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
                  step="0.1"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  placeholder="15.5"
                  required
                />
              </div>
              <div>
                <Label>Sur *</Label>
                <Input
                  type="number"
                  step="0.1"
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
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};