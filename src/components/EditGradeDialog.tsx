import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useUpdateGradeNormalized, useDeleteGradeNormalized } from "@/hooks/useGradesNormalized";

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
  subject_id?: string | null;
  is_absent?: boolean;
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
  const [isAbsent, setIsAbsent] = useState(grade.is_absent || false);
  
  const updateGradeMutation = useUpdateGradeNormalized();
  const deleteGradeMutation = useDeleteGradeNormalized();

  useEffect(() => {
    if (open) {
      setAssessmentType(grade.assessment_type);
      setCustomLabel(grade.assessment_custom_label || "");
      setGradeValue(grade.grade.toString());
      setMaxGrade(grade.max_grade.toString());
      setWeighting(grade.weighting.toString());
      setAppreciation(grade.appreciation || "");
      setIsAbsent(grade.is_absent || false);
    }
  }, [open, grade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (updateGradeMutation.isPending) return;

    if (!assessmentType) {
      toast.error("Veuillez sélectionner un type d'épreuve");
      return;
    }

    if (assessmentType === "autre" && !customLabel.trim()) {
      toast.error("Veuillez préciser le type d'épreuve");
      return;
    }

    if (!isAbsent && (!gradeValue || parseFloat(gradeValue) < 0)) {
      toast.error("Veuillez saisir une note valide");
      return;
    }

    if (!isAbsent && (!maxGrade || parseFloat(maxGrade) <= 0)) {
      toast.error("La note maximale doit être supérieure à 0");
      return;
    }

    updateGradeMutation.mutate({
      id: grade.id,
      updates: {
        assessment_type: assessmentType as "participation_individuelle" | "oral_groupe" | "oral_individuel" | "ecrit_groupe" | "ecrit_individuel" | "memoire" | "autre",
        assessment_custom_label: assessmentType === "autre" ? customLabel.trim() : null,
        grade: isAbsent ? 0 : parseFloat(gradeValue),
        max_grade: parseFloat(maxGrade),
        // weighting: le coefficient n'est plus modifiable ici (défini au niveau de l'épreuve)
        appreciation: appreciation.trim() || null,
        is_absent: isAbsent,
      },
    }, {
      onSuccess: () => {
        setOpen(false);
        onGradeUpdated();
      },
    });
  };

  const handleDelete = async () => {
    deleteGradeMutation.mutate(grade.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setOpen(false);
        onGradeUpdated();
      },
    });
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="absent-edit"
                checked={isAbsent}
                onCheckedChange={(checked) => setIsAbsent(checked as boolean)}
              />
              <Label htmlFor="absent-edit" className="cursor-pointer">
                Étudiant absent
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Note *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  placeholder="15.5"
                  required={!isAbsent}
                  disabled={isAbsent}
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
                  required={!isAbsent}
                  disabled={isAbsent}
                />
              </div>
            </div>

            <div>
              <Label>Pondération dans la note finale</Label>
              <Input
                type="text"
                value={weighting}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Le coefficient est défini au niveau de l'épreuve pour toute la classe. Pour le modifier, créez une nouvelle épreuve avec le bon coefficient.
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
              <Button type="submit" className="flex-1" disabled={updateGradeMutation.isPending}>
                {updateGradeMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={updateGradeMutation.isPending || deleteGradeMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={updateGradeMutation.isPending}>
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