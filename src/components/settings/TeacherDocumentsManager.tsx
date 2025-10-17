import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Download, Upload, Trash2, Filter, Calendar, User, CheckCircle2, Clock, XCircle, Search, ChevronDown, Folder } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type TeacherDocument = {
  id: string;
  teacher_id: string;
  category_id: string | null;
  title: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  upload_source: 'admin' | 'teacher';
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  teacher_profile?: {
    full_name: string;
    email: string;
  };
  category?: {
    name: string;
  };
};

export function TeacherDocumentsManager() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["all-teacher-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_documents")
        .select(`
          *,
          teacher_profile:teacher_profiles!teacher_documents_teacher_id_fkey(full_name, email),
          category:document_categories(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeacherDocument[];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("teacher_documents")
        .update({ status, notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-teacher-documents"] });
      toast.success("Statut mis à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-teacher-documents"] });
      toast.success("Document supprimé");
    },
  });

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("teacher-invoices")
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("URL de téléchargement indisponible");

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Erreur lors du téléchargement: " + (error.message || ""));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterStatus !== "all" && doc.status !== filterStatus) return false;
    if (filterTeacher !== "all" && doc.teacher_id !== filterTeacher) return false;
    if (filterCategory !== "all" && doc.category_id !== filterCategory) return false;
    if (searchTerm && !doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Grouper les documents par catégorie
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    const categoryName = doc.category?.name || "Sans catégorie";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(doc);
    return acc;
  }, {} as Record<string, TeacherDocument[]>);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion documentaire enseignants</h2>
        <p className="text-sm text-muted-foreground">
          Tous les documents des enseignants centralisés
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nom du fichier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Statut</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Enseignant</label>
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Catégorie</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents groupés par catégorie en accordions */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(documentsByCategory)}>
          {Object.entries(documentsByCategory).map(([categoryName, categoryDocs]) => (
            <AccordionItem key={categoryName} value={categoryName} className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <h3 className="font-semibold text-base">{categoryName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryDocs.length} document{categoryDocs.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {categoryDocs.filter(d => d.status === 'pending').length} en attente
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {categoryDocs.filter(d => d.status === 'approved').length} approuvé{categoryDocs.filter(d => d.status === 'approved').length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4">
                    <div className="space-y-3">
                      {categoryDocs.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors animate-fade-in">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{doc.title || doc.file_name}</p>
                                  {doc.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground ml-7">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{doc.teacher_profile?.full_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}</span>
                                </div>
                                <Badge variant={getStatusBadgeVariant(doc.status)} className="text-xs">
                                  {getStatusLabel(doc.status)}
                                </Badge>
                                <Badge variant={doc.upload_source === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                  {doc.upload_source === 'admin' ? 'Admin' : 'Enseignant'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {doc.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: doc.id, status: 'approved' })}
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: doc.id, status: 'rejected' })}
                                    className="h-8 w-8 p-0"
                                  >
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Supprimer ce document ?")) {
                                    deleteMutation.mutate(doc.id);
                                  }
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
