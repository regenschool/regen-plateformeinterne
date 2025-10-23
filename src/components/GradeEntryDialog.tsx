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
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
};

type GradeEntryDialogProps = {
  student: Student;
  subject: string;
  subjectId?: string; // NOUVEAU: Phase 3A - FK normalisée
  subjectMetadata: {
    teacherName: string;
    schoolYear: string;
    semester: string;
  } | null;
  onGradeUpdated: () => void;
  preselectedAssessment?: {
    name: string;
    type: string;
    customLabel: string | null;
  } | null;
  onAssessmentDeselected?: () => void;
  openExternal?: boolean;
  studentsToComplete?: Student[];
  currentStudentIndex?: number;
  onNavigateStudent?: (direction: 'prev' | 'next') => void;
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

export const GradeEntryDialog = ({ 
  student, 
  subject,
  subjectId, // NOUVEAU: Phase 3A
  subjectMetadata, 
  onGradeUpdated, 
  preselectedAssessment, 
  onAssessmentDeselected, 
  openExternal,
  studentsToComplete,
  currentStudentIndex,
  onNavigateStudent 
}: GradeEntryDialogProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [existingAssessments, setExistingAssessments] = useState<Array<{name: string, type: string, customLabel: string | null}>>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [assessmentName, setAssessmentName] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [grade, setGrade] = useState("");
  const [maxGrade, setMaxGrade] = useState("20");
  const [weighting, setWeighting] = useState("1");
  const [appreciation, setAppreciation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAbsent, setIsAbsent] = useState(false);
  
  const MAX_APPRECIATION_LENGTH = 100; // Limite pour une phrase concise

  useEffect(() => {
    setOpen(!!openExternal);
  }, [openExternal]);

  const fetchExistingAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("grades")
        .select("assessment_name, assessment_type, assessment_custom_label")
        .eq("teacher_id", user.id)
        .eq("class_name", student.class_name)
        .eq("subject", subject)
        .eq("school_year", subjectMetadata?.schoolYear || "")
        .eq("semester", subjectMetadata?.semester || "")
        .not("assessment_name", "is", null);

      if (error) throw error;

      // Get unique assessments
      const uniqueAssessments = Array.from(
        new Map(data?.map(item => [
          item.assessment_name,
          { 
            name: item.assessment_name, 
            type: item.assessment_type,
            customLabel: item.assessment_custom_label 
          }
        ]) || []).values()
      );

      setExistingAssessments(uniqueAssessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  };

  const handleAssessmentSelection = (value: string) => {
    setSelectedAssessment(value);
    if (value === "__new__") {
      setAssessmentName("");
      setAssessmentType("");
      setCustomLabel("");
    } else {
      const assessment = existingAssessments.find(a => a.name === value);
      if (assessment) {
        setAssessmentName(assessment.name);
        setAssessmentType(assessment.type);
        setCustomLabel(assessment.customLabel || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("grades.gradeError") || "Vous devez être connecté");
      return;
    }

    if (!assessmentName.trim()) {
      toast.error("Veuillez saisir un nom d'épreuve");
      return;
    }

    if (!assessmentType) {
      toast.error("Veuillez sélectionner un type d'épreuve");
      return;
    }

    if (assessmentType === "autre" && !customLabel.trim()) {
      toast.error("Veuillez préciser le type d'épreuve");
      return;
    }

    if (!isAbsent && (!grade || parseFloat(grade) < 0)) {
      toast.error("Veuillez saisir une note valide");
      return;
    }

    if (!isAbsent && (!maxGrade || parseFloat(maxGrade) <= 0)) {
      toast.error("La note maximale doit être supérieure à 0");
      return;
    }

    try {
      setIsSubmitting(true);

    // Phase 3A: Récupérer subject_id si non fourni (backward compatibility)
    let effectiveSubjectId = subjectId;
    if (!effectiveSubjectId && subjectMetadata) {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('subject_name', subject)
        .eq('class_name', student.class_name)
        .eq('school_year', subjectMetadata.schoolYear)
        .eq('semester', subjectMetadata.semester)
        .eq('teacher_id', user.id)
        .maybeSingle();
      
      effectiveSubjectId = subjectData?.id || undefined;
    }

    const gradeData = {
      student_id: student.id,
      teacher_id: user.id,
      subject_id: effectiveSubjectId, // NOUVEAU: Phase 3A FK
      // Colonnes dénormalisées (conservées pour backward compatibility)
      class_name: student.class_name,
      subject: subject,
      assessment_name: assessmentName.trim(),
      assessment_type: assessmentType as "participation_individuelle" | "oral_groupe" | "oral_individuel" | "ecrit_groupe" | "ecrit_individuel" | "memoire" | "autre",
      assessment_custom_label: assessmentType === "autre" ? customLabel.trim() : null,
      grade: isAbsent ? 0 : parseFloat(grade),
      max_grade: isAbsent ? parseFloat(maxGrade) : parseFloat(maxGrade),
      weighting: parseFloat(weighting),
      appreciation: appreciation.trim() || null,
      teacher_name: subjectMetadata?.teacherName || null,
      school_year: subjectMetadata?.schoolYear || null,
      semester: subjectMetadata?.semester || null,
      is_absent: isAbsent,
    };

    // Check if grade already exists for this assessment/student combination
    const { data: existingGrade } = await supabase
      .from('grades')
      .select('id')
      .eq('student_id', student.id)
      .eq('subject', subject)
      .eq('school_year', subjectMetadata?.schoolYear || '')
      .eq('semester', subjectMetadata?.semester || '')
      .eq('assessment_name', assessmentName.trim())
      .eq('assessment_type', assessmentType as any)
      .maybeSingle();

    let error;
    if (existingGrade) {
      // Update existing grade
      const result = await supabase
        .from('grades')
        .update(gradeData)
        .eq('id', existingGrade.id);
      error = result.error;
    } else {
      // Insert new grade
      const result = await supabase
        .from('grades')
        .insert([gradeData]);
      error = result.error;
    }

    if (error) throw error;

    toast.success(t("grades.gradeSuccess") || "Note enregistrée avec succès");
    
    // Reset form
    setSelectedAssessment("");
    setAssessmentName("");
    setAssessmentType("");
    setCustomLabel("");
    setGrade("");
    setMaxGrade("20");
    setWeighting("1");
    setAppreciation("");
    setIsAbsent(false);
    
    onGradeUpdated();

    // Auto-navigate to next student if in completion mode
    if (studentsToComplete && currentStudentIndex !== undefined && currentStudentIndex < studentsToComplete.length - 1) {
      onNavigateStudent?.('next');
    } else if (studentsToComplete && currentStudentIndex !== undefined) {
      // C'était le dernier étudiant, on réinitialise tout
      onAssessmentDeselected?.();
      setOpen(false);
    } else {
      setOpen(false);
    }
  } catch (error) {
    console.error("Error saving grade:", error);
    toast.error(t("grades.gradeError") || "Erreur lors de l'enregistrement de la note");
  } finally {
    setIsSubmitting(false);
  }
};

  useEffect(() => {
    if (open && preselectedAssessment) {
      setAssessmentName(preselectedAssessment.name);
      setAssessmentType(preselectedAssessment.type);
      setCustomLabel(preselectedAssessment.customLabel || "");
      setSelectedAssessment(preselectedAssessment.name);
    }
  }, [open, preselectedAssessment]);

  useEffect(() => {
    if (open) {
      setGrade("");
      setMaxGrade("20");
      setWeighting("1");
      setAppreciation("");
      setIsAbsent(false);
    }
  }, [open, student.id]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        fetchExistingAssessments();
      } else {
        // Réinitialiser la présélection quand on ferme le dialog
        if (onAssessmentDeselected) {
          onAssessmentDeselected();
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <ClipboardList className="w-4 h-4 mr-2" />
          {t("grades.addGrade") || "Ajouter une note"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Ajouter une note - {student.first_name} {student.last_name}
            </span>
            {studentsToComplete && currentStudentIndex !== undefined && (
              <span className="text-sm text-muted-foreground">
                {currentStudentIndex + 1} / {studentsToComplete.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {existingAssessments.length > 0 && (
            <div>
              <Label>Épreuve</Label>
              <Select value={selectedAssessment} onValueChange={handleAssessmentSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Reprendre une épreuve existante ou créer une nouvelle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">➕ Nouvelle épreuve</SelectItem>
                  {existingAssessments.map((assessment) => (
                    <SelectItem key={assessment.name} value={assessment.name}>
                      {assessment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Nom de l'épreuve * (max 50 caractères)</Label>
            <Input
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value.slice(0, 50))}
              placeholder="Ex: Contrôle continu 1, Examen final..."
              disabled={selectedAssessment !== "" && selectedAssessment !== "__new__"}
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">{assessmentName.length}/50 caractères</p>
          </div>
          <div>
            <Label>Type d'épreuve *</Label>
            <Select 
              value={assessmentType} 
              onValueChange={setAssessmentType}
              disabled={selectedAssessment !== "" && selectedAssessment !== "__new__"}
            >
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
                disabled={selectedAssessment !== "" && selectedAssessment !== "__new__"}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="absent"
              checked={isAbsent}
              onCheckedChange={(checked) => setIsAbsent(checked as boolean)}
            />
            <Label htmlFor="absent" className="cursor-pointer">
              Étudiant absent
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Note *</Label>
              <Input
                type="number"
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
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
            <Label>
              Appréciation (optionnel) - {appreciation.length}/{MAX_APPRECIATION_LENGTH} caractères
            </Label>
            <Textarea
              value={appreciation}
              onChange={(e) => {
                const text = e.target.value;
                if (text.length <= MAX_APPRECIATION_LENGTH) {
                  setAppreciation(text);
                }
              }}
              placeholder="Une phrase concise..."
              rows={2}
              maxLength={MAX_APPRECIATION_LENGTH}
            />
            {appreciation.length >= MAX_APPRECIATION_LENGTH && (
              <p className="text-xs text-amber-600">
                Limite atteinte ({MAX_APPRECIATION_LENGTH}/{MAX_APPRECIATION_LENGTH})
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {studentsToComplete && currentStudentIndex !== undefined && onNavigateStudent && (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onNavigateStudent('prev')}
                  disabled={isSubmitting || currentStudentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : (currentStudentIndex < studentsToComplete.length - 1 ? "Enregistrer et suivant" : "Enregistrer")}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onNavigateStudent('next')}
                  disabled={isSubmitting || currentStudentIndex >= studentsToComplete.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            {!studentsToComplete && (
              <>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : t("grades.save") || "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  {t("grades.cancel") || "Annuler"}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
