import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Save, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReportCardPreview } from "./ReportCardPreview";

interface ReportCardTemplate {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  show_header: boolean;
  show_student_photo: boolean;
  show_student_info: boolean;
  show_academic_info: boolean;
  show_grades_table: boolean;
  show_average: boolean;
  show_class_average: boolean;
  show_appreciation: boolean;
  show_absences: boolean;
  show_signature: boolean;
  header_color: string;
  logo_url: string | null;
  footer_text: string | null;
  show_weighting: boolean;
  show_max_grade: boolean;
  show_assessment_type: boolean;
}

export const ReportCardTemplatesManager = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportCardTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["report-card-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_card_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ReportCardTemplate[];
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: ReportCardTemplate) => {
      const { error } = await supabase
        .from("report_card_templates")
        .update(template)
        .eq("id", template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-card-templates"] });
      toast.success("Modèle mis à jour");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("report_card_templates")
        .insert({ name });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-card-templates"] });
      toast.success("Modèle créé");
    },
    onError: (error) => {
      console.error("Erreur lors de la création:", error);
      toast.error("Erreur lors de la création");
    },
  });

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplateMutation.mutate(selectedTemplate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modèles de Bulletins</h2>
          <p className="text-muted-foreground">
            Configurez l'apparence et le contenu des bulletins PDF
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau modèle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nom du modèle</Label>
                <Input
                  placeholder="Ex: Modèle Personnalisé"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        createTemplateMutation.mutate(input.value);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Modèles disponibles</CardTitle>
            <CardDescription>Sélectionnez un modèle à configurer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates?.map((template) => (
              <div key={template.id} className="flex gap-2">
                <Button
                  variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                  className="flex-1 justify-start"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(false);
                  }}
                >
                  {template.name}
                  {template.is_default && " (Par défaut)"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                  title="Aperçu"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle>Configuration: {selectedTemplate.name}</CardTitle>
              <CardDescription>Personnalisez le modèle de bulletin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Sections à afficher</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show_header">En-tête</Label>
                  <Switch
                    id="show_header"
                    checked={selectedTemplate.show_header}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_header: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_student_photo">Photo de l'étudiant</Label>
                  <Switch
                    id="show_student_photo"
                    checked={selectedTemplate.show_student_photo}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_student_photo: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_student_info">Informations étudiant</Label>
                  <Switch
                    id="show_student_info"
                    checked={selectedTemplate.show_student_info}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_student_info: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_grades_table">Tableau des notes</Label>
                  <Switch
                    id="show_grades_table"
                    checked={selectedTemplate.show_grades_table}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_grades_table: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_average">Moyenne générale</Label>
                  <Switch
                    id="show_average"
                    checked={selectedTemplate.show_average}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_average: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_class_average">Moyenne de classe</Label>
                  <Switch
                    id="show_class_average"
                    checked={selectedTemplate.show_class_average}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_class_average: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_appreciation">Appréciations</Label>
                  <Switch
                    id="show_appreciation"
                    checked={selectedTemplate.show_appreciation}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_appreciation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_absences">Absences</Label>
                  <Switch
                    id="show_absences"
                    checked={selectedTemplate.show_absences}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_absences: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_signature">Signature</Label>
                  <Switch
                    id="show_signature"
                    checked={selectedTemplate.show_signature}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_signature: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Détails des notes</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show_weighting">Coefficient</Label>
                  <Switch
                    id="show_weighting"
                    checked={selectedTemplate.show_weighting}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_weighting: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_max_grade">Note maximale</Label>
                  <Switch
                    id="show_max_grade"
                    checked={selectedTemplate.show_max_grade}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_max_grade: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_assessment_type">Type d'évaluation</Label>
                  <Switch
                    id="show_assessment_type"
                    checked={selectedTemplate.show_assessment_type}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, show_assessment_type: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Personnalisation visuelle</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="header_color">Couleur de l'en-tête</Label>
                  <Input
                    id="header_color"
                    type="color"
                    value={selectedTemplate.header_color}
                    onChange={(e) =>
                      setSelectedTemplate({ ...selectedTemplate, header_color: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Texte de pied de page</Label>
                  <Textarea
                    id="footer_text"
                    value={selectedTemplate.footer_text || ""}
                    onChange={(e) =>
                      setSelectedTemplate({ ...selectedTemplate, footer_text: e.target.value })
                    }
                    placeholder="Texte personnalisé en bas du bulletin"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={selectedTemplate.is_active}
                    onCheckedChange={(checked) =>
                      setSelectedTemplate({ ...selectedTemplate, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Modèle actif</Label>
                </div>

                <Button onClick={handleSaveTemplate} disabled={updateTemplateMutation.isPending}>
                  {updateTemplateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Aperçu: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && <ReportCardPreview template={selectedTemplate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};
