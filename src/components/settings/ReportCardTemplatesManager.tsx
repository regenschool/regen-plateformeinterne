import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Save, Eye, Code, Palette, Settings2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReportCardPreview } from "./ReportCardPreview";
import { HtmlTemplateEditor } from "./HtmlTemplateEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ReportCardTemplate {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  show_header: boolean;
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
  show_grade_detail: boolean;
  show_subject_average: boolean;
  html_template?: string | null;
  css_template?: string | null;
  use_custom_html?: boolean;
  show_student_photo?: boolean;
  show_student_birth_date?: boolean;
  show_student_age?: boolean;
  show_logo?: boolean;
  show_footer?: boolean;
  show_subject_teacher?: boolean;
  show_general_appreciation?: boolean;
  grade_display_format?: string;
  show_individual_grades?: boolean;
  show_min_max_grades?: boolean;
  show_program_name?: boolean;
  program_name?: string;
  signature_url?: string;
}

export const ReportCardTemplatesManager = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportCardTemplate | null>(null);
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
      toast.success("Modèle enregistré avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la sauvegarde");
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
      toast.success("Nouveau modèle créé");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Modèles de Bulletins</h2>
          <p className="text-muted-foreground mt-1">
            Créez et personnalisez vos templates de bulletins PDF
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">
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
                  placeholder="Ex: Bulletin Standard 2025"
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

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar - Liste des templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mes modèles</CardTitle>
            <CardDescription>Sélectionnez un modèle à modifier</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {templates?.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{template.name}</p>
                        <div className="flex gap-2 mt-2">
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Par défaut
                            </Badge>
                          )}
                          {template.is_active && (
                            <Badge variant="outline" className="text-xs">
                              Actif
                            </Badge>
                          )}
                          {template.use_custom_html && (
                            <Badge variant="outline" className="text-xs">
                              <Code className="h-3 w-3 mr-1" />
                              HTML
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Configuration du template */}
        {selectedTemplate ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Personnalisez l'apparence et le contenu du bulletin
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={updateTemplateMutation.isPending}>
                    {updateTemplateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">
                    <FileText className="h-4 w-4 mr-2" />
                    Contenu
                  </TabsTrigger>
                  <TabsTrigger value="style">
                    <Palette className="h-4 w-4 mr-2" />
                    Style
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <Code className="h-4 w-4 mr-2" />
                    Avancé
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Contenu */}
                <TabsContent value="content" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sections principales</CardTitle>
                      <CardDescription>
                        Activez ou désactivez les grandes sections du bulletin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label htmlFor="show_header">En-tête du bulletin</Label>
                            <p className="text-sm text-muted-foreground">
                              Titre et informations académiques
                            </p>
                          </div>
                          <Switch
                            id="show_header"
                            checked={selectedTemplate.show_header}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_header: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label htmlFor="show_student_info">Section étudiant</Label>
                            <p className="text-sm text-muted-foreground">
                              Informations personnelles
                            </p>
                          </div>
                          <Switch
                            id="show_student_info"
                            checked={selectedTemplate.show_student_info}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_student_info: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label htmlFor="show_grades_table">Tableau des notes</Label>
                            <p className="text-sm text-muted-foreground">
                              Liste complète des évaluations
                            </p>
                          </div>
                          <Switch
                            id="show_grades_table"
                            checked={selectedTemplate.show_grades_table}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_grades_table: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label htmlFor="show_average">Moyennes</Label>
                            <p className="text-sm text-muted-foreground">
                              Moyenne générale et de classe
                            </p>
                          </div>
                          <Switch
                            id="show_average"
                            checked={selectedTemplate.show_average}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_average: checked })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Détails de l'étudiant</CardTitle>
                      <CardDescription>
                        Choisissez les informations à afficher sur l'étudiant
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_student_photo">Photo de l'étudiant</Label>
                          <Switch
                            id="show_student_photo"
                            checked={selectedTemplate.show_student_photo ?? true}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_student_photo: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_student_birth_date">Date de naissance</Label>
                          <Switch
                            id="show_student_birth_date"
                            checked={selectedTemplate.show_student_birth_date ?? true}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_student_birth_date: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_student_age">Âge de l'étudiant</Label>
                          <Switch
                            id="show_student_age"
                            checked={selectedTemplate.show_student_age ?? false}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_student_age: checked })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Détails des notes</CardTitle>
                      <CardDescription>
                        Configurez l'affichage du tableau de notes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Format d'affichage des notes</Label>
                          <div className="grid gap-2">
                            {[
                              { value: 'fraction', label: 'Fraction (15/20)', desc: 'Format classique' },
                              { value: 'percentage', label: 'Pourcentage (75%)', desc: 'En pourcentage' },
                              { value: 'points', label: 'Points (15 pts)', desc: 'Points sur total' },
                            ].map((format) => (
                              <div
                                key={format.value}
                                onClick={() =>
                                  setSelectedTemplate({ ...selectedTemplate, grade_display_format: format.value })
                                }
                                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  (selectedTemplate.grade_display_format || 'fraction') === format.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <div>
                                  <p className="font-medium">{format.label}</p>
                                  <p className="text-sm text-muted-foreground">{format.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <Label htmlFor="show_weighting">Coefficient</Label>
                            <Switch
                              id="show_weighting"
                              checked={selectedTemplate.show_weighting}
                              onCheckedChange={(checked) =>
                                setSelectedTemplate({ ...selectedTemplate, show_weighting: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <Label htmlFor="show_assessment_type">Type d'évaluation</Label>
                            <Switch
                              id="show_assessment_type"
                              checked={selectedTemplate.show_assessment_type}
                              onCheckedChange={(checked) =>
                                setSelectedTemplate({ ...selectedTemplate, show_assessment_type: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <Label htmlFor="show_subject_teacher">Nom du professeur</Label>
                            <Switch
                              id="show_subject_teacher"
                              checked={selectedTemplate.show_subject_teacher ?? false}
                              onCheckedChange={(checked) =>
                                setSelectedTemplate({ ...selectedTemplate, show_subject_teacher: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <Label htmlFor="show_appreciation">Appréciations</Label>
                            <Switch
                              id="show_appreciation"
                              checked={selectedTemplate.show_appreciation}
                              onCheckedChange={(checked) =>
                                setSelectedTemplate({ ...selectedTemplate, show_appreciation: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Éléments additionnels</CardTitle>
                      <CardDescription>
                        Logo, pied de page et appréciations générales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_logo">Logo de l'établissement</Label>
                          <Switch
                            id="show_logo"
                            checked={selectedTemplate.show_logo ?? true}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_logo: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_footer">Pied de page</Label>
                          <Switch
                            id="show_footer"
                            checked={selectedTemplate.show_footer ?? true}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_footer: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_general_appreciation">Appréciation générale</Label>
                          <Switch
                            id="show_general_appreciation"
                            checked={selectedTemplate.show_general_appreciation ?? true}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_general_appreciation: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_class_average">Moyenne de classe</Label>
                          <Switch
                            id="show_class_average"
                            checked={selectedTemplate.show_class_average}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_class_average: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_individual_grades">Notes individuelles par matière</Label>
                          <Switch
                            id="show_individual_grades"
                            checked={selectedTemplate.show_individual_grades === true}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_individual_grades: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_min_max_grades">Min/Max par matière</Label>
                          <Switch
                            id="show_min_max_grades"
                            checked={selectedTemplate.show_min_max_grades !== false}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_min_max_grades: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label htmlFor="show_program_name">Afficher le nom du programme</Label>
                          <Switch
                            id="show_program_name"
                            checked={selectedTemplate.show_program_name !== false}
                            onCheckedChange={(checked) =>
                              setSelectedTemplate({ ...selectedTemplate, show_program_name: checked })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onglet Style */}
                <TabsContent value="style" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Couleurs et design</CardTitle>
                      <CardDescription>
                        Personnalisez l'apparence visuelle du bulletin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="header_color">Couleur principale</Label>
                          <div className="flex gap-4 items-center">
                            <Input
                              id="header_color"
                              type="color"
                              value={selectedTemplate.header_color}
                              onChange={(e) =>
                                setSelectedTemplate({ ...selectedTemplate, header_color: e.target.value })
                              }
                              className="w-20 h-10"
                            />
                            <Input
                              type="text"
                              value={selectedTemplate.header_color}
                              onChange={(e) =>
                                setSelectedTemplate({ ...selectedTemplate, header_color: e.target.value })
                              }
                              className="font-mono"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Utilisée pour l'en-tête et les accents
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="program_name">Nom du programme</Label>
                          <Input
                            id="program_name"
                            value={selectedTemplate.program_name || 'Programme de Formation'}
                            onChange={(e) =>
                              setSelectedTemplate({ ...selectedTemplate, program_name: e.target.value })
                            }
                            placeholder="Ex: Programme Grande École"
                          />
                          <p className="text-sm text-muted-foreground">
                            Affiché dans l'en-tête du bulletin
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="logo_url">Logo de l'établissement (URL)</Label>
                          <Input
                            id="logo_url"
                            value={selectedTemplate.logo_url || ''}
                            onChange={(e) =>
                              setSelectedTemplate({ ...selectedTemplate, logo_url: e.target.value })
                            }
                            placeholder="https://..."
                          />
                          <p className="text-sm text-muted-foreground">
                            Uploadez d'abord votre logo dans le stockage puis collez l'URL publique ici
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="signature_url">Signature (Directeur/Responsable)</Label>
                          <Input
                            id="signature_url"
                            value={selectedTemplate.signature_url || ''}
                            onChange={(e) =>
                              setSelectedTemplate({ ...selectedTemplate, signature_url: e.target.value })
                            }
                            placeholder="https://..."
                          />
                          <p className="text-sm text-muted-foreground">
                            Uploadez la signature dans le stockage puis collez l'URL publique ici
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="footer_text">Texte de pied de page</Label>
                          <Textarea
                            id="footer_text"
                            value={selectedTemplate.footer_text || ""}
                            onChange={(e) =>
                              setSelectedTemplate({ ...selectedTemplate, footer_text: e.target.value })
                            }
                            placeholder="Ex: École Supérieure - Année 2025-2026"
                            rows={3}
                          />
                          <p className="text-sm text-muted-foreground">
                            Texte affiché en bas du bulletin
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Paramètres du modèle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-0.5">
                          <Label htmlFor="is_active">Modèle actif</Label>
                          <p className="text-sm text-muted-foreground">
                            Utilisable pour la génération de bulletins
                          </p>
                        </div>
                        <Switch
                          id="is_active"
                          checked={selectedTemplate.is_active}
                          onCheckedChange={(checked) =>
                            setSelectedTemplate({ ...selectedTemplate, is_active: checked })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onglet Avancé - HTML/CSS */}
                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Personnalisation HTML/CSS
                      </CardTitle>
                      <CardDescription>
                        Pour les utilisateurs avancés : créez un template complètement personnalisé
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <HtmlTemplateEditor
                        htmlTemplate={selectedTemplate.html_template || undefined}
                        cssTemplate={selectedTemplate.css_template || undefined}
                        useCustomHtml={selectedTemplate.use_custom_html || false}
                        onHtmlChange={(html) =>
                          setSelectedTemplate({ ...selectedTemplate, html_template: html })
                        }
                        onCssChange={(css) =>
                          setSelectedTemplate({ ...selectedTemplate, css_template: css })
                        }
                        onUseCustomHtmlChange={(use) =>
                          setSelectedTemplate({ ...selectedTemplate, use_custom_html: use })
                        }
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-[600px] text-center">
              <Settings2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun modèle sélectionné</h3>
              <p className="text-muted-foreground max-w-md">
                Sélectionnez un modèle dans la liste ou créez-en un nouveau pour commencer
              </p>
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
