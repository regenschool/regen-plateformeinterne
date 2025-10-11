import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeEntryDialog } from "@/components/GradeEntryDialog";
import { BulkGradeImport } from "@/components/BulkGradeImport";
import { NewSubjectDialog } from "@/components/NewSubjectDialog";
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
  teacher_name: string | null;
  school_year: string | null;
  semester: string | null;
};

export default function Grades() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);
  const [newSubjectMetadata, setNewSubjectMetadata] = useState<{
    teacherName: string;
    schoolYear: string;
    semester: string;
  } | null>(null);

  const currentYear = new Date().getFullYear();
  const schoolYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];
  
  const semesters = [
    { value: "Semestre 1", label: t("grades.semester1") },
    { value: "Semestre 2", label: t("grades.semester2") },
    { value: "Année complète", label: t("grades.fullYear") },
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSchoolYear && selectedSemester) {
      fetchSubjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSchoolYear, selectedSemester]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedSchoolYear && selectedSemester) {
      fetchGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, selectedSchoolYear, selectedSemester]);

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
      .select("subject, teacher_name, school_year, semester")
      .eq("teacher_id", user.id)
      .eq("class_name", selectedClass)
      .eq("school_year", selectedSchoolYear)
      .eq("semester", selectedSemester);
    
    if (data) {
      const uniqueSubjects = Array.from(new Set(data.map(g => g.subject)));
      setSubjects(uniqueSubjects);
      
      // Récupérer les métadonnées de la première matière si elle existe
      if (data.length > 0 && data[0].teacher_name) {
        setNewSubjectMetadata({
          teacherName: data[0].teacher_name,
          schoolYear: data[0].school_year || selectedSchoolYear,
          semester: data[0].semester || selectedSemester,
        });
      }
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
      .eq("subject", selectedSubject)
      .eq("school_year", selectedSchoolYear)
      .eq("semester", selectedSemester);

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

  const handleSubjectCreated = (subject: string, teacherName: string, schoolYear: string, semester: string) => {
    setSelectedSubject(subject);
    setNewSubjectMetadata({ teacherName, schoolYear, semester });
    setShowNewSubjectDialog(false);
    
    // Ajouter la nouvelle matière à la liste
    setSubjects(prev => [...prev, subject]);
  };

  const handleGradeUpdated = () => {
    fetchGrades();
    fetchSubjects();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("grades.title")}</h1>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("grades.schoolYear")}</label>
            <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSchoolYear")} />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("grades.semester")}</label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSemester")} />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem.value} value={sem.value}>
                    {sem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("grades.class")}</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectClass")} />
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
            <label className="text-sm font-medium mb-2 block">{t("grades.subject")}</label>
            <Select 
              value={selectedSubject} 
              onValueChange={(value) => {
                if (value === "__new__") {
                  // Ne pas changer selectedSubject, garder la valeur actuelle
                  setShowNewSubjectDialog(true);
                } else {
                  setSelectedSubject(value);
                  // Charger les métadonnées de la matière si elle existe déjà
                  fetchSubjects();
                }
              }}
              disabled={!selectedClass || !selectedSchoolYear || !selectedSemester}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSubject")} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">{t("grades.newSubject")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClass && selectedSubject && selectedSubject !== "__new__" && selectedSchoolYear && selectedSemester && (
          <>
            <div className="flex gap-2">
              <Button onClick={() => setShowBulkImport(true)} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {t("grades.bulkImport")}
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
                              <span className="text-sm font-medium">{t("grades.generalAverage")}:</span>
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
                        <p className="text-sm text-muted-foreground">{t("grades.noGradeEntered")}</p>
                      )}

                      <GradeEntryDialog
                        student={student}
                        subject={selectedSubject}
                        subjectMetadata={newSubjectMetadata}
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
            subjectMetadata={newSubjectMetadata}
            onClose={() => setShowBulkImport(false)}
            onImportComplete={handleGradeUpdated}
          />
        )}

        <NewSubjectDialog
          open={showNewSubjectDialog}
          onClose={() => setShowNewSubjectDialog(false)}
          onSubjectCreated={handleSubjectCreated}
          defaultSchoolYear={selectedSchoolYear}
          defaultSemester={selectedSemester}
        />
      </div>
  );
}
