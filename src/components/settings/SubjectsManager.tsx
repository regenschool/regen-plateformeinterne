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
import { AlertTriangle } from "lucide-react";

export const SubjectsManager = () => {
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [deleteSubject, setDeleteSubject] = useState<any>(null);
  const [gradeCount, setGradeCount] = useState(0);

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

  const handleDelete = async (subject: any) => {
    try {
      // Vérifier s'il existe des notes pour cette matière via subject_id
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select('id')
        .eq('subject_id', subject.id)
        .limit(1);

      if (gradesError) throw gradesError;

      // Si des notes existent, retourner le nombre pour l'affichage dans l'alerte
      if (grades && grades.length > 0) {
        // Compter le nombre total de notes via subject_id (architecture normalisée)
        const { count } = await supabase
          .from('grades')
          .select('id', { count: 'exact', head: true })
          .eq('subject_id', subject.id);

        return { hasGrades: true, count: count || 0 };
      }

      return { hasGrades: false, count: 0 };
    } catch (error: any) {
      console.error("Error checking grades:", error);
      toast.error("Erreur lors de la vérification");
      return { hasGrades: false, count: 0 };
    }
  };

  const confirmDelete = async (subject: any, deleteGrades: boolean = false) => {
    try {
      // Supprimer les notes et évaluations associées si demandé
      if (deleteGrades) {
        // Supprimer les notes via subject_id
        const { error: gradesError } = await supabase
          .from('grades')
          .delete()
          .eq('subject_id', subject.id);

        if (gradesError) throw gradesError;

        // Supprimer les évaluations (assessments) via subject_id (Phase 4A)
        const { error: assessmentsError } = await supabase
          .from('assessments')
          .delete()
          .eq('subject_id', subject.id);

        if (assessmentsError) throw assessmentsError;
      }

      // Supprimer la matière
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (error) throw error;

      toast.success(deleteGrades ? "Matière, notes et évaluations supprimées" : "Matière supprimée avec succès");
      fetchAllSubjects();
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
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={exportSubjectsToCSV} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button variant="outline" onClick={() => setShowImportDialog(true)} size="sm">
          Importer
        </Button>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
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
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={async () => {
                      const result = await handleDelete(subject);
                      setDeleteSubject(subject);
                      setGradeCount(result.count);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
      </Card>

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

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteSubject} onOpenChange={(open) => !open && setDeleteSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {gradeCount > 0 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {gradeCount > 0 ? (
                <>
                  <p className="font-medium text-orange-600">
                    ⚠️ Cette matière contient {gradeCount} note{gradeCount > 1 ? 's' : ''}.
                  </p>
                  <p>
                    Voulez-vous supprimer la matière <strong>{deleteSubject?.subject_name}</strong> ({deleteSubject?.class_name}, {deleteSubject?.school_year}, {deleteSubject?.semester}) ?
                  </p>
                  <p className="text-destructive font-medium">
                    Si vous confirmez, toutes les notes ET évaluations associées seront également supprimées. Cette action est irréversible.
                  </p>
                </>
              ) : (
                <p>
                  Êtes-vous sûr de vouloir supprimer la matière <strong>{deleteSubject?.subject_name}</strong> ({deleteSubject?.class_name}, {deleteSubject?.school_year}, {deleteSubject?.semester}) ?
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmDelete(deleteSubject, gradeCount > 0);
                setDeleteSubject(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer {gradeCount > 0 && `(${gradeCount} note${gradeCount > 1 ? 's' : ''})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
