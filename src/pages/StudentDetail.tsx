import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, GraduationCap, User, Download } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: reportCards } = useQuery({
    queryKey: ["student-report-cards", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_report_cards")
        .select("*")
        .eq("student_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: grades } = useQuery({
    queryKey: ["student-grades", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select(`
          *,
          subjects!fk_grades_subject (
            subject_name,
            class_name,
            school_year,
            semester,
            teacher_name
          )
        `)
        .eq("student_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Étudiant introuvable</h1>
          <Button onClick={() => navigate("/")}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 animate-scale-in">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          className="hover:scale-110 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {student.class_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="info" className="transition-all hover:scale-105">
            <User className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="grades" className="transition-all hover:scale-105">
            <GraduationCap className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="reports" className="transition-all hover:scale-105">
            <FileText className="h-4 w-4 mr-2" />
            <span>Bulletins</span>
            {reportCards && reportCards.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                {reportCards.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 animate-fade-in">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prénom</p>
                <p className="font-medium">{student.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{student.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classe</p>
                <p className="font-medium">{student.class_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">
                  {student.birth_date
                    ? new Date(student.birth_date).toLocaleDateString("fr-FR")
                    : "-"}
                </p>
              </div>
              {student.company && (
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{student.company}</p>
                </div>
              )}
              {student.academic_background && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Parcours académique</p>
                  <p className="font-medium">{student.academic_background}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4 animate-fade-in">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                Notes récentes
              </CardTitle>
              <CardDescription>Dernières évaluations de l'étudiant</CardDescription>
            </CardHeader>
            <CardContent>
              {grades && grades.length > 0 ? (
                <div className="space-y-2">
                  {grades.slice(0, 10).map((grade, index) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 hover:scale-[1.02] transition-all cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div>
                        <p className="font-medium">{grade.subjects?.subject_name || 'Matière inconnue'}</p>
                        <p className="text-sm text-muted-foreground">
                          {grade.assessment_name || grade.assessment_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {grade.grade}/{grade.max_grade}
                        </p>
                        <p className="text-sm text-muted-foreground">
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
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                Bulletins scolaires
              </CardTitle>
              <CardDescription>Historique des bulletins générés</CardDescription>
            </CardHeader>
            <CardContent>
              {reportCards && reportCards.length > 0 ? (
                <div className="space-y-2">
                  {reportCards.map((report, index) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 hover:scale-[1.02] transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div>
                        <p className="font-medium">
                          {report.school_year} - {report.semester}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Classe: {report.class_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Généré le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            report.status === "finalized"
                              ? "bg-green-100 text-green-800"
                              : report.status === "generated"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.status === "finalized" ? "Finalisé" : report.status === "generated" ? "Généré" : "Brouillon"}
                        </span>
                        {isAdmin && report.pdf_url && (
                          <Button 
                            size="sm" 
                            className="hover:scale-110 transition-transform"
                            onClick={() => handleDownloadPDF(
                              report.pdf_url,
                              `${student.first_name}_${student.last_name}`,
                              report.school_year,
                              report.semester
                            )}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
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
  );
}
