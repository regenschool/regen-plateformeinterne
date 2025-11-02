import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolYears, useAcademicPeriods, useClassesReferential } from "@/hooks/useReferentials";
import { useTeachers } from "@/hooks/useTeachers";

interface AddSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubjectAdded: () => void;
}

export function AddSubjectDialog({ open, onClose, onSubjectAdded }: AddSubjectDialogProps) {
  const [teacherId, setTeacherId] = useState("");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: schoolYears } = useSchoolYears(true);
  const { data: academicPeriods } = useAcademicPeriods(schoolYearId, true);
  const { data: classes } = useClassesReferential(true);
  const { data: teachers } = useTeachers();

  // Pré-sélectionner l'année scolaire active
  useEffect(() => {
    if (schoolYears && open && !schoolYearId) {
      const activeYear = schoolYears.find(y => y.is_active);
      if (activeYear) setSchoolYearId(activeYear.id);
    }
  }, [schoolYears, open, schoolYearId]);

  // Pré-sélectionner la période active
  useEffect(() => {
    if (academicPeriods && open && schoolYearId && !academicPeriodId) {
      const activePeriod = academicPeriods.find(p => p.is_active);
      if (activePeriod) setAcademicPeriodId(activePeriod.id);
    }
  }, [academicPeriods, open, schoolYearId, academicPeriodId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTeacherId("");
      setSchoolYearId("");
      setAcademicPeriodId("");
      setClassId("");
      setSubjectName("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!schoolYearId || !academicPeriodId || !classId || !subjectName || !teacherId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Récupérer le teachers.id depuis l'user_id
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', teacherId)
        .single();

      if (!teacherData) {
        throw new Error('Profil enseignant non trouvé');
      }

      const { error } = await supabase
        .from("subjects")
        .insert({
          teacher_fk_id: teacherData.id,  // ✅ Utiliser teacher_fk_id (FK vers teachers.id)
          subject_name: subjectName,
          class_fk_id: classId,
          school_year_fk_id: schoolYearId,
          academic_period_id: academicPeriodId,
        });

      if (error) throw error;

      toast.success("Matière ajoutée avec succès");
      
      // Reset form
      setTeacherId("");
      setSchoolYearId("");
      setAcademicPeriodId("");
      setClassId("");
      setSubjectName("");
      
      onSubjectAdded();
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la matière:", error);
      toast.error("Erreur lors de l'ajout de la matière");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une matière</DialogTitle>
          <DialogDescription>
            Créez une nouvelle matière en remplissant les informations ci-dessous
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolYear">Année scolaire *</Label>
            <Select value={schoolYearId} onValueChange={setSchoolYearId}>
              <SelectTrigger id="schoolYear">
                <SelectValue placeholder="Sélectionner une année" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Période académique *</Label>
            <Select 
              value={academicPeriodId} 
              onValueChange={setAcademicPeriodId}
              disabled={!schoolYearId}
            >
              <SelectTrigger id="semester">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                {academicPeriods?.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="className">Classe *</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger id="className">
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Enseignant *</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Sélectionner un enseignant" />
              </SelectTrigger>
              <SelectContent>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectName">Nom de la matière * (max 60 caractères)</Label>
            <Input
              id="subjectName"
              placeholder="Ex: Management"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value.slice(0, 60))}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">{subjectName.length}/60 caractères</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
