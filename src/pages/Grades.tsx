import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeEntryDialog } from "@/components/GradeEntryDialog";
import { EditGradeDialog } from "@/components/EditGradeDialog";
import { BulkGradeImport } from "@/components/BulkGradeImport";
import { NewSubjectDialog } from "@/components/NewSubjectDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAdmin } from "@/contexts/AdminContext";
import { toast } from "sonner";
import { ClipboardList, Upload, TrendingUp, FileText, AlertTriangle, Trash2, ArrowLeft, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  assessment_name: string | null;
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
  is_absent?: boolean;
};

type Assessment = {
  name: string;
  type: string;
  customLabel: string | null;
  studentsWithGrades: number;
  totalStudents: number;
};

type TeacherSubject = {
  subject_name: string;
  class_name: string;
  school_year: string;
  semester: string;
  teacher_name: string;
  school_year_fk_id: string | null;
  academic_period_id: string | null;
};

export default function Grades() {
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);
  const [newSubjectMetadata, setNewSubjectMetadata] = useState<{
    teacherName: string;
    schoolYear: string;
    semester: string;
  } | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<{
    name: string;
    type: string;
    customLabel: string | null;
  } | null>(null);
  const [studentToCompleteId, setStudentToCompleteId] = useState<string | null>(null);
  const [studentsToComplete, setStudentsToComplete] = useState<Student[]>([]);
  const [currentCompletionIndex, setCurrentCompletionIndex] = useState<number>(0);
  const [mySubjects, setMySubjects] = useState<TeacherSubject[]>([]);

  // Handle prefilled data from navigation
  useEffect(() => {
    if (location.state) {
      const { prefilledClass, prefilledSubject, prefilledSchoolYear, prefilledSemester } = location.state as any;
      if (prefilledClass) setSelectedClass(prefilledClass);
      if (prefilledSubject) setSelectedSubject(prefilledSubject);
      if (prefilledSchoolYear) setSelectedSchoolYear(prefilledSchoolYear);
      if (prefilledSemester) setSelectedSemester(prefilledSemester);
    } else {
      // Si on arrive sans state (clic sur navigation), réinitialiser tout
      setSelectedClass("");
      setSelectedSubject("");
      setSelectedSchoolYear("");
      setSelectedSemester("");
      setGrades([]);
      setNewSubjectMetadata(null);
      setAssessments([]);
    }
  }, [location.state, location.key]); // location.key change à chaque navigation
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (selectedClass && selectedSchoolYear && selectedSemester) {
      fetchSubjects();
      if (selectedSubject) {
        fetchGrades();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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
    if (!isAdmin) {
      fetchMySubjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchMySubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Trouver l'année scolaire dont la période contient la date actuelle
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      const { data: currentYear } = await supabase
        .from("school_years")
        .select("label")
        .lte("start_date", today)
        .gte("end_date", today)
        .eq("is_active", true)
        .maybeSingle();

      if (!currentYear) {
        console.warn("Aucune année scolaire active correspondant à la date actuelle");
        return;
      }

      const { data, error } = await supabase
        .from("subjects")
        .select("subject_name, class_name, school_year, semester, teacher_name, school_year_fk_id, academic_period_id")
        .eq("teacher_id", user.id)
        .eq("school_year", currentYear.label)
        .order("subject_name");

      if (error) throw error;

      setMySubjects(data as TeacherSubject[]);
    } catch (error) {
      console.error("Error fetching my subjects:", error);
    }
  };

  const handleQuickSelectSubject = (subject: TeacherSubject) => {
    setSelectedClass(subject.class_name);
    setSelectedSchoolYear(subject.school_year);
    setSelectedSemester(subject.semester);
    setSelectedSubject(subject.subject_name);
    setNewSubjectMetadata({
      teacherName: subject.teacher_name,
      schoolYear: subject.school_year,
      semester: subject.semester,
    });
  };
  
  // Real-time subscriptions for grades and subjects
  useRealtimeSubscription({
    table: "grades",
    onChange: () => {
      if (selectedClass && selectedSubject && selectedSchoolYear && selectedSemester) {
        fetchGrades();
      }
    },
  });
  
  useRealtimeSubscription({
    table: "subjects",
    onChange: () => {
      if (selectedClass && selectedSchoolYear && selectedSemester) {
        fetchSubjects();
      }
    },
  });

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
    try {
      const { data, error } = await supabase
        .from("students")
        .select("class_name")
        .order("class_name");
      
      if (error) throw error;
      
      if (data) {
        const uniqueClasses = Array.from(new Set(data.map(s => s.class_name)));
        setClasses(uniqueClasses);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error(t("grades.loadError") || "Erreur lors du chargement des classes");
    }
  };

  const fetchSubjects = async (subjectName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userEmail = user.email;

      // Récupérer les matières créées par l'enseignant OU assignées via son email
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .or(`teacher_id.eq.${user.id},teacher_email.eq.${userEmail}`)
        .eq("class_name", selectedClass)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester);
      
      if (error) throw error;
      
      if (data) {
        const uniqueSubjects = Array.from(new Set(data.map(s => s.subject_name)));
        setSubjects(uniqueSubjects);
        
        const subjectToCheck = subjectName ?? selectedSubject;
        // Vérifier si la matière sélectionnée existe dans la BDD
        const currentSubjectExists = subjectToCheck
          ? data.find(s => s.subject_name === subjectToCheck)
          : undefined;
        
        if (subjectToCheck && currentSubjectExists) {
          // Récupérer les métadonnées de la matière sélectionnée
          setNewSubjectMetadata({
            teacherName: currentSubjectExists.teacher_name,
            schoolYear: currentSubjectExists.school_year,
            semester: currentSubjectExists.semester,
          });
        } else if (subjectToCheck && !currentSubjectExists) {
          // La matière sélectionnée n'existe pas, réinitialiser
          setSelectedSubject("");
          setNewSubjectMetadata(null);
          setGrades([]);
          toast.warning("La matière sélectionnée n'existe pas pour cette combinaison classe/année/semestre");
        } else {
          setNewSubjectMetadata(null);
        }
      } else {
        setSubjects([]);
        setSelectedSubject("");
        setNewSubjectMetadata(null);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Erreur lors du chargement des matières");
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, photo_url, class_name")
        .eq("class_name", selectedClass)
        .order("last_name");

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let gradesQuery = supabase
        .from("grades")
        .select("*")
        .eq("class_name", selectedClass)
        .eq("subject", selectedSubject)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester);

      if (!isAdmin) {
        gradesQuery = gradesQuery.eq("teacher_id", user.id);
      }

      const { data, error } = await gradesQuery;

      if (error) throw error;

      setGrades(data || []);
      calculateAssessments(data || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Erreur lors du chargement des notes");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAssessments = (allGrades: Grade[]) => {
    const assessmentMap = new Map<string, Assessment>();
    
    allGrades.forEach(grade => {
      // Générer une clé unique pour l'épreuve
      const key = grade.assessment_name || 
                  (grade.assessment_type === "autre" 
                    ? `${grade.assessment_type}_${grade.assessment_custom_label}`
                    : grade.assessment_type);
      
      if (!assessmentMap.has(key)) {
        assessmentMap.set(key, {
          name: grade.assessment_name || 
                (grade.assessment_type === "autre" 
                  ? grade.assessment_custom_label || grade.assessment_type
                  : grade.assessment_type.replace(/_/g, ' ')),
          type: grade.assessment_type,
          customLabel: grade.assessment_custom_label,
          studentsWithGrades: 0,
          totalStudents: students.length,
        });
      }
    });
    
    // Compter les étudiants qui ont une note (présents ou absents) pour chaque épreuve
    assessmentMap.forEach((assessment, key) => {
      const studentsWithThisGrade = new Set(
        allGrades
          .filter(g => {
            const gradeKey = g.assessment_name || 
                           (g.assessment_type === "autre" 
                             ? `${g.assessment_type}_${g.assessment_custom_label}`
                             : g.assessment_type);
            return gradeKey === key;
          })
          .map(g => g.student_id)
      ).size;
      
      assessment.studentsWithGrades = studentsWithThisGrade;
    });
    
    setAssessments(Array.from(assessmentMap.values()));
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.student_id === studentId);
  };

  const calculateWeightedAverage = (studentGrades: Grade[]) => {
    if (studentGrades.length === 0) return null;
    
    let totalWeightedScore = 0;
    let totalWeighting = 0;
    
    studentGrades.forEach(grade => {
      // Les absents comptent 0 pour la moyenne de l'étudiant
      const normalizedGrade = (grade.grade / grade.max_grade) * 20;
      totalWeightedScore += normalizedGrade * grade.weighting;
      totalWeighting += grade.weighting;
    });
    
    return totalWeighting > 0 ? (totalWeightedScore / totalWeighting).toFixed(2) : null;
  };

  // Calculate class statistics
  const getClassStatistics = () => {
    if (students.length === 0 || grades.length === 0) {
      return {
        classAverage: null,
        totalAssessments: 0,
        missingGradesCount: 0,
        studentsWithMissingGrades: [],
      };
    }

    // Get unique assessments using the same logic as calculateAssessments
    const assessments = new Map();
    grades.forEach(grade => {
      const key = grade.assessment_name || 
                  (grade.assessment_type === "autre" 
                    ? `${grade.assessment_type}_${grade.assessment_custom_label}`
                    : grade.assessment_type);
      
      if (!assessments.has(key)) {
        assessments.set(key, {
          name: grade.assessment_name || 
                (grade.assessment_type === "autre" 
                  ? grade.assessment_custom_label || grade.assessment_type
                  : grade.assessment_type.replace(/_/g, ' ')),
          type: grade.assessment_type,
          label: grade.assessment_custom_label,
        });
      }
    });

    const totalAssessments = assessments.size;

    // Calculate class average (excluding absents from class average)
    let totalAverage = 0;
    let studentsWithGrades = 0;
    
    students.forEach(student => {
      const studentGrades = getStudentGrades(student.id);
      // Filter out absent grades for class average calculation
      const presentGrades = studentGrades.filter(g => !g.is_absent);
      if (presentGrades.length > 0) {
        const average = calculateWeightedAverage(presentGrades);
        if (average) {
          totalAverage += parseFloat(average);
          studentsWithGrades++;
        }
      }
    });

    const classAverage = studentsWithGrades > 0 
      ? (totalAverage / studentsWithGrades).toFixed(2)
      : null;

    // Calculate total missing grades (absents are not missing) and find students with missing grades
    let missingGradesCount = 0;
    const studentsWithMissingGrades: string[] = [];
    
    students.forEach(student => {
      const studentGrades = getStudentGrades(student.id);
      const missingCount = totalAssessments - studentGrades.length;
      if (missingCount > 0) {
        missingGradesCount += missingCount;
        studentsWithMissingGrades.push(`${student.first_name} ${student.last_name}`);
      }
    });

    return {
      classAverage,
      totalAssessments,
      missingGradesCount,
      studentsWithMissingGrades,
    };
  };

  const stats = getClassStatistics();

  const handleSubjectCreated = async (
    subject: string, 
    teacherName: string, 
    schoolYear: string, 
    semester: string,
    schoolYearId?: string,
    academicPeriodId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the teacher_id from the teacher's email or user_id
      // For admins, we get the selected teacher from the dialog
      // For teachers, we use the current user's ID
      let teacherId = user.id;
      let teacherEmail = user.email;
      let teacherFkId = null;

      if (isAdmin) {
        // Find teacher by name to get their user_id
        const { data: teacher } = await supabase
          .from('teachers')
          .select('user_id, full_name')
          .eq('full_name', teacherName)
          .maybeSingle();

        if (teacher) {
          teacherId = teacher.user_id;
          teacherFkId = teacher.user_id;
          
          // Get email from teacher_profiles
          const { data: profile } = await supabase
            .from('teacher_profiles')
            .select('email')
            .eq('user_id', teacher.user_id)
            .maybeSingle();
          
          teacherEmail = profile?.email;
        }
      } else {
        // For non-admin users, get their teacher record
        const { data: teacher } = await supabase
          .from('teachers')
          .select('user_id, full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacher) {
          teacherFkId = teacher.user_id;
          
          // Get email from teacher_profiles
          const { data: profile } = await supabase
            .from('teacher_profiles')
            .select('email')
            .eq('user_id', teacher.user_id)
            .maybeSingle();
          
          teacherEmail = profile?.email;
        }
      }

      // Save the subject to the subjects table avec les FK normalisées
      const { error } = await supabase.from("subjects").insert({
        teacher_id: teacherId,
        teacher_email: teacherEmail,
        teacher_fk_id: teacherFkId,
        class_name: selectedClass,
        subject_name: subject,
        teacher_name: teacherName,
        school_year: schoolYear,
        semester: semester,
        // FK normalisées
        school_year_fk_id: schoolYearId,
        academic_period_id: academicPeriodId,
      });

      if (error) throw error;

      setSelectedSubject(subject);
      setNewSubjectMetadata({ teacherName, schoolYear, semester });
      setShowNewSubjectDialog(false);
      
      // Ajouter la nouvelle matière à la liste
      setSubjects(prev => [...prev, subject]);
      
      toast.success("Matière créée avec succès");
    } catch (error: any) {
      console.error("Error creating subject:", error);
      toast.error("Erreur lors de la création de la matière");
    }
  };

  const handleGradeUpdated = () => {
    fetchGrades();
    fetchSubjects();
  };

  const handleDeleteSubject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all grades for this subject
      const { error: gradesError } = await supabase
        .from("grades")
        .delete()
        .eq("teacher_id", user.id)
        .eq("class_name", selectedClass)
        .eq("subject", selectedSubject)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester);

      if (gradesError) throw gradesError;

      // Delete the subject
      const { error: subjectError } = await supabase
        .from("subjects")
        .delete()
        .eq("teacher_id", user.id)
        .eq("class_name", selectedClass)
        .eq("subject_name", selectedSubject)
        .eq("school_year", selectedSchoolYear)
        .eq("semester", selectedSemester);

      if (subjectError) throw subjectError;

      toast.success("Matière supprimée avec succès");
      
      // Reset selection
      setSelectedSubject("");
      setNewSubjectMetadata(null);
      setGrades([]);
      
      // Refresh subjects list
      fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Erreur lors de la suppression de la matière");
    }
  };

  const handleDeleteAssessment = async (assessment: Assessment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Identifier toutes les notes de cette épreuve
      const gradesToDelete = grades.filter(g => {
        const gradeKey = g.assessment_name || 
                        (g.assessment_type === "autre" 
                          ? `${g.assessment_type}_${g.assessment_custom_label}`
                          : g.assessment_type);
        const assessmentKey = assessment.name === (assessment.type === "autre" 
          ? assessment.customLabel 
          : assessment.type.replace(/_/g, ' '))
          ? (assessment.type === "autre" 
              ? `${assessment.type}_${assessment.customLabel}`
              : assessment.type)
          : assessment.name;
        
        return gradeKey === assessmentKey || g.assessment_name === assessment.name;
      });

      if (gradesToDelete.length === 0) {
        toast.error("Aucune note à supprimer");
        return;
      }

      // Supprimer toutes les notes de cette épreuve
      const { error } = await supabase
        .from("grades")
        .delete()
        .in('id', gradesToDelete.map(g => g.id));

      if (error) throw error;

      toast.success(`Épreuve "${assessment.name}" supprimée avec ${gradesToDelete.length} note(s)`);
      fetchGrades();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast.error("Erreur lors de la suppression de l'épreuve");
    }
  };

  const handleResetSelection = () => {
    setSelectedSubject("");
    setGrades([]);
  };

  const handleNavigateToSubject = (direction: 'prev' | 'next') => {
    const currentIndex = subjects.indexOf(selectedSubject);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < subjects.length) {
      setSelectedSubject(subjects[newIndex]);
    }
  };

  const currentSubjectIndex = subjects.indexOf(selectedSubject);
  const hasPrevSubject = currentSubjectIndex > 0;
  const hasNextSubject = currentSubjectIndex >= 0 && currentSubjectIndex < subjects.length - 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("grades.title")}</h1>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => navigate('/bulletins')}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Générer des bulletins
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedSubject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSelection}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la sélection
            </Button>
          )}
        </div>
        {selectedSubject && subjects.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToSubject('prev')}
              disabled={!hasPrevSubject}
            >
              <ChevronLeft className="w-4 h-4" />
              Matière précédente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToSubject('next')}
              disabled={!hasNextSubject}
            >
              Matière suivante
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Section Mes Matières - uniquement pour les enseignants */}
      {!isAdmin && mySubjects.length > 0 && !selectedSubject && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Mes Matières (année en cours)
            </CardTitle>
            <CardDescription>
              Cliquez directement sur une matière pour accéder rapidement à vos notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mySubjects.map((subject, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/10"
                  onClick={() => handleQuickSelectSubject(subject)}
                >
                  <span className="font-semibold text-base">{subject.subject_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {subject.class_name} • {subject.semester}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section filtres */}
      {!selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {!isAdmin && mySubjects.length > 0 
                ? "Ou rechercher par filtres" 
                : "Rechercher une matière"}
            </CardTitle>
            <CardDescription>
              {!isAdmin && mySubjects.length > 0 
                ? "Sélectionnez année, semestre, classe et matière pour accéder aux notes d'autres années"
                : "Sélectionnez année, semestre, classe et matière"}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <div className="space-y-2">
                  <Select 
                    value={selectedSubject} 
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setShowNewSubjectDialog(true);
                      } else {
                        setSelectedSubject(value);
                        fetchSubjects(value);
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
                  
                  {selectedClass && selectedSchoolYear && selectedSemester && subjects.length > 0 && !selectedSubject && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground">Suggestions :</span>
                      {subjects.slice(0, 5).map((subject) => (
                        <Button
                          key={subject}
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            setSelectedSubject(subject);
                            fetchSubjects(subject);
                          }}
                        >
                          {subject}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedSubject && selectedSubject !== "__new__" && selectedSchoolYear && selectedSemester && (
          <>
            {newSubjectMetadata && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{t("grades.subjectInfo")}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t("grades.teacher")}:</span>
                          <p className="font-medium">{newSubjectMetadata.teacherName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("grades.schoolYear")}:</span>
                          <p className="font-medium">{newSubjectMetadata.schoolYear}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("grades.semester")}:</span>
                          <p className="font-medium">{newSubjectMetadata.semester}</p>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la matière</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la matière "{selectedSubject}" ? 
                            Toutes les notes associées seront également supprimées. Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteSubject} className="bg-destructive hover:bg-destructive/90">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bouton pour créer une nouvelle épreuve */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowBulkImport(true)}
                variant="default"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Nouvelle épreuve
              </Button>
            </div>

            {/* Class Statistics Dashboard */}
            {grades.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Moyenne de classe</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.classAverage ? `${stats.classAverage}/20` : "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre d'épreuves</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.totalAssessments}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Notes manquantes</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.missingGradesCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Liste des épreuves existantes */}
            {assessments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Épreuves de cette matière</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assessments.map((assessment, index) => (
                      <div 
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const sel = {
                            name: assessment.name,
                            type: assessment.type,
                            customLabel: assessment.customLabel || null,
                          };
                          // Trouver le premier  e9l e8ve sans note pour cette  e9preuve
                          const missing = students.filter((st) => {
                            const sg = grades.filter((g) => g.student_id === st.id);
                            return !sg.some((g) => {
                              const gradeKey = g.assessment_name || (g.assessment_type === "autre" ? `${g.assessment_type}_${g.assessment_custom_label}` : g.assessment_type);
                              const assessmentKey = sel.name || (sel.type === "autre" ? `${sel.type}_${sel.customLabel || ""}` : sel.type);
                              return gradeKey === assessmentKey || g.assessment_name === sel.name;
                            });
                          });
                          if (missing.length === 0) {
                            toast.info("Toutes les notes sont d e9j e0 saisies pour cette  e9preuve");
                            return;
                          }
                          setSelectedAssessment(sel);
                          setStudentToCompleteId(missing[0].id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            const sel = {
                              name: assessment.name,
                              type: assessment.type,
                              customLabel: assessment.customLabel || null,
                            };
                            const missing = students.filter((st) => {
                              const sg = grades.filter((g) => g.student_id === st.id);
                              return !sg.some((g) => {
                                const gradeKey = g.assessment_name || (g.assessment_type === "autre" ? `${g.assessment_type}_${g.assessment_custom_label}` : g.assessment_type);
                                const assessmentKey = sel.name || (sel.type === "autre" ? `${sel.type}_${sel.customLabel || ""}` : sel.type);
                                return gradeKey === assessmentKey || g.assessment_name === sel.name;
                              });
                            });
                            if (missing.length === 0) {
                              toast.info("Toutes les notes sont d e9j e0 saisies pour cette  e9preuve");
                              return;
                            }
                            setSelectedAssessment(sel);
                            setStudentToCompleteId(missing[0].id);
                          }
                        }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{assessment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assessment.studentsWithGrades}/{assessment.totalStudents} étudiants notés
                          </p>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {assessment.studentsWithGrades < assessment.totalStudents && (
                            <Button
                              size="sm"
                              variant="outline"
                         onClick={() => {
                                const sel = {
                                  name: assessment.name,
                                  type: assessment.type,
                                  customLabel: assessment.customLabel || null,
                                };
                                // Trouver tous les élèves sans note (hors absents) pour cette épreuve
                                const missing = students.filter((st) => {
                                  const sg = grades.filter((g) => g.student_id === st.id);
                                  return !sg.some((g) => {
                                    const gradeKey = g.assessment_name || (g.assessment_type === "autre" ? `${g.assessment_type}_${g.assessment_custom_label}` : g.assessment_type);
                                    const assessmentKey = sel.name || (sel.type === "autre" ? `${sel.type}_${sel.customLabel || ""}` : sel.type);
                                    return gradeKey === assessmentKey || g.assessment_name === sel.name;
                                  });
                                });
                                if (missing.length === 0) {
                                  toast.info("Toutes les notes sont déjà saisies pour cette épreuve");
                                  return;
                                }
                                setSelectedAssessment(sel);
                                setStudentsToComplete(missing);
                                setCurrentCompletionIndex(0);
                                setStudentToCompleteId(missing[0].id);
                              }}
                              className="gap-2"
                            >
                              <PlusCircle className="w-4 h-4" />
                              Compléter
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'épreuve</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer l'épreuve "{assessment.name}" ? 
                                  Toutes les notes associées ({assessment.studentsWithGrades} note(s)) seront supprimées. 
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteAssessment(assessment)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alert for missing grades */}
            {stats.studentsWithMissingGrades.length > 0 && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription>
                  <span className="font-medium">Notes manquantes pour :</span>{" "}
                  {stats.studentsWithMissingGrades.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Chargement...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => {
                const studentGrades = getStudentGrades(student.id);
                const average = calculateWeightedAverage(studentGrades);
                return (
                  <Card key={student.id} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <div className="relative w-full h-32 bg-gradient-to-br from-primary/10 to-accent/10">
                        {student.photo_url ? (
                          <OptimizedImage
                            src={student.photo_url}
                            alt={`${student.first_name} ${student.last_name}`}
                            width={400}
                            height={128}
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
                                    {grade.assessment_name || (grade.assessment_type === "autre" 
                                      ? grade.assessment_custom_label 
                                      : grade.assessment_type.replace(/_/g, ' '))}
                                    {grade.is_absent && <span className="ml-1 text-amber-500">(Absent)</span>}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{grade.is_absent ? "ABS" : `${grade.grade}/${grade.max_grade}`}</span>
                                    <EditGradeDialog grade={grade} onGradeUpdated={handleGradeUpdated} />
                                  </div>
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
                        preselectedAssessment={selectedAssessment}
                        openExternal={student.id === studentToCompleteId}
                        studentsToComplete={studentsToComplete.length > 0 ? studentsToComplete : undefined}
                        currentStudentIndex={studentsToComplete.length > 0 ? currentCompletionIndex : undefined}
                        onNavigateStudent={(direction) => {
                          if (direction === 'next' && currentCompletionIndex < studentsToComplete.length - 1) {
                            const newIndex = currentCompletionIndex + 1;
                            setCurrentCompletionIndex(newIndex);
                            setStudentToCompleteId(studentsToComplete[newIndex].id);
                          } else if (direction === 'prev' && currentCompletionIndex > 0) {
                            const newIndex = currentCompletionIndex - 1;
                            setCurrentCompletionIndex(newIndex);
                            setStudentToCompleteId(studentsToComplete[newIndex].id);
                          }
                        }}
                        onAssessmentDeselected={() => {
                          setSelectedAssessment(null);
                          setStudentToCompleteId(null);
                          setStudentsToComplete([]);
                          setCurrentCompletionIndex(0);
                        }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
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
          className={selectedClass}
        />
    </div>
  );
}
