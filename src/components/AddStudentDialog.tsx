import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { studentSchema } from "@/lib/validation";
import { useAddStudent } from "@/hooks/useStudents";
import { useClassesReferential } from "@/hooks/useReferentials";
import { toast } from "sonner";

type AddStudentDialogProps = {
  onStudentAdded: () => void;
  selectedSchoolYearId?: string;
};

export const AddStudentDialog = ({ onStudentAdded, selectedSchoolYearId }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
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

  const addStudent = useAddStudent();
  const { data: classes = [], isLoading: isLoadingClasses } = useClassesReferential(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: la classe doit être sélectionnée
    if (!formData.class_name) {
      toast.error("Vous devez sélectionner une classe existante");
      return;
    }

    // Vérifier que la classe existe dans le référentiel
    const classExists = classes.some(c => c.name === formData.class_name);
    if (!classExists) {
      toast.error("La classe sélectionnée n'existe pas. Veuillez d'abord créer la classe dans les Paramètres.");
      return;
    }

    try {
      const validatedData = studentSchema.parse({
        first_name: formData.first_name,
        last_name: formData.last_name,
        class_name: formData.class_name,
        photo_url: formData.photo_url || "",
        birth_date: formData.birth_date ? format(formData.birth_date, "yyyy-MM-dd") : null,
        academic_background: formData.academic_background || "",
        company: formData.company || "",
        special_needs: formData.special_needs || "",
      });

      await addStudent.mutateAsync({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        photo_url: validatedData.photo_url || null,
        birth_date: validatedData.birth_date,
        academic_background: validatedData.academic_background || null,
        company: validatedData.company || null,
        class_name: validatedData.class_name,
        special_needs: validatedData.special_needs || null,
        school_year_id: selectedSchoolYearId || null,
      });

      setOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        photo_url: "",
        birth_date: undefined,
        academic_background: "",
        company: "",
        class_name: "",
        special_needs: "",
      });
      onStudentAdded();
    } catch (error) {
      // Zod validation errors handled by the hook
      if (error instanceof Error && 'errors' in error) {
        console.error('Validation error:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
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
            <Select
              value={formData.class_name}
              onValueChange={(value) => setFormData({ ...formData, class_name: value })}
            >
              <SelectTrigger id="class_name">
                <SelectValue placeholder="Sélectionner une classe existante" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingClasses ? (
                  <SelectItem value="loading" disabled>Chargement...</SelectItem>
                ) : classes.length === 0 ? (
                  <SelectItem value="no-classes" disabled>
                    Aucune classe. Créez-en une dans Paramètres.
                  </SelectItem>
                ) : (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name} {cls.level ? `(${cls.level})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input
              id="photo_url"
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Date of Birth</Label>
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
                  {formData.birth_date ? format(formData.birth_date, "PPP") : <span>Pick a date</span>}
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
            <Label htmlFor="academic_background">Academic Background</Label>
            <Input
              id="academic_background"
              value={formData.academic_background}
              onChange={(e) => setFormData({ ...formData, academic_background: e.target.value })}
              placeholder="e.g., MBA, Engineering"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (Part-time)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g., Google, Microsoft"
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

          <Button type="submit" className="w-full" disabled={addStudent.isPending}>
            {addStudent.isPending ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
