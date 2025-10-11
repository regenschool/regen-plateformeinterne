import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Pencil, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  birth_date: string | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
  special_needs: string | null;
};

type EditStudentDialogProps = {
  student: Student;
  onStudentUpdated: () => void;
};

export const EditStudentDialog = ({ student, onStudentUpdated }: EditStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    photo_url: "",
    birth_date: undefined as Date | undefined,
    academic_background: "",
    company: "",
    class_name: "",
    special_needs: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        first_name: student.first_name,
        last_name: student.last_name,
        photo_url: student.photo_url || "",
        birth_date: student.birth_date ? parseISO(student.birth_date) : undefined,
        academic_background: student.academic_background || "",
        company: student.company || "",
        class_name: student.class_name,
        special_needs: student.special_needs || "",
      });
    }
  }, [open, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          photo_url: formData.photo_url || null,
          birth_date: formData.birth_date ? format(formData.birth_date, "yyyy-MM-dd") : null,
          academic_background: formData.academic_background || null,
          company: formData.company || null,
          class_name: formData.class_name,
          special_needs: formData.special_needs || null,
        })
        .eq("id", student.id);

      if (error) throw error;

      toast.success("Fiche étudiant modifiée avec succès !");
      setOpen(false);
      onStudentUpdated();
    } catch (error: any) {
      toast.error("Échec de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/90 hover:bg-white">
          <Pencil className="w-3.5 h-3.5 text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la fiche étudiant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_name">Classe *</Label>
            <Input
              id="class_name"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              placeholder="ex: Cohorte 2024 A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">URL de la photo</Label>
            <Input
              id="photo_url"
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Date de naissance</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.birth_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birth_date ? format(formData.birth_date, "PPP") : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.birth_date}
                  onSelect={(date) => setFormData({ ...formData, birth_date: date })}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_background">Parcours académique</Label>
            <Input
              id="academic_background"
              value={formData.academic_background}
              onChange={(e) => setFormData({ ...formData, academic_background: e.target.value })}
              placeholder="ex: MBA, Ingénierie"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise (temps partiel)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="ex: Google, Microsoft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_needs">Situation médicale / Tiers temps</Label>
            <Input
              id="special_needs"
              value={formData.special_needs}
              onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
              placeholder="ex: Dyslexie, Tiers temps..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Modification..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
