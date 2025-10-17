import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, GraduationCap, User } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
        .select("*")
        .eq("student_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-muted-foreground">{student.class_name}</p>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">
            <User className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="grades">
            <GraduationCap className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Bulletins ({reportCards?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
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

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes récentes</CardTitle>
              <CardDescription>Dernières évaluations de l'étudiant</CardDescription>
            </CardHeader>
            <CardContent>
              {grades && grades.length > 0 ? (
                <div className="space-y-2">
                  {grades.slice(0, 10).map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{grade.subject}</p>
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

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulletins scolaires</CardTitle>
              <CardDescription>Historique des bulletins générés</CardDescription>
            </CardHeader>
            <CardContent>
              {reportCards && reportCards.length > 0 ? (
                <div className="space-y-2">
                  {reportCards.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {report.school_year} - {report.semester}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Classe: {report.class_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            report.status === "finalized"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.status === "finalized" ? "Finalisé" : "Brouillon"}
                        </span>
                        <Button size="sm">Ouvrir</Button>
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
