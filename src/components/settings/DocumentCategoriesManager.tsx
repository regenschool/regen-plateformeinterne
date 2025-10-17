import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, FileText, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DocumentCategory = {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  required_for_role: string;
  display_order: number;
};

type DocumentTemplate = {
  id: string;
  category_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  help_text: string | null;
  display_order: number;
};

export function DocumentCategoriesManager() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_required: false,
    is_active: true,
    required_for_role: "teacher",
    display_order: 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as DocumentCategory[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["document-templates", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("category_id", selectedCategory)
        .order("display_order");
      if (error) throw error;
      return data as DocumentTemplate[];
    },
    enabled: !!selectedCategory,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("document_categories").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      toast.success("Catégorie créée avec succès");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création : " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentCategory> }) => {
      const { error } = await supabase
        .from("document_categories")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      toast.success("Catégorie mise à jour");
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      toast.success("Catégorie supprimée");
    },
    onError: (error) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_required: false,
      is_active: true,
      required_for_role: "teacher",
      display_order: 0,
    });
  };

  const handleEdit = (category: DocumentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_required: category.is_required,
      is_active: category.is_active,
      required_for_role: category.required_for_role,
      display_order: category.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catégories de documents</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les sections de documents pour les profils enseignants
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCategory(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </DialogTitle>
              <DialogDescription>
                Configurez une section de documents pour les enseignants
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Documents administratifs"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la catégorie"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle concerné</Label>
                <Select
                  value={formData.required_for_role}
                  onValueChange={(value) => setFormData({ ...formData, required_for_role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Enseignant</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order">Ordre d'affichage</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                  />
                  <Label htmlFor="required">Obligatoire</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name}>
                {editingCategory ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id} className={!category.is_active ? "opacity-50" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {category.name}
                      {category.is_required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Obligatoire
                        </span>
                      )}
                      {!category.is_active && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="mt-1">{category.description}</CardDescription>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Ordre: {category.display_order} • Pour: {category.required_for_role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    {selectedCategory === category.id ? "Masquer" : "Voir"} champs
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Supprimer cette catégorie ?")) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {selectedCategory === category.id && (
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {templates.length === 0 ? (
                    <p>Aucun champ défini pour cette catégorie</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((tpl) => (
                        <div key={tpl.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium">{tpl.field_label}</p>
                            <p className="text-xs">Type: {tpl.field_type} {tpl.is_required && "(requis)"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
