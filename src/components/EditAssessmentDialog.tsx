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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings } from "lucide-react";

type EditAssessmentDialogProps = {
  assessmentName: string;
  assessmentType: string;
  assessmentCustomLabel: string | null;
  className: string;
  subject: string;
  schoolYear: string;
  semester: string;
  subjectId?: string | null;
  onUpdated: () => void;
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

export const EditAssessmentDialog = ({
  assessmentName,
  assessmentType,
  assessmentCustomLabel,
  className,
  subject,
  schoolYear,
  semester,
  subjectId,
  onUpdated,
}: EditAssessmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(assessmentName);
  const [newType, setNewType] = useState(assessmentType);
  const [newCustomLabel, setNewCustomLabel] = useState(assessmentCustomLabel || "");
  const [weighting, setWeighting] = useState("1");
  const [maxGrade, setMaxGrade] = useState("20");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName(assessmentName);
      setNewType(assessmentType);
      setNewCustomLabel(assessmentCustomLabel || "");
      
      // Charger le coefficient et max_grade actuels via subject_id
      const loadCurrentSettings = async () => {
        const { data } = await supabase
          .from("grades")
          .select("weighting, max_grade")
          .eq("assessment_name", assessmentName)
          .eq("subject_id", subjectId)
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setWeighting(data.weighting.toString());
          setMaxGrade(data.max_grade.toString());
        }
      };
      
      loadCurrentSettings();
    }
  }, [open, assessmentName, assessmentType, assessmentCustomLabel, className, subject, schoolYear, semester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!newName.trim()) {
      toast.error("Le nom de l'épreuve est obligatoire");
      return;
    }

    if (!newType) {
      toast.error("Le type d'épreuve est obligatoire");
      return;
    }

    if (newType === "autre" && !newCustomLabel.trim()) {
      toast.error("Veuillez préciser le type d'épreuve");
      return;
    }

    try {
      setIsSubmitting(true);

      // Mettre à jour toutes les notes de cette épreuve via subject_id
      const { error: gradesError } = await supabase
        .from("grades")
        .update({
          assessment_name: newName.trim(),
          assessment_type: newType as any,
          assessment_custom_label: newType === "autre" ? newCustomLabel.trim() : null,
          weighting: parseFloat(weighting),
          max_grade: parseFloat(maxGrade),
        })
        .eq("assessment_name", assessmentName)
        .eq("subject_id", subjectId);

      if (gradesError) throw gradesError;

      // Mettre à jour l'assessment dans la table assessments si elle existe
      const { error: assessmentError } = await supabase
        .from("assessments")
        .update({
          assessment_name: newName.trim(),
          assessment_type: newType as any,
          assessment_custom_label: newType === "autre" ? newCustomLabel.trim() : null,
          weighting: parseFloat(weighting),
          max_grade: parseFloat(maxGrade),
        })
        .eq("assessment_name", assessmentName)
        .eq("class_name", className)
        .eq("subject", subject)
        .eq("school_year", schoolYear)
        .eq("semester", semester);

      // Ne pas lancer d'erreur si l'assessment n'existe pas encore dans la table assessments
      if (assessmentError) {
        console.warn("Assessments table update skipped:", assessmentError);
      }

      toast.success("Épreuve mise à jour pour tous les étudiants");
      setOpen(false);
      onUpdated();
    } catch (error) {
      console.error("Error updating assessment:", error);
      toast.error("Erreur lors de la mise à jour de l'épreuve");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'épreuve</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nom de l'épreuve *</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 50))}
              placeholder="Ex: Contrôle continu 1"
              maxLength={50}
              required
            />
          </div>

          <div>
            <Label>Type d'épreuve *</Label>
            <Select value={newType} onValueChange={setNewType}>
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

          {newType === "autre" && (
            <div>
              <Label>Précisez le type d'épreuve *</Label>
              <Input
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                placeholder="Ex: Projet de fin d'année"
              />
            </div>
          )}

          <div>
            <Label>Coefficient *</Label>
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
              Sera appliqué à tous les étudiants de cette épreuve
            </p>
          </div>

          <div>
            <Label>Note maximale *</Label>
            <Input
              type="number"
              step="0.1"
              value={maxGrade}
              onChange={(e) => setMaxGrade(e.target.value)}
              placeholder="20"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sera appliqué à tous les étudiants de cette épreuve
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
