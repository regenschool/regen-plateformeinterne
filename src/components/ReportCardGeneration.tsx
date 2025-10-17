import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Save, Download, Settings2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type SubjectWeight = {
  id?: string;
  subject_id: string;
  subject_name: string;
  weight: number;
  school_year: string;
  semester: string;
  class_name: string;
};

export const ReportCardGeneration = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; subject_name: string }[]>([]);
  const [subjectWeights, setSubjectWeights] = useState<SubjectWeight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const schoolYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];

  const semesters = [
    { value: "Semestre 1", label: "Semestre 1" },
    { value: "Semestre 2", label: "Semestre 2" },
    { value: "Année complète", label: "Année complète" },
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSchoolYear && selectedSemester) {
      fetchSubjects();
      fetchSubjectWeights();
    }
  }, [selectedClass, selectedSchoolYear, selectedSemester]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setClasses(data?.map(c => c.name) || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Erreur lors du chargement des classes");
    }
  };

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("id, subject_name")
        .eq("class_name", selectedClass)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester)
        .order("subject_name");

      if (error) throw error;

      // Dédupliquer par subject_name
      const uniqueSubjects = data?.reduce((acc, current) => {
        const exists = acc.find(item => item.subject_name === current.subject_name);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as typeof data) || [];

      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Erreur lors du chargement des matières");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjectWeights = async () => {
    try {
      const { data, error } = await supabase
        .from("subject_weights")
        .select("*")
        .eq("class_name", selectedClass)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester);

      if (error) throw error;

      if (data && data.length > 0) {
        setSubjectWeights(
          data.map(sw => ({
            id: sw.id,
            subject_id: sw.subject_id,
            subject_name: subjects.find(s => s.id === sw.subject_id)?.subject_name || "",
            weight: Number(sw.weight),
            school_year: sw.school_year,
            semester: sw.semester,
            class_name: sw.class_name,
          }))
        );
      } else {
        // Initialiser avec les matières existantes, poids par défaut à 1
        const initialWeights = subjects.map(subject => ({
          subject_id: subject.id,
          subject_name: subject.subject_name,
          weight: 1,
          school_year: selectedSchoolYear,
          semester: selectedSemester,
          class_name: selectedClass,
        }));
        setSubjectWeights(initialWeights);
      }
    } catch (error) {
      console.error("Error fetching subject weights:", error);
      toast.error("Erreur lors du chargement des pondérations");
    }
  };

  const handleWeightChange = (subjectId: string, newWeight: string) => {
    const weight = parseFloat(newWeight) || 0;
    setSubjectWeights(prev =>
      prev.map(sw =>
        sw.subject_id === subjectId ? { ...sw, weight } : sw
      )
    );
  };

  const handleSaveWeights = async () => {
    try {
      setIsSaving(true);

      // Supprimer les anciennes pondérations
      await supabase
        .from("subject_weights")
        .delete()
        .eq("class_name", selectedClass)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester);

      // Insérer les nouvelles pondérations
      const { error } = await supabase.from("subject_weights").insert(
        subjectWeights.map(sw => ({
          subject_id: sw.subject_id,
          weight: sw.weight,
          school_year: sw.school_year,
          semester: sw.semester,
          class_name: sw.class_name,
        }))
      );

      if (error) throw error;

      toast.success("Pondérations enregistrées avec succès");
      fetchSubjectWeights();
    } catch (error) {
      console.error("Error saving weights:", error);
      toast.error("Erreur lors de l'enregistrement des pondérations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReportCards = async () => {
    try {
      setIsLoading(true);

      // Vérifier que toutes les pondérations sont définies
      const totalWeight = subjectWeights.reduce((sum, sw) => sum + sw.weight, 0);
      if (totalWeight === 0) {
        toast.error("Vous devez définir au moins une pondération");
        return;
      }

      // TODO: Implémenter la génération des bulletins
      toast.info("Génération des bulletins en cours...");
      
      // Logique de génération à implémenter
      
    } catch (error) {
      console.error("Error generating report cards:", error);
      toast.error("Erreur lors de la génération des bulletins");
    } finally {
      setIsLoading(false);
    }
  };

  const totalWeight = subjectWeights.reduce((sum, sw) => sum + sw.weight, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-primary" />
            Génération des Bulletins
          </CardTitle>
          <CardDescription>
            Configurez les pondérations des matières et générez les bulletins pour une classe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection classe, année, semestre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Année scolaire</Label>
              <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Semestre</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le semestre" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map(sem => (
                    <SelectItem key={sem.value} value={sem.value}>
                      {sem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(className => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClass && selectedSchoolYear && selectedSemester && (
            <>
              <Separator />

              {/* Configuration des pondérations */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Chargement des matières...</p>
                  </div>
                </div>
              ) : subjects.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Aucune matière trouvée pour cette combinaison classe/année/semestre.
                    Veuillez d'abord créer des matières dans la page Notes.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Settings2 className="w-5 h-5" />
                          Pondérations des matières
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Définissez le coefficient de chaque matière dans le bulletin
                        </p>
                      </div>
                      <div className="text-sm font-medium bg-primary/10 px-3 py-1 rounded-lg">
                        Total: {totalWeight.toFixed(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subjectWeights.map(sw => (
                        <div
                          key={sw.subject_id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{sw.subject_name}</p>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              value={sw.weight}
                              onChange={e => handleWeightChange(sw.subject_id, e.target.value)}
                              className="text-center"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveWeights}
                      disabled={isSaving || subjectWeights.length === 0}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? "Enregistrement..." : "Enregistrer les pondérations"}
                    </Button>

                    <Button
                      onClick={handleGenerateReportCards}
                      disabled={isLoading || totalWeight === 0}
                      variant="default"
                      className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Download className="w-4 h-4" />
                      Générer les bulletins
                    </Button>
                  </div>

                  {totalWeight === 0 && (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertDescription>
                        Définissez au moins une pondération pour pouvoir générer les bulletins
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
