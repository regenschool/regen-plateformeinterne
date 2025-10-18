import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Circle, Users, ListTodo, TrendingUp, Filter } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OnboardingTemplate = {
  id: string;
  item_name: string;
  description: string | null;
  category_id: string | null;
  is_default: boolean;
  display_order: number;
};

type TeacherOnboarding = {
  id: string;
  teacher_id: string;
  item_name: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  category_id: string | null;
  teacher_profile?: {
    full_name: string;
    email: string;
  };
};

export function OnboardingManager() {
  const queryClient = useQueryClient();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [templateForm, setTemplateForm] = useState({
    item_name: "",
    description: "",
    category_id: "",
    is_default: true,
  });

  // Fetch templates (à créer dans la DB)
  const { data: categories = [] } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allOnboardingItems = [] } = useQuery({
    queryKey: ["all-onboarding-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checklist")
        .select(`
          *,
          teacher_profile:teacher_profiles!onboarding_checklist_teacher_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeacherOnboarding[];
    },
  });

  // Filtrage et KPIs
  const filteredItems = useMemo(() => {
    return allOnboardingItems.filter((item) => {
      if (filterTeacher !== "all" && item.teacher_id !== filterTeacher) return false;
      if (filterCategory !== "all" && item.category_id !== filterCategory) return false;
      if (filterStatus === "completed" && !item.is_completed) return false;
      if (filterStatus === "pending" && item.is_completed) return false;
      return true;
    });
  }, [allOnboardingItems, filterTeacher, filterCategory, filterStatus]);

  // Group by teacher
  const itemsByTeacher = filteredItems.reduce((acc, item) => {
    const teacherName = item.teacher_profile?.full_name || "Inconnu";
    if (!acc[teacherName]) {
      acc[teacherName] = [];
    }
    acc[teacherName].push(item);
    return acc;
  }, {} as Record<string, TeacherOnboarding[]>);

  // KPIs globaux
  const totalTasks = allOnboardingItems.length;
  const completedTasks = allOnboardingItems.filter((i) => i.is_completed).length;
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const teachersWithFullProgress = Object.values(
    allOnboardingItems.reduce((acc, item) => {
      const teacherId = item.teacher_id;
      if (!acc[teacherId]) {
        acc[teacherId] = { total: 0, completed: 0 };
      }
      acc[teacherId].total += 1;
      if (item.is_completed) acc[teacherId].completed += 1;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>)
  ).filter((stats) => stats.total > 0 && stats.completed === stats.total).length;

  const createItemMutation = useMutation({
    mutationFn: async (data: { teacher_id: string; item_name: string; category_id?: string; notes?: string }) => {
      const { error } = await supabase.from("onboarding_checklist").insert({
        teacher_id: data.teacher_id,
        item_name: data.item_name,
        category_id: data.category_id || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-onboarding-items"] });
      toast.success("Tâche créée avec succès");
      setShowAssignDialog(false);
      setTemplateForm({ item_name: "", description: "", category_id: "", is_default: true });
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("onboarding_checklist")
        .update({ 
          is_completed: !is_completed,
          completed_at: !is_completed ? new Date().toISOString() : null
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-onboarding-items"] });
      toast.success("Statut mis à jour");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("onboarding_checklist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-onboarding-items"] });
      toast.success("Tâche supprimée");
    },
  });

  const assignToAll = async () => {
    if (!templateForm.item_name) {
      toast.error("Veuillez saisir un nom de tâche");
      return;
    }

    try {
      const items = teachers.map(teacher => ({
        teacher_id: teacher.user_id,
        item_name: templateForm.item_name,
        category_id: templateForm.category_id || null,
        notes: templateForm.description || null,
      }));

      const { error } = await supabase.from("onboarding_checklist").insert(items);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["all-onboarding-items"] });
      toast.success(`Tâche assignée à ${teachers.length} enseignant(s)`);
      setShowTemplateDialog(false);
      setTemplateForm({ item_name: "", description: "", category_id: "", is_default: true });
    } catch (error: any) {
      toast.error("Erreur lors de l'assignation");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion de l'onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Créez et gérez les tâches d'intégration des enseignants
        </p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListTodo className="h-4 w-4" />
              <CardDescription className="text-xs font-medium uppercase tracking-wide">Total</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">tâches</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <CardDescription className="text-xs font-medium uppercase tracking-wide">Terminées</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">tâches</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <CardDescription className="text-xs font-medium uppercase tracking-wide">Progression</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{globalProgress}%</p>
            <p className="text-xs text-muted-foreground mt-1">complétés</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <CardDescription className="text-xs font-medium uppercase tracking-wide">100%</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teachersWithFullProgress}</p>
            <p className="text-xs text-muted-foreground mt-1">enseignants</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="by-teacher" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-teacher">Par enseignant</TabsTrigger>
          <TabsTrigger value="quick-assign">Assignation rapide</TabsTrigger>
        </TabsList>

        <TabsContent value="by-teacher" className="space-y-4">
          {/* Filtres */}
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Filtres</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Enseignant</Label>
                  <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les enseignants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les enseignants</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.user_id} value={teacher.user_id}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="completed">Complétées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Tâches par enseignant</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {Object.keys(itemsByTeacher).length} enseignant(s) avec des tâches
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAssignDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Assigner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-3">
                {Object.entries(itemsByTeacher).map(([teacherName, items]) => {
                  const completed = items.filter(i => i.is_completed).length;
                  const total = items.length;
                  const progress = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <AccordionItem key={teacherName} value={teacherName} className="border rounded-lg">
                      <Card className="border-0">
                        <AccordionTrigger className="hover:no-underline px-4 py-3">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <h3 className="font-semibold text-sm">{teacherName}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {items[0]?.teacher_profile?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-medium">{completed}/{total} complétées</p>
                                <div className="w-32 h-2 bg-muted rounded-full mt-1">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              <Badge variant={progress === 100 ? "default" : "secondary"}>
                                {progress === 100 ? "Terminé" : "En cours"}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-4 pb-3 space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                              >
                                <button
                                  onClick={() => toggleCompletionMutation.mutate({ 
                                    id: item.id, 
                                    is_completed: item.is_completed 
                                  })}
                                  className="mt-0.5"
                                >
                                  {item.is_completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <p className={`font-medium text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.item_name}
                                  </p>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                  )}
                                  {item.completed_at && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Complété le {new Date(item.completed_at).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Supprimer cette tâche ?")) {
                                      deleteItemMutation.mutate(item.id);
                                    }
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-assign">
          <Card>
            <CardHeader>
              <CardTitle>Assignation rapide</CardTitle>
              <CardDescription>
                Créez une tâche et assignez-la à tous les enseignants d'un coup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">Nom de la tâche *</Label>
                <Input
                  id="task-name"
                  value={templateForm.item_name}
                  onChange={(e) => setTemplateForm({ ...templateForm, item_name: e.target.value })}
                  placeholder="Ex: Signer le contrat de travail"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description / Instructions</Label>
                <Textarea
                  id="task-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Détails optionnels pour guider l'enseignant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Lier à une catégorie de document (optionnel)</Label>
                <Select value={templateForm.category_id} onValueChange={(val) => setTemplateForm({ ...templateForm, category_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={assignToAll} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Assigner à tous les enseignants ({teachers.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog d'assignation individuelle */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner une tâche à un enseignant</DialogTitle>
            <DialogDescription>
              Créez une tâche d'onboarding spécifique
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enseignant *</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un enseignant" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.user_id} value={teacher.user_id}>
                      {teacher.full_name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom de la tâche *</Label>
              <Input
                value={templateForm.item_name}
                onChange={(e) => setTemplateForm({ ...templateForm, item_name: e.target.value })}
                placeholder="Ex: Compléter le profil"
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Détails optionnels"
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie de document (optionnel)</Label>
              <Select value={templateForm.category_id} onValueChange={(val) => setTemplateForm({ ...templateForm, category_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!selectedTeacher || !templateForm.item_name) {
                  toast.error("Veuillez remplir tous les champs requis");
                  return;
                }
                createItemMutation.mutate({
                  teacher_id: selectedTeacher,
                  item_name: templateForm.item_name,
                  category_id: templateForm.category_id,
                  notes: templateForm.description,
                });
              }}
            >
              Créer la tâche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}