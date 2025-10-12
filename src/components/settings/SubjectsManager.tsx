import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { AddSubjectDialog } from "@/components/AddSubjectDialog";
import { ImportSubjectsDialog } from "@/components/ImportSubjectsDialog";
import { useSubjects } from "@/hooks/useSubjects";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useCallback, useEffect } from "react";

export const SubjectsManager = () => {
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const fetchAllSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("school_year", { ascending: false })
        .order("class_name");

      if (error) throw error;
      setAllSubjects(data || []);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      toast.error("Erreur lors du chargement des matières");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSubjects();
  }, [fetchAllSubjects]);

  const handleDialogClose = useCallback(() => {
    setShowAddDialog(false);
    setShowImportDialog(false);
    fetchAllSubjects();
  }, [fetchAllSubjects]);

  const handleDelete = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (error) throw error;

      toast.success("Matière supprimée avec succès");
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const exportSubjectsToCSV = () => {
    if (allSubjects.length === 0) {
      toast.error("Aucune matière à exporter");
      return;
    }

    const headers = ["Année Scolaire", "Semestre", "Classe", "Matière", "Email Enseignant", "Nom Enseignant"];
    const csvContent = [
      headers.join(","),
      ...allSubjects.map(s => [
        s.school_year,
        s.semester,
        s.class_name,
        s.subject_name,
        (s as any).teacher_email || "",
        (s as any).teacher_name || ""
      ].map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `matieres_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export CSV réussi");
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <div>
              <CardTitle>Matières</CardTitle>
              <CardDescription>
                Gérer toutes les matières de l'école
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSubjectsToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              Importer CSV
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              Ajouter une matière
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Année Scolaire</TableHead>
              <TableHead>Semestre</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Enseignant</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allSubjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>{subject.school_year}</TableCell>
                <TableCell>{subject.semester}</TableCell>
                <TableCell>{subject.class_name}</TableCell>
                <TableCell className="font-medium">{subject.subject_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {subject.teacher_name || "-"}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(subject.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {allSubjects.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune matière enregistrée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AddSubjectDialog 
        open={showAddDialog} 
        onClose={handleDialogClose}
        onSubjectAdded={handleDialogClose}
      />

      <ImportSubjectsDialog 
        open={showImportDialog} 
        onClose={handleDialogClose}
        onImportComplete={handleDialogClose}
      />
    </Card>
  );
};
