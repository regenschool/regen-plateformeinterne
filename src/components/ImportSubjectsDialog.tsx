import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImportSubjectsDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportSubjectsDialog({ open, onClose, onImported }: ImportSubjectsDialogProps) {
  const [teacherEmail, setTeacherEmail] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState("");
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!teacherEmail || !schoolYear || !semester || !className || !subjectName) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!teacherEmail.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Créer la matière avec l'email de l'enseignant
      const { error } = await supabase
        .from("subjects")
        .insert({
          teacher_id: user.id, // L'admin qui crée
          teacher_email: teacherEmail, // L'enseignant assigné
          teacher_name: teacherEmail.split("@")[0], // Utiliser le début de l'email comme nom temporaire
          school_year: schoolYear,
          semester,
          class_name: className,
          subject_name: subjectName,
        });

      if (error) throw error;

      toast.success("Matière importée avec succès");
      setTeacherEmail("");
      setSchoolYear("");
      setSemester("");
      setClassName("");
      setSubjectName("");
      onImported();
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'import de la matière:", error);
      toast.error("Erreur lors de l'import de la matière");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importer une matière</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacherEmail">Email de l'enseignant</Label>
            <Input
              id="teacherEmail"
              type="email"
              placeholder="enseignant@example.com"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">Année scolaire</Label>
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger id="schoolYear">
                <SelectValue placeholder="Sélectionner une année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
                <SelectItem value="2026-2027">2026-2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semestre</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Sélectionner un semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semestre 1">Semestre 1</SelectItem>
                <SelectItem value="Semestre 2">Semestre 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="className">Classe</Label>
            <Input
              id="className"
              placeholder="Ex: B3"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectName">Nom de la matière</Label>
            <Input
              id="subjectName"
              placeholder="Ex: Management"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Import..." : "Importer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
