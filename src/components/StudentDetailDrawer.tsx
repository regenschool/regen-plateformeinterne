import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, GraduationCap, FileText, X, Download, Edit2, Save, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteReportCard } from "@/hooks/useReportCardActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StudentDetailDrawerProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentDetailDrawer = ({ studentId, onClose }: StudentDetailDrawerProps) => {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteReportCard = useDeleteReportCard();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedStudent, setEditedStudent] = useState<any>(null);

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: reportCards } = useQuery({
    queryKey: ["student-report-cards", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_report_cards")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ["student-grades", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Mutation pour mettre à jour l'étudiant
  const updateStudentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      toast.success('Profil mis à jour');
      setIsEditingInfo(false);
    },
    onError: (error) => {
      console.error('Error updating student:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const handleSaveStudent = () => {
    if (editedStudent) {
      updateStudentMutation.mutate(editedStudent);
    }
  };

  const handleEditToggle = () => {
    if (!isEditingInfo) {
      setEditedStudent({
        first_name: student?.first_name,
        last_name: student?.last_name,
        birth_date: student?.birth_date,
        company: student?.company,
        academic_background: student?.academic_background,
      });
    }
    setIsEditingInfo(!isEditingInfo);
  };

  const handleDownloadPDF = async (pdfUrl: string, studentName: string, schoolYear: string, semester: string) => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bulletin_${studentName}_${schoolYear}_${semester}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDeleteBulletin = async (reportCardId: string) => {
    try {
      await deleteReportCard.mutateAsync(reportCardId);
      toast.success('Bulletin supprimé');
    } catch (error) {
      console.error('Error deleting report card:', error);
    }
  };

  const handleGradeClick = (grade: any) => {
    // Naviguer vers la page de saisie des notes avec TOUS les filtres pré-remplis
    const params = new URLSearchParams({
      subject: grade.subject,
      class: grade.class_name || student?.class_name || '',
      schoolYear: grade.school_year || '',
      semester: grade.semester || '',
    });
    navigate(`/grades?${params.toString()}`);
  };

  return (
    <Sheet open={!!studentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : student ? (
          <div className="h-full flex flex-col">
            {/* Header avec effet glassmorphism */}
            <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 animate-fade-in">
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-1">
                    {student.first_name} {student.last_name}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    {student.class_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:scale-110 hover:rotate-90 transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
                  <TabsTrigger value="info" className="transition-all hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <User className="h-4 w-4 mr-2" />
                    Infos
                  </TabsTrigger>
                  <TabsTrigger value="grades" className="transition-all hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="transition-all hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Bulletins</span>
                    {reportCards && reportCards.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-primary/20 rounded-full text-xs">
                        {reportCards.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 animate-fade-in">
                  <Card className="overflow-hidden hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          Informations personnelles
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant={isEditingInfo ? "default" : "outline"}
                            onClick={isEditingInfo ? handleSaveStudent : handleEditToggle}
                            disabled={updateStudentMutation.isPending}
                          >
                            {updateStudentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isEditingInfo ? (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer
                              </>
                            ) : (
                              <>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Modifier
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 pt-6">
                      <div className="space-y-1 group">
                        <Label className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Prénom</Label>
                        {isEditingInfo ? (
                          <Input
                            value={editedStudent?.first_name || ''}
                            onChange={(e) => setEditedStudent({ ...editedStudent, first_name: e.target.value })}
                            className="h-9"
                          />
                        ) : (
                          <p className="font-medium">{student.first_name}</p>
                        )}
                      </div>
                      <div className="space-y-1 group">
                        <Label className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Nom</Label>
                        {isEditingInfo ? (
                          <Input
                            value={editedStudent?.last_name || ''}
                            onChange={(e) => setEditedStudent({ ...editedStudent, last_name: e.target.value })}
                            className="h-9"
                          />
                        ) : (
                          <p className="font-medium">{student.last_name}</p>
                        )}
                      </div>
                      <div className="space-y-1 group">
                        <Label className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Classe</Label>
                        <p className="font-medium">{student.class_name}</p>
                      </div>
                      <div className="space-y-1 group">
                        <Label className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Date de naissance</Label>
                        {isEditingInfo ? (
                          <Input
                            type="date"
                            value={editedStudent?.birth_date || ''}
                            onChange={(e) => setEditedStudent({ ...editedStudent, birth_date: e.target.value })}
                            className="h-9"
                          />
                        ) : (
                          <p className="font-medium">
                            {student.birth_date
                              ? new Date(student.birth_date).toLocaleDateString("fr-FR")
                              : "-"}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1 group">
                        <Label className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Entreprise</Label>
                        {isEditingInfo ? (
                          <Input
                            value={editedStudent?.company || ''}
                            onChange={(e) => setEditedStudent({ ...editedStudent, company: e.target.value })}
                            className="h-9"
                            placeholder="Nom de l'entreprise"
                          />
                        ) : (
                          <p className="font-medium">{student.company || "-"}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1 group">
                        <Label className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Parcours académique</Label>
                        {isEditingInfo ? (
                          <Input
                            value={editedStudent?.academic_background || ''}
                            onChange={(e) => setEditedStudent({ ...editedStudent, academic_background: e.target.value })}
                            className="h-9"
                            placeholder="Parcours académique"
                          />
                        ) : (
                          <p className="font-medium">{student.academic_background || "-"}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="grades" className="space-y-4 animate-fade-in">
                  <Card className="overflow-hidden hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        Notes récentes
                      </CardTitle>
                      <CardDescription>Dernières évaluations</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {gradesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : grades && grades.length > 0 ? (
                        <div className="space-y-2">
                          {grades.slice(0, 10).map((grade, index) => (
                            <div
                              key={grade.id}
                              className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer animate-fade-in bg-card/30 backdrop-blur-sm"
                              style={{ animationDelay: `${index * 50}ms` }}
                              onClick={() => handleGradeClick(grade)}
                            >
                              <div>
                                <p className="font-medium text-sm">{grade.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                  {grade.assessment_name || grade.assessment_type}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">
                                  {grade.grade}<span className="text-sm text-muted-foreground">/{grade.max_grade}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Coef. {grade.weighting}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune note enregistrée
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4 animate-fade-in">
                  <Card className="overflow-hidden hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        Bulletins scolaires
                      </CardTitle>
                      <CardDescription>Historique des bulletins</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {reportCards && reportCards.length > 0 ? (
                        <div className="space-y-2">
                          {reportCards.map((report, index) => (
                            <div
                              key={report.id}
                              className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md transition-all animate-fade-in bg-card/30 backdrop-blur-sm"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {report.school_year} - {report.semester}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Classe: {report.class_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Généré le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    report.status === "finalized"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : report.status === "generated"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  }`}
                                >
                                  {report.status === "finalized" ? "Finalisé" : report.status === "generated" ? "Généré" : "Brouillon"}
                                </span>
                                {isAdmin && report.pdf_url && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="hover:scale-110 transition-transform"
                                    onClick={() => handleDownloadPDF(
                                      report.pdf_url!,
                                      `${student?.first_name}_${student?.last_name}`,
                                      report.school_year,
                                      report.semester
                                    )}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger
                                  </Button>
                                )}
                                {isAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className="hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer ce bulletin ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Le bulletin de <strong>{student?.first_name} {student?.last_name}</strong> pour {report.school_year} - {report.semester} sera définitivement supprimé.
                                          Cette action est irréversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteBulletin(report.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Aucun bulletin généré
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
