import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type AddStudentDialogProps = {
  onStudentAdded: () => void;
};

export const AddStudentDialog = ({ onStudentAdded }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    photo_url: "",
    age: "",
    academic_background: "",
    company: "",
    class_name: "",
    special_needs: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("students").insert({
        first_name: formData.first_name,
        last_name: formData.last_name,
        photo_url: formData.photo_url || null,
        age: formData.age ? parseInt(formData.age) : null,
        academic_background: formData.academic_background || null,
        company: formData.company || null,
        class_name: formData.class_name,
        special_needs: formData.special_needs || null,
      });

      if (error) throw error;

      toast.success("Student added successfully!");
      setOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        photo_url: "",
        age: "",
        academic_background: "",
        company: "",
        class_name: "",
        special_needs: "",
      });
      onStudentAdded();
    } catch (error: any) {
      toast.error("Failed to add student");
    } finally {
      setLoading(false);
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
            <Label htmlFor="class_name">Class *</Label>
            <Input
              id="class_name"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              placeholder="e.g., 2024 Cohort A"
              required
            />
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
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="1"
            />
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
