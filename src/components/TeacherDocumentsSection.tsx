import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Download, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DocumentCategory = {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
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

  const handleUploadClick = (category: DocumentCategory) => {
    setSelectedCategory(category);
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

  return (
    <>
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryDocs = documents.filter(d => d.category_id === category.id);
          
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {category.name}
                      {category.is_required && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                          Obligatoire
                        </span>
                      )}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="mt-1">{category.description}</CardDescription>
                    )}
                  </div>
                  <Button onClick={() => handleUploadClick(category)} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categoryDocs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">Aucun document dans cette catégorie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryDocs.map((doc) => (
                      <div key={doc.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(doc.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.title || doc.file_name}</p>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{doc.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>Upload: {doc.upload_source === "teacher" ? "Par moi" : "Par l'école"}</span>
                                <span>•</span>
                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                {doc.expiry_date && (
                                  <>
                                    <span>•</span>
                                    <span>Expire le {new Date(doc.expiry_date).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                              {doc.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">Note: {doc.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getStatusColor(doc.status)}`}>
                                {getStatusLabel(doc.status)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadDocument(doc.file_path, doc.file_name)}
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
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploader un document</DialogTitle>
            <DialogDescription>
              {selectedCategory?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Fichier *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              />
            </div>
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
