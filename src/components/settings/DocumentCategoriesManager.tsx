import { useState, useEffect } from "react";
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
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_required: false,
    is_active: true,
    required_for_role: "teacher",
    display_order: 0,
  });

  const [templateForm, setTemplateForm] = useState({
    field_name: "",
    field_label: "",
    field_type: "file",
    is_required: false,
    help_text: "",
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

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm & { category_id: string }) => {
      const { error } = await supabase.from("document_templates").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Champ créé avec succès");
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentTemplate> }) => {
      const { error } = await supabase
        .from("document_templates")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Champ mis à jour");
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
    },
    onError: (error) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Champ supprimé");
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

  const resetTemplateForm = () => {
    setTemplateForm({
      field_name: "",
      field_label: "",
      field_type: "file",
      is_required: false,
      help_text: "",
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

  const handleTemplateSubmit = () => {
    if (!selectedCategory) return;
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate({ ...templateForm, category_id: selectedCategory });
    }
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      field_name: template.field_name,
      field_label: template.field_label,
      field_type: template.field_type,
      is_required: template.is_required,
      help_text: template.help_text || "",
      display_order: template.display_order,
    });
    setIsTemplateDialogOpen(true);
  };

  // Auto-générer le field_name à partir du field_label
  useEffect(() => {
    if (templateForm.field_label && !editingTemplate) {
      const generatedName = templateForm.field_label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
        .replace(/[^a-z0-9]+/g, "_") // Remplacer les caractères spéciaux par _
        .replace(/^_+|_+$/g, ""); // Enlever les _ au début et à la fin
      
      setTemplateForm((prev) => ({ ...prev, field_name: generatedName }));
    }
  }, [templateForm.field_label, editingTemplate]);

  // Définir l'ordre d'affichage automatiquement
  useEffect(() => {
    if (isTemplateDialogOpen && !editingTemplate && templates.length > 0) {
      const maxOrder = Math.max(...templates.map((t) => t.display_order));
      setTemplateForm((prev) => ({ ...prev, display_order: maxOrder + 1 }));
    } else if (isTemplateDialogOpen && !editingTemplate) {
      setTemplateForm((prev) => ({ ...prev, display_order: 1 }));
    }
  }, [isTemplateDialogOpen, editingTemplate, templates]);

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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Documents demandés dans cette catégorie</h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(null);
                        resetTemplateForm();
                        setIsTemplateDialogOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter un document
                    </Button>
                  </div>
                  
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun document spécifique défini pour cette catégorie
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{tpl.field_label}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Type: {tpl.field_type}
                              </span>
                              {tpl.is_required && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  Requis
                                </span>
                              )}
                            </div>
                            {tpl.help_text && (
                              <p className="text-xs text-muted-foreground mt-1">{tpl.help_text}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(tpl)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Supprimer ce champ ?")) {
                                  deleteTemplateMutation.mutate(tpl.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
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

      {/* Dialog pour gérer les templates de documents */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Modifier le document" : "Ajouter un document"}
            </DialogTitle>
            <DialogDescription>
              Définissez un document spécifique à demander dans cette catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="field_label">Nom du document *</Label>
              <Input
                id="field_label"
                value={templateForm.field_label}
                onChange={(e) => setTemplateForm({ ...templateForm, field_label: e.target.value })}
                placeholder="Ex: Pièce d'identité, CV à jour..."
              />
            </div>
            <div>
              <Label htmlFor="field_name">Nom technique (généré automatiquement)</Label>
              <Input
                id="field_name"
                value={templateForm.field_name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, field_name: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                }
                placeholder="Ex: piece_identite, cv"
                disabled={!editingTemplate}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Généré automatiquement à partir du nom, modifiable uniquement en édition
              </p>
            </div>
            <div>
              <Label htmlFor="field_type">Type de champ</Label>
              <Select
                value={templateForm.field_type}
                onValueChange={(value) => setTemplateForm({ ...templateForm, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Fichier à uploader</SelectItem>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="help_text">Texte d'aide (optionnel)</Label>
              <Textarea
                id="help_text"
                value={templateForm.help_text}
                onChange={(e) => setTemplateForm({ ...templateForm, help_text: e.target.value })}
                placeholder="Instructions pour l'enseignant"
              />
            </div>
            <div>
              <Label htmlFor="template_order">Ordre d'affichage</Label>
              <Input
                id="template_order"
                type="number"
                value={templateForm.display_order}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, display_order: parseInt(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="template_required"
                checked={templateForm.is_required}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_required: checked })}
              />
              <Label htmlFor="template_required">Document obligatoire</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleTemplateSubmit}
              disabled={!templateForm.field_label || !templateForm.field_name}
            >
              {editingTemplate ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
