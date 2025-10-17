import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Download, Trash2, Folder, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type DocumentCategory = {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
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

type TeacherDocument = {
  id: string;
  teacher_id: string;
  category_id: string | null;
  title: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  upload_source: 'admin' | 'teacher';
  expiry_date: string | null;
  created_at: string;
};

type TeacherDocumentsSectionProps = {
  userId: string;
};

export function TeacherDocumentsSection({ userId }: TeacherDocumentsSectionProps) {
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["active-document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .eq("is_active", true)
        .eq("required_for_role", "teacher")
        .order("display_order");
      if (error) throw error;
      return data as DocumentCategory[];
    },
  });

  // Charger TOUS les templates de toutes les catégories actives
  const { data: allTemplates = [] } = useQuery({
    queryKey: ["all-category-templates"],
    queryFn: async () => {
      if (categories.length === 0) return [];
      
      const categoryIds = categories.map((c) => c.id);
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .in("category_id", categoryIds)
        .order("display_order");
      
      if (error) throw error;
      return data as DocumentTemplate[];
    },
    enabled: categories.length > 0,
  });

  // Templates pour la catégorie sélectionnée (pour la dialog)
  const { data: templates = [] } = useQuery({
    queryKey: ["category-templates", selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("category_id", selectedCategory.id)
        .order("display_order");
      if (error) throw error;
      return data as DocumentTemplate[];
    },
    enabled: !!selectedCategory,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["teacher-documents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_documents")
        .select("*")
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeacherDocument[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; title: string; description: string; categoryId: string }) => {
      const fileExt = data.file.name.split(".").pop();
      const fileName = `${userId}/${data.categoryId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("teacher-invoices")
        .upload(fileName, data.file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("teacher_documents")
        .insert({
          teacher_id: userId,
          category_id: data.categoryId,
          title: data.title,
          description: data.description,
          file_name: data.file.name,
          file_path: fileName,
          file_type: data.file.type,
          file_size: data.file.size,
          status: "pending",
          upload_source: "teacher",
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-documents", userId] });
      toast.success("Document uploadé avec succès");
      setUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", file: null });
    },
    onError: (error: any) => {
      toast.error("Erreur lors de l'upload : " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: TeacherDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("teacher-invoices")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("teacher_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-documents", userId] });
      toast.success("Document supprimé");
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("teacher-invoices")
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Pas d'URL de téléchargement");

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Téléchargement lancé");
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement : " + error.message);
    }
  };

  const handleUploadClick = (category: DocumentCategory, template?: DocumentTemplate) => {
    setSelectedCategory(category);
    setSelectedTemplate(template || null);
    setUploadForm({
      title: template?.field_label || "",
      description: "",
      file: null,
    });
    setUploadDialogOpen(true);
  };

  const handleUpload = () => {
    if (!uploadForm.file || !selectedCategory) return;

    uploadMutation.mutate({
      file: uploadForm.file,
      title: uploadForm.title || uploadForm.file.name,
      description: uploadForm.description,
      categoryId: selectedCategory.id,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Validé";
      case "rejected":
        return "Rejeté";
      default:
        return "En attente";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success";
      case "rejected":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Mes Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune catégorie de documents configurée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mes Documents
              </CardTitle>
              <CardDescription className="mt-1">
                Gérez vos documents administratifs par catégorie
              </CardDescription>
            </div>
            <Badge variant="outline">
              {documents.length} document{documents.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-3">
            {categories.map((category) => {
              const categoryDocs = documents.filter(d => d.category_id === category.id);
              const approvedCount = categoryDocs.filter(d => d.status === 'approved').length;
              const pendingCount = categoryDocs.filter(d => d.status === 'pending').length;
              
              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                  <Card className="border-0">
                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm">{category.name}</h3>
                              {category.is_required && (
                                <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {categoryDocs.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              {approvedCount > 0 && (
                                <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                                  {approvedCount} validé{approvedCount > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {pendingCount > 0 && (
                                <Badge variant="secondary">
                                  {pendingCount} en attente
                                </Badge>
                              )}
                            </div>
                          )}
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadClick(category);
                            }} 
                            size="sm"
                            className="ml-2"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 pb-3 space-y-4">
                        {/* Champs spécifiques définis dans les templates */}
                        {(() => {
                          const categoryTemplates = allTemplates.filter((t) => t.category_id === category.id);
                          return categoryTemplates.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">Documents demandés :</h4>
                            {categoryTemplates.map((template) => {
                              const templateDoc = categoryDocs.find(
                                (d) => d.title === template.field_label
                              );
                              
                              return (
                                <div
                                  key={template.id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{template.field_label}</p>
                                      {template.is_required && (
                                        <Badge variant="destructive" className="text-xs">Requis</Badge>
                                      )}
                                    </div>
                                    {template.help_text && (
                                      <p className="text-xs text-muted-foreground mt-1">{template.help_text}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {templateDoc ? (
                                      <Badge variant={getStatusBadgeVariant(templateDoc.status)} className="text-xs">
                                        {getStatusIcon(templateDoc.status)}
                                        <span className="ml-1">{getStatusLabel(templateDoc.status)}</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">Non fourni</Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      variant={templateDoc ? "outline" : "default"}
                                      onClick={() => handleUploadClick(category, template)}
                                    >
                                      <Upload className="w-3 h-3 mr-1" />
                                      {templateDoc ? "Remplacer" : "Ajouter"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                        })()}

                        {/* Autres documents de la catégorie */}
                        {categoryDocs.length > 0 && (
                          <div className="space-y-2">
                            {(() => {
                              const categoryTemplates = allTemplates.filter((t) => t.category_id === category.id);
                              return categoryTemplates.length > 0 && (
                                <h4 className="text-sm font-semibold text-muted-foreground">Autres documents :</h4>
                              );
                            })()}
                            {categoryDocs
                              .filter((doc) => !allTemplates.some((t) => t.field_label === doc.title && t.category_id === category.id))
                              .map((doc) => (
                                <div key={doc.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors animate-fade-in">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                      {getStatusIcon(doc.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{doc.title || doc.file_name}</p>
                                          {doc.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                                          )}
                                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              <span>{format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}</span>
                                            </div>
                                            {doc.upload_source === "admin" && (
                                              <Badge variant="outline" className="text-xs">Uploadé par l'école</Badge>
                                            )}
                                            {doc.expiry_date && (
                                              <span className="text-orange-600">
                                                Expire le {format(new Date(doc.expiry_date), "dd MMM yyyy", { locale: fr })}
                                              </span>
                                            )}
                                          </div>
                                          {doc.notes && (
                                            <p className="text-xs text-muted-foreground mt-1.5 p-2 bg-muted/50 rounded italic">
                                              Note: {doc.notes}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Badge variant={getStatusBadgeVariant(doc.status)} className="text-xs whitespace-nowrap">
                                            {getStatusLabel(doc.status)}
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                          {doc.upload_source === "teacher" && doc.status === "pending" && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                if (confirm("Supprimer ce document ?")) {
                                                  deleteMutation.mutate(doc);
                                                }
                                              }}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {(() => {
                          const categoryTemplates = allTemplates.filter((t) => t.category_id === category.id);
                          return categoryDocs.length === 0 && categoryTemplates.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Aucun document dans cette catégorie</p>
                            </div>
                          );
                        })()}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploader un document</DialogTitle>
            <DialogDescription>
              {selectedCategory?.name}
              {selectedTemplate && ` - ${selectedTemplate.field_label}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate?.help_text && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">{selectedTemplate.help_text}</p>
              </div>
            )}
            <div>
              <Label htmlFor="file">
                Fichier *
                {selectedTemplate?.is_required && (
                  <span className="text-destructive ml-1">(obligatoire)</span>
                )}
              </Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              />
            </div>
            {!selectedTemplate && (
              <>
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="Titre du document (optionnel)"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Description du document (optionnel)"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={!uploadForm.file || uploading}>
              {uploading ? "Upload en cours..." : "Uploader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
