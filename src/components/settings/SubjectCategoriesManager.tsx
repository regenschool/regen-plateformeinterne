import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface SubjectCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
}

export const SubjectCategoriesManager = () => {
  const [editingCategory, setEditingCategory] = useState<SubjectCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["subject-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subject_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SubjectCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (category: { name: string; description?: string; color?: string; display_order?: number }) => {
      const { error } = await supabase
        .from("subject_categories")
        .insert([category]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-categories"] });
      toast.success("Catégorie créée");
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateMutation = useMutation({
    mutationFn: async (category: SubjectCategory) => {
      const { error } = await supabase
        .from("subject_categories")
        .update(category)
        .eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-categories"] });
      toast.success("Catégorie mise à jour");
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subject_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-categories"] });
      toast.success("Catégorie supprimée");
    },
    onError: () => toast.error("Impossible de supprimer (matières liées)"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };

    if (editingCategory) {
      updateMutation.mutate({ ...editingCategory, ...category });
    } else {
      createMutation.mutate(category);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Catégories de matières</CardTitle>
            <CardDescription>Gérez les référentiels pour organiser vos matières</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCategory(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCategory?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingCategory?.description || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue={editingCategory?.color || "#3b82f6"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordre d'affichage</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingCategory?.display_order || 0}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Couleur</TableHead>
              <TableHead className="w-24">Ordre</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                </TableCell>
                <TableCell>{category.display_order}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(category);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
