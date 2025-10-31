import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeEntryDialog } from "@/components/GradeEntryDialog";
import { EditGradeDialog } from "@/components/EditGradeDialog";
import { EditAssessmentDialog } from "@/components/EditAssessmentDialog";
import { BulkGradeImport } from "@/components/BulkGradeImport";
import { NewSubjectDialog } from "@/components/NewSubjectDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useRealtimeGrades } from "@/hooks/useRealtimeGrades";
import { useAdmin } from "@/contexts/AdminContext";
import { useGradesNormalized } from "@/hooks/useGradesNormalized";
import { toast } from "sonner";
import { ClipboardList, Upload, TrendingUp, FileText, AlertTriangle, Trash2, ArrowLeft, ChevronLeft, ChevronRight, PlusCircle, BookOpen, Eye, EyeOff } from "lucide-react";
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

// Utiliser directement le type GradeNormalized
import type { GradeNormalized } from "@/hooks/useGradesNormalized";

type Grade = GradeNormalized;

type Assessment = {
  name: string;
  type: string;
  customLabel: string | null;
  studentsWithGrades: number;
  totalStudents: number;
};

type TeacherSubject = {
  id: string;
  subject_name: string;
  class_name: string;
  school_year: string;
  semester: string;
  teacher_name: string;
  school_year_fk_id: string | null;
  academic_period_id: string | null;
};

// Composant pour gérer la publication/dépublication d'une épreuve
const PublishAssessmentButton = ({ 
  assessmentName,
  assessmentType,
  assessmentCustomLabel,
  subjectId,
  subjectName,
  className,
  schoolYear,
  semester,
  teacherName,
  studentsWithGrades,
  totalStudents,
  isComplete,
}: {
  assessmentName: string;
  assessmentType: string;
  assessmentCustomLabel: string | null;
  subjectId: string | null;
  subjectName: string;
  className: string;
  schoolYear: string;
  semester: string;
  teacherName: string;
  studentsWithGrades: number;
  totalStudents: number;
  isComplete: boolean;
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Utiliser TanStack Query pour récupérer les données de l'épreuve
  const { data: assessmentData } = useQuery({
    queryKey: ['assessment-visibility', subjectId, assessmentName, subjectName, className, schoolYear, semester],
    queryFn: async () => {
      if (!subjectId) return null;
      
      // Essayer d'abord avec subject_id
      let { data, error } = await supabase
        .from('assessments')
        .select('id, is_visible_to_students')
        .eq('assessment_name', assessmentName)
        .eq('subject_id', subjectId)
        .maybeSingle();
      
      // Si pas trouvé avec subject_id, chercher avec les champs dénormalisés (épreuves historiques)
      if (!data && !error) {
        const result = await supabase
          .from('assessments')
          .select('id, is_visible_to_students')
          .eq('assessment_name', assessmentName)
          .eq('subject', subjectName)
          .eq('class_name', className)
          .eq('school_year', schoolYear)
          .eq('semester', semester)
          .is('subject_id', null)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!subjectId,
  });

  const handleToggleVisibility = async () => {
    if (!subjectId) return;
    
    // ✅ Empêcher la publication si l'épreuve n'est pas complète
    if (!isComplete && !assessmentData?.is_visible_to_students) {
      toast.error("❌ Impossible de publier : l'épreuve n'est pas complète");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      if (!assessmentData) {
        // Aucune ligne d'épreuve existante: on la crée et on publie directement
        const insertPayload: any = {
          assessment_name: assessmentName,
          assessment_type: assessmentType,
          assessment_custom_label: assessmentCustomLabel,
          subject_id: subjectId,
          subject: subjectName,
          class_name: className,
          school_year: schoolYear,
          semester,
          teacher_id: user.id,
          teacher_name: teacherName || null,
          total_students: totalStudents,
          graded_students: studentsWithGrades,
          is_complete: studentsWithGrades >= totalStudents,
          weighting: 1,
          max_grade: 20,
          is_visible_to_students: true, // publication initiale
          visibility_changed_at: new Date().toISOString(),
          visibility_changed_by: user.id,
        };
        const { error: insertError } = await supabase
          .from('assessments')
          .insert(insertPayload);
        if (insertError) throw insertError;
      } else {
        // Ligne existante: toggle visibilité
        const newVisibility = !assessmentData.is_visible_to_students;
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            is_visible_to_students: newVisibility,
            visibility_changed_at: new Date().toISOString(),
            visibility_changed_by: user.id,
          })
          .eq('id', assessmentData.id);
        if (updateError) throw updateError;
      }

      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['assessment-visibility'] });
      queryClient.invalidateQueries({ queryKey: ['grades-normalized'] });

      const nowVisible = assessmentData ? !assessmentData.is_visible_to_students : true;
      toast.success(
        nowVisible ? `✅ Notes visibles pour les étudiants` : `🔒 Notes masquées aux étudiants`
      );
    } catch (error: any) {
      toast.error('Erreur : ' + (error?.message || 'Action impossible'));
    } finally {
      setIsLoading(false);
    }
  };

  // N'afficher le bouton que si l'épreuve est complète ou déjà publiée
  const isVisible = assessmentData?.is_visible_to_students || false;
  if (!isComplete && !isVisible) return null;

  return (
    <Button
      size="sm"
      variant={isVisible ? 'default' : 'outline'}
      onClick={handleToggleVisibility}
      disabled={isLoading}
      className="gap-2"
      title={isVisible ? 'Masquer aux étudiants' : 'Rendre visible aux étudiants'}
    >
      {isVisible ? (
        <>
          <EyeOff className="w-4 h-4" />
          Dépublier
        </>
      ) : (
        <>
          <Eye className="w-4 h-4" />
          Publier
        </>
      )}
    </Button>
  );
};

export default function Grades() {
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
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
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Utiliser le hook normalisé pour récupérer les notes
  const { data: gradesData = [], isLoading: gradesLoading } = useGradesNormalized({
    subject_id: selectedSubjectId || undefined,
  });

  // Real-time subscription pour les notes via subject_id
  useRealtimeGrades(selectedSubjectId || undefined);

  // Real-time subscription pour la table subjects
  useRealtimeSubscription({
    table: "subjects",
    onChange: () => {
      if (selectedClass && selectedSchoolYear && selectedSemester) {
        fetchSubjects();
      }
    },
  });

  // Handle prefilled data from navigation (state ou query params)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const subjectParam = searchParams.get('subject');
    const classParam = searchParams.get('class');
    const schoolYearParam = searchParams.get('schoolYear');
    const semesterParam = searchParams.get('semester');
    
    if (location.state) {
      const { prefilledClass, prefilledSubject, prefilledSchoolYear, prefilledSemester } = location.state as any;
      if (prefilledClass) setSelectedClass(prefilledClass);
      if (prefilledSubject) setSelectedSubject(prefilledSubject);
      if (prefilledSchoolYear) setSelectedSchoolYear(prefilledSchoolYear);
      if (prefilledSemester) setSelectedSemester(prefilledSemester);
    } else if (subjectParam || classParam || schoolYearParam || semesterParam) {
      if (classParam) setSelectedClass(decodeURIComponent(classParam));
      if (subjectParam) setSelectedSubject(decodeURIComponent(subjectParam));
      if (schoolYearParam) setSelectedSchoolYear(decodeURIComponent(schoolYearParam));
      if (semesterParam) setSelectedSemester(decodeURIComponent(semesterParam));
    } else {
      setSelectedClass("");
      setSelectedSubject("");
      setSelectedSchoolYear("");
      setSelectedSemester("");
      setSelectedSubjectId(null);
      setNewSubjectMetadata(null);
      setAssessments([]);
    }
  }, [location.state, location.search, location.key]);

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
  }, [isAdmin]);

  const fetchMySubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
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
        .select(`
          id,
          subject_name,
          school_year_fk_id,
          academic_period_id,
          class_fk_id,
          classes!fk_subjects_class(name, level),
          school_years!fk_subjects_school_year(label),
          academic_periods!fk_subjects_academic_period(label)
        `)
        .eq("teacher_id", user.id)
        .order("subject_name");

      if (error) throw error;

      // Mapper les données pour compatibilité avec TeacherSubject
      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        subject_name: s.subject_name,
        class_name: s.classes?.[0]?.name || '',
        school_year: s.school_years?.[0]?.label || currentYear.label,
        semester: s.academic_periods?.[0]?.label || '',
        teacher_name: user.email?.split('@')[0] || '',
        school_year_fk_id: s.school_year_fk_id,
        academic_period_id: s.academic_period_id,
      }));
      
      setMySubjects(mapped as TeacherSubject[]);
    } catch (error) {
      console.error("Error fetching my subjects:", error);
    }
  };

  const handleQuickSelectSubject = (subject: TeacherSubject) => {
    setSelectedClass(subject.class_name);
    setSelectedSchoolYear(subject.school_year);
    setSelectedSemester(subject.semester);
    setSelectedSubject(subject.subject_name);
    setSelectedSubjectId(subject.id);
    setNewSubjectMetadata({
      teacherName: subject.teacher_name || '',
      schoolYear: subject.school_year || '',
      semester: subject.semester || '',
    });
  };

  useEffect(() => {
    if (selectedClass && selectedSchoolYear && selectedSemester) {
      fetchSubjects();
    }
  }, [selectedClass, selectedSchoolYear, selectedSemester]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  // Calculer les assessments depuis gradesData
  useEffect(() => {
    if (gradesData && gradesData.length > 0) {
      calculateAssessments(gradesData);
    } else {
      setAssessments([]);
    }
  }, [gradesData, students.length]);

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

      // ✅ Phase 4A: Récupération via FK avec JOIN
      // Récupérer les IDs des référentiels
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('label', selectedSchoolYear)
        .maybeSingle();
      
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('name', selectedClass)
        .maybeSingle();
      
      if (!schoolYearData || !classData) {
        setSubjects([]);
        return;
      }
      
      const { data: academicPeriodData } = await supabase
        .from('academic_periods')
        .select('id')
        .eq('label', selectedSemester)
        .eq('school_year_id', schoolYearData.id)
        .maybeSingle();

      let query = supabase
        .from("subjects")
        .select(`
          id,
          subject_name,
          teacher_id,
          school_year_fk_id,
          academic_period_id,
          class_fk_id,
          classes!fk_subjects_class(name),
          school_years!fk_subjects_school_year(label),
          academic_periods!fk_subjects_academic_period(label)
        `)
        .eq("class_fk_id", classData.id)
        .eq("school_year_fk_id", schoolYearData.id);

      if (academicPeriodData) {
        query = query.eq("academic_period_id", academicPeriodData.id);
      }

      // Les enseignants ne naviguent que dans leurs propres matières
      if (!isAdmin) {
        query = query.eq('teacher_id', user.id);
      }

      const { data, error } = await query.order('subject_name');
      
      if (error) throw error;
      
      if (data) {
        // Mapper pour compatibilité TeacherSubject
        const mapped = (data || []).map((s: any) => ({
          id: s.id,
          subject_name: s.subject_name,
          class_name: s.classes?.[0]?.name || selectedClass,
          school_year: s.school_years?.[0]?.label || selectedSchoolYear,
          semester: s.academic_periods?.[0]?.label || selectedSemester,
          teacher_name: userEmail?.split('@')[0] || '',
          school_year_fk_id: s.school_year_fk_id,
          academic_period_id: s.academic_period_id,
        }));
        
        setSubjects(mapped as TeacherSubject[]);
        
        const subjectToCheck = subjectName ?? selectedSubject;
        const currentSubjectExists = subjectToCheck
          ? data.find(s => s.subject_name === subjectToCheck)
          : undefined;
        
        if (subjectToCheck && currentSubjectExists) {
          setSelectedSubjectId(currentSubjectExists.id);
          setNewSubjectMetadata({
            teacherName: (currentSubjectExists as any).teacher_name || '',
            schoolYear: (currentSubjectExists as any).school_year || '',
            semester: (currentSubjectExists as any).semester || '',
          });
        } else if (subjectToCheck && !currentSubjectExists) {
          setSelectedSubject("");
          setSelectedSubjectId(null);
          setNewSubjectMetadata(null);
          toast.warning("La matière sélectionnée n'existe pas pour cette combinaison classe/année/semestre");
        } else {
          setNewSubjectMetadata(null);
          setSelectedSubjectId(null);
        }
      } else {
        setSubjects([]);
        setSelectedSubject("");
        setSelectedSubjectId(null);
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

  const calculateAssessments = (allGrades: Grade[]) => {
    const assessmentMap = new Map<string, Assessment>();
    
    allGrades.forEach(grade => {
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
    return gradesData.filter(g => g.student_id === studentId);
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

  const getClassStatistics = () => {
    if (students.length === 0 || gradesData.length === 0) {
      return {
        classAverage: null,
        totalAssessments: 0,
        missingGradesCount: 0,
        studentsWithMissingGrades: [],
      };
    }

    const assessments = new Map();
    gradesData.forEach(grade => {
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

    let totalAverage = 0;
    let studentsWithGrades = 0;
    
    students.forEach(student => {
      const studentGrades = getStudentGrades(student.id);
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

      let teacherId = user.id;
      let teacherEmail = user.email;
      let teacherFkId = null;

      if (isAdmin) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('user_id, full_name')
          .eq('full_name', teacherName)
          .maybeSingle();

        if (teacher) {
          teacherId = teacher.user_id;
          teacherFkId = teacher.user_id;
          
          const { data: profile } = await supabase
            .from('teacher_profiles')
            .select('email')
            .eq('user_id', teacher.user_id)
            .maybeSingle();
          
          teacherEmail = profile?.email;
        }
      } else {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('user_id, full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacher) {
          teacherFkId = teacher.user_id;
          
          const { data: profile } = await supabase
            .from('teacher_profiles')
            .select('email')
            .eq('user_id', teacher.user_id)
            .maybeSingle();
          
          teacherEmail = profile?.email;
        }
      }

      // Phase 4A: Récupérer les ID de FK
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('name', selectedClass)
        .maybeSingle();
      
      const { data: newSubjectData, error } = await supabase.from("subjects").insert({
        teacher_id: teacherId,
        teacher_fk_id: teacherFkId,
        subject_name: subject,
        school_year_fk_id: schoolYearId,
        academic_period_id: academicPeriodId,
        class_fk_id: classData?.id || null,
      } as any).select().single();

      if (error) throw error;

      setSelectedSubject(subject);
      setSelectedSubjectId(newSubjectData.id);
      setNewSubjectMetadata({ teacherName, schoolYear, semester });
      setShowNewSubjectDialog(false);
      
      toast.success("Matière créée avec succès");
      fetchSubjects();
    } catch (error: any) {
      console.error("Error creating subject:", error);
      toast.error("Erreur lors de la création de la matière");
    }
  };

  const handleGradeUpdated = () => {
    fetchSubjects();
  };

  const handleDeleteSubject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!selectedSubjectId) return;

      const { error: gradesError } = await supabase
        .from("grades")
        .delete()
        .eq("subject_id", selectedSubjectId);

      if (gradesError) throw gradesError;

      const { error: subjectError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", selectedSubjectId);

      if (subjectError) throw subjectError;

      toast.success("Matière supprimée avec succès");
      
      setSelectedSubject("");
      setSelectedSubjectId(null);
      setNewSubjectMetadata(null);
      
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

      const gradesToDelete = gradesData.filter(g => {
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

      const { error } = await supabase
        .from("grades")
        .delete()
        .in('id', gradesToDelete.map(g => g.id));

      if (error) throw error;

      toast.success(`Épreuve "${assessment.name}" supprimée avec ${gradesToDelete.length} note(s)`);
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast.error("Erreur lors de la suppression de l'épreuve");
    }
  };

  const handleResetSelection = () => {
    setSelectedSubject("");
    setSelectedSubjectId(null);
  };

  const handleNavigateToSubject = (direction: 'prev' | 'next') => {
    const currentIndex = subjects.findIndex(s => s.id === selectedSubjectId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < subjects.length) {
      const newSubject = subjects[newIndex];
      setSelectedSubject(newSubject.subject_name);
      setSelectedSubjectId(newSubject.id);
      
      // ✅ Mettre à jour les métadonnées pour afficher le bon nom d'enseignant
      setNewSubjectMetadata({
        teacherName: newSubject.teacher_name,
        schoolYear: newSubject.school_year,
        semester: newSubject.semester,
      });
    }
  };

  const currentSubjectIndex = subjects.findIndex(s => s.id === selectedSubjectId);
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

      <div className="space-y-6">
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
                  <SelectTrigger data-testid="school-year-select">
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
                  <SelectTrigger data-testid="semester-select">
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
                  <SelectTrigger data-testid="class-select">
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
                    value={selectedSubjectId || ""} 
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setShowNewSubjectDialog(true);
                      } else {
                        const subject = subjects.find(s => s.id === value);
                        if (subject) {
                          setSelectedSubject(subject.subject_name);
                          setSelectedSubjectId(value);
                          fetchSubjects(subject.subject_name);
                        }
                      }
                    }}
                    disabled={!selectedClass || !selectedSchoolYear || !selectedSemester}
                  >
                    <SelectTrigger data-testid="subject-select">
                      <SelectValue placeholder={t("grades.selectSubject")} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name}
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
                          key={subject.id}
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            setSelectedSubject(subject.subject_name);
                            setSelectedSubjectId(subject.id);
                            fetchSubjects(subject.subject_name);
                          }}
                        >
                          {subject.subject_name}
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

{selectedClass && selectedSubject && selectedSubject !== "__new__" && selectedSchoolYear && selectedSemester && selectedSubjectId && (
        <div className="space-y-6">
          {/* Header élégant de la matière */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <BookOpen className="w-7 h-7 text-primary" />
                    {selectedSubject}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {selectedClass} • {selectedSchoolYear} • {selectedSemester}
                  </CardDescription>
                </div>
                {newSubjectMetadata && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Enseignant</p>
                    <p className="font-medium">{newSubjectMetadata.teacherName}</p>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

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
                data-testid="new-assessment-button"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Nouvelle épreuve
              </Button>
            </div>

            {/* Class Statistics Dashboard */}
            {gradesData.length > 0 && (
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
                          const missing = students.filter((st) => {
                            const sg = gradesData.filter((g) => g.student_id === st.id);
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            const sel = {
                              name: assessment.name,
                              type: assessment.type,
                              customLabel: assessment.customLabel || null,
                            };
                            const missing = students.filter((st) => {
                              const sg = gradesData.filter((g) => g.student_id === st.id);
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
                          }
                        }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{assessment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assessment.studentsWithGrades}/{assessment.totalStudents} étudiants notés
                            {assessment.studentsWithGrades >= assessment.totalStudents && (
                              <span className="ml-2 text-green-600 font-medium">✓ Complète</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <EditAssessmentDialog
                            assessmentName={assessment.name}
                            assessmentType={assessment.type}
                            assessmentCustomLabel={assessment.customLabel || null}
                            className={subjects.find(s => s.id === selectedSubjectId)?.class_name || selectedClass}
                            subject={subjects.find(s => s.id === selectedSubjectId)?.subject_name || selectedSubject}
                            schoolYear={subjects.find(s => s.id === selectedSubjectId)?.school_year || selectedSchoolYear}
                            semester={subjects.find(s => s.id === selectedSubjectId)?.semester || selectedSemester}
                            subjectId={selectedSubjectId}
                            onUpdated={handleGradeUpdated}
                          />
                          
                          <PublishAssessmentButton 
                            assessmentName={assessment.name}
                            assessmentType={assessment.type}
                            assessmentCustomLabel={assessment.customLabel || null}
                            subjectId={selectedSubjectId}
                            subjectName={subjects.find(s => s.id === selectedSubjectId)?.subject_name || selectedSubject}
                            className={subjects.find(s => s.id === selectedSubjectId)?.class_name || selectedClass}
                            schoolYear={subjects.find(s => s.id === selectedSubjectId)?.school_year || selectedSchoolYear}
                            semester={subjects.find(s => s.id === selectedSubjectId)?.semester || selectedSemester}
                            teacherName={subjects.find(s => s.id === selectedSubjectId)?.teacher_name || ''}
                            studentsWithGrades={assessment.studentsWithGrades}
                            totalStudents={assessment.totalStudents}
                            isComplete={assessment.studentsWithGrades >= assessment.totalStudents}
                          />
                          
                          {assessment.studentsWithGrades < assessment.totalStudents && (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`complete-assessment-${assessment.name}`}
                              onClick={() => {
                                const sel = {
                                  name: assessment.name,
                                  type: assessment.type,
                                  customLabel: assessment.customLabel || null,
                                };
                                const missing = students.filter((st) => {
                                  const sg = gradesData.filter((g) => g.student_id === st.id);
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
                                data-testid={`delete-assessment-${assessment.name}`}
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

            {isLoading || gradesLoading ? (
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
                        subjectId={selectedSubjectId}
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
        </div>
      )}

      {showBulkImport && selectedClass && selectedSubject && selectedSubjectId && (
        <BulkGradeImport
          students={students}
          classname={selectedClass}
          subject={selectedSubject}
          subjectId={selectedSubjectId}
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
    </div>
  );
}
