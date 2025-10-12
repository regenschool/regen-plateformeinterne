import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AddSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubjectAdded: () => void;
}

export function AddSubjectDialog({ open, onClose, onSubjectAdded }: AddSubjectDialogProps) {
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState("");
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!schoolYear || !semester || !className || !subjectName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (teacherEmail && !teacherEmail.includes("@")) {
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

      // Résoudre le teacher_id depuis l'email si fourni
      let targetTeacherId = user.id; // Par défaut, l'admin qui crée la matière
      
      if (teacherEmail) {
        // Chercher l'utilisateur avec cet email
        const { data: teacherUser } = await supabase.rpc('get_user_id_from_email', { 
          _email: teacherEmail 
        });
        
        if (teacherUser) {
          targetTeacherId = teacherUser;
        } else {
          toast.warning(`Aucun utilisateur trouvé pour ${teacherEmail}, matière assignée à vous-même`);
        }
      }

      const { error } = await supabase
        .from("subjects")
        .insert({
          teacher_id: targetTeacherId,
          teacher_email: teacherEmail || null,
          teacher_name: teacherName || (teacherEmail ? teacherEmail.split("@")[0] : "Admin"),
          school_year: schoolYear,
          semester,
          class_name: className,
          subject_name: subjectName,
        });

      if (error) throw error;

      toast.success("Matière ajoutée avec succès");
      
      // Reset form
      setTeacherEmail("");
      setTeacherName("");
      setSchoolYear("");
      setSemester("");
      setClassName("");
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
            <Label htmlFor="semester">Semestre *</Label>
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
            <Label htmlFor="className">Classe *</Label>
            <Input
              id="className"
              placeholder="Ex: B3"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectName">Nom de la matière *</Label>
            <Input
              id="subjectName"
              placeholder="Ex: Management"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>

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
            <Label htmlFor="teacherName">Nom de l'enseignant</Label>
            <Input
              id="teacherName"
              placeholder="Ex: Dupont"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
            />
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
