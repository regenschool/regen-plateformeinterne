import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeEntryDialog } from "@/components/GradeEntryDialog";
import { BulkGradeImport } from "@/components/BulkGradeImport";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { ClipboardList, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  class_name: string;
};

type Grade = {
  id: string;
  student_id: string;
  subject: string;
  assessment_type: string;
  assessment_custom_label: string | null;
  grade: number;
  max_grade: number;
  weighting: number;
  appreciation: string | null;
  created_at: string;
};

export default function Grades() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("students")
      .select("class_name")
      .order("class_name");
    
    if (data) {
      const uniqueClasses = Array.from(new Set(data.map(s => s.class_name)));
      setClasses(uniqueClasses);
    }
  };

  const fetchSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("grades")
      .select("subject")
      .eq("teacher_id", user.id);
    
    if (data) {
      const uniqueSubjects = Array.from(new Set(data.map(g => g.subject)));
      setSubjects(uniqueSubjects);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, photo_url, class_name")
      .eq("class_name", selectedClass)
      .order("last_name");

    if (error) {
      toast.error("Erreur lors du chargement des étudiants");
      return;
    }

    setStudents(data || []);
  };

  const fetchGrades = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("teacher_id", user.id)
      .eq("class_name", selectedClass)
      .eq("subject", selectedSubject);

    if (error) {
      toast.error("Erreur lors du chargement des notes");
      return;
    }

    setGrades(data || []);
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.student_id === studentId);
  };

  const calculateWeightedAverage = (studentGrades: Grade[]) => {
    if (studentGrades.length === 0) return null;
    
    let totalWeightedScore = 0;
    let totalWeighting = 0;
    
    studentGrades.forEach(grade => {
      const normalizedGrade = (grade.grade / grade.max_grade) * 20;
      totalWeightedScore += normalizedGrade * grade.weighting;
      totalWeighting += grade.weighting;
    });
    
    return totalWeighting > 0 ? (totalWeightedScore / totalWeighting).toFixed(2) : null;
  };

  const handleGradeUpdated = () => {
    fetchGrades();
    fetchSubjects();
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Gestion des notes</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Classe</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Matière</label>
            {selectedSubject === "__new__" ? (
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Nom de la nouvelle matière"
                />
                <Button 
                  onClick={() => {
                    if (newSubject.trim()) {
                      setSelectedSubject(newSubject.trim());
                      setNewSubject("");
                    } else {
                      toast.error("Veuillez saisir un nom de matière");
                    }
                  }}
                >
                  Valider
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedSubject("");
                    setNewSubject("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Nouvelle matière</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {selectedClass && selectedSubject && selectedSubject !== "__new__" && (
          <>
            <div className="flex gap-2">
              <Button onClick={() => setShowBulkImport(true)} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import en masse
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => {
                const studentGrades = getStudentGrades(student.id);
                const average = calculateWeightedAverage(studentGrades);
                return (
                  <Card key={student.id} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <div className="relative w-full h-32 bg-gradient-to-br from-primary/10 to-accent/10">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={`${student.first_name} ${student.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-3xl font-bold text-primary/30">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-foreground">
                          {student.first_name} {student.last_name}
                        </h3>
                      </div>

                      {studentGrades.length > 0 ? (
                        <div className="space-y-3">
                          <div className="bg-primary/5 p-2 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Moyenne générale:</span>
                              <span className="font-bold text-lg text-primary">{average}/20</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {studentGrades.map((grade) => (
                              <div key={grade.id} className="border border-border rounded p-2 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">
                                    {grade.assessment_type === "autre" 
                                      ? grade.assessment_custom_label 
                                      : grade.assessment_type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm font-bold">{grade.grade}/{grade.max_grade}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Coef: {grade.weighting}
                                </div>
                                {grade.appreciation && (
                                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                                    {grade.appreciation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune note saisie</p>
                      )}

                      <GradeEntryDialog
                        student={student}
                        subject={selectedSubject}
                        onGradeUpdated={handleGradeUpdated}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}


        {showBulkImport && selectedClass && selectedSubject && (
          <BulkGradeImport
            students={students}
            classname={selectedClass}
            subject={selectedSubject}
            onClose={() => setShowBulkImport(false)}
            onImportComplete={handleGradeUpdated}
          />
        )}
      </div>
    </Layout>
  );
}
