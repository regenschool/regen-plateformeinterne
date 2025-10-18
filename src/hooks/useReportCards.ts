import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateReportCardParams {
  studentId: string;
  schoolYear: string;
  semester: string;
  className: string;
}

interface SubjectAverage {
  subject: string;
  subject_category?: string;
  average: number;
  maxGrade: number;
  weighting: number;
  assessmentType: string;
  appreciation?: string;
  gradeCount: number;
  classAverage?: number;
  minAverage?: number;
  maxAverage?: number;
  teacher_name?: string;
  individualGrades?: Array<{
    assessment_name?: string;
    assessment_type: string;
    grade: number;
    max_grade: number;
    weighting: number;
    appreciation?: string;
  }>;
}

// Fonction pour grouper les notes par matière et calculer les moyennes
const calculateSubjectAverages = (grades: any[]): SubjectAverage[] => {
  const subjectMap = new Map<string, any[]>();
  
  grades.forEach(grade => {
    const key = grade.subject;
    if (!subjectMap.has(key)) {
      subjectMap.set(key, []);
    }
    subjectMap.get(key)!.push(grade);
  });
  
  const subjectAverages: SubjectAverage[] = [];
  subjectMap.forEach((subjectGrades, subject) => {
    const totalWeightedGrade = subjectGrades.reduce(
      (acc, g) => acc + (g.grade / g.max_grade) * 20 * g.weighting, 
      0
    );
    const totalWeighting = subjectGrades.reduce((acc, g) => acc + g.weighting, 0);
    const average = totalWeightedGrade / totalWeighting;
    
    const weighting = subjectGrades[0].weighting;
    const appreciations = subjectGrades.map(g => g.appreciation).filter(Boolean);
    const appreciation = appreciations.length > 0 ? appreciations.join(' - ') : undefined;
    const category = (subjectGrades[0] as any)?.subjects?.subject_categories?.name;
    const teacher_name = subjectGrades[0]?.teacher_name;
    
    const individualGrades = subjectGrades.map(g => ({
      assessment_name: g.assessment_name || g.assessment_type,
      assessment_type: g.assessment_type,
      grade: g.grade,
      max_grade: g.max_grade,
      weighting: g.weighting,
      appreciation: g.appreciation,
    }));
    
    subjectAverages.push({
      subject,
      subject_category: category,
      average: parseFloat(average.toFixed(2)),
      maxGrade: 20,
      weighting,
      assessmentType: 'Moyenne',
      appreciation,
      gradeCount: subjectGrades.length,
      teacher_name,
      individualGrades,
    });
  });
  
  return subjectAverages;
};

export const useGenerateReportCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateReportCardParams) => {
      const { studentId, schoolYear, semester, className } = params;

      // 1. Récupérer l'étudiant avec classe et programme
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            program_id,
            programs:program_id (
              id,
              name
            )
          )
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // 2. Récupérer les notes
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId)
        .eq('school_year', schoolYear)
        .eq('semester', semester);

      if (gradesError) throw gradesError;

      // 3. Récupérer le template par défaut avec sa config
      const { data: template, error: templateError } = await supabase
        .from('report_card_templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.warn('No default template found');
      }

      let templateConfig = [];
      if (template) {
        const { data: configData } = await supabase
          .from('report_card_template_config')
          .select('*')
          .eq('template_id', template.id);
        
        templateConfig = configData || [];
      }

      // 4. Calculer les moyennes par matière
      const subjectAverages = grades && grades.length > 0 
        ? calculateSubjectAverages(grades) 
        : [];
      
      const studentAverage = subjectAverages.length > 0
        ? subjectAverages.reduce((acc, s) => acc + s.average * s.weighting, 0) /
          subjectAverages.reduce((acc, s) => acc + s.weighting, 0)
        : 0;

      // 5. Calculer les stats de classe
      const { data: classGrades } = await supabase
        .from('grades')
        .select('*')
        .eq('class_name', className)
        .eq('school_year', schoolYear)
        .eq('semester', semester);

      const classSubjectAverages = classGrades && classGrades.length > 0
        ? calculateSubjectAverages(classGrades)
        : [];
        
      const classAverage = classSubjectAverages.length > 0
        ? classSubjectAverages.reduce((acc, s) => acc + s.average * s.weighting, 0) /
          classSubjectAverages.reduce((acc, s) => acc + s.weighting, 0)
        : 0;

      // Calculer min/max par matière
      const subjectStats = new Map<string, { classAvg: number; min: number; max: number }>();
      
      if (classGrades && classGrades.length > 0) {
        const studentsBySubject = new Map<string, Map<string, { total: number; weight: number }>>();
        
        classGrades.forEach(grade => {
          if (!studentsBySubject.has(grade.subject)) {
            studentsBySubject.set(grade.subject, new Map());
          }
          const subjectMap = studentsBySubject.get(grade.subject)!;
          
          if (!subjectMap.has(grade.student_id)) {
            subjectMap.set(grade.student_id, { total: 0, weight: 0 });
          }
          const studentData = subjectMap.get(grade.student_id)!;
          studentData.total += (grade.grade / grade.max_grade) * 20 * grade.weighting;
          studentData.weight += grade.weighting;
        });
        
        studentsBySubject.forEach((studentsMap, subject) => {
          const averages: number[] = [];
          studentsMap.forEach(data => {
            if (data.weight > 0) {
              averages.push(data.total / data.weight);
            }
          });
          
          if (averages.length > 0) {
            const classAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
            const min = Math.min(...averages);
            const max = Math.max(...averages);
            subjectStats.set(subject, { classAvg, min, max });
          }
        });
      }

      // 6. Enrichir les moyennes avec les stats de classe
      const enrichedSubjectAverages = subjectAverages.map(s => {
        const stats = subjectStats.get(s.subject);
        return {
          ...s,
          classAverage: stats?.classAvg,
          minAverage: stats?.min,
          maxAverage: stats?.max,
        };
      });

      const programName = (student as any).classes?.programs?.name || 'Programme de Formation';

      // 7. Construire les données pour le PDF
      const reportCardData = {
        student: {
          firstName: student.first_name,
          lastName: student.last_name,
          birthDate: student.birth_date,
          className: student.class_name,
          photoUrl: student.photo_url,
          age: student.age,
        },
        academic: {
          schoolYear,
          semester,
          programName,
        },
        grades: enrichedSubjectAverages.map(s => ({
          subject: s.subject,
          subject_category: s.subject_category,
          grade: s.average,
          maxGrade: 20,
          weighting: s.weighting,
          assessmentType: 'Moyenne',
          appreciation: s.appreciation,
          classAverage: s.classAverage,
          minAverage: s.minAverage,
          maxAverage: s.maxAverage,
          teacher_name: s.teacher_name,
          individualGrades: s.individualGrades, // Ajout des notes détaillées
        })),
        template: template ? {
          name: template.name,
          config: templateConfig,
          logo_url: template.logo_url,
          signature_url: template.signature_url,
        } : undefined,
        averages: {
          student: studentAverage,
          class: classAverage,
        },
      };

      // 8. Créer le brouillon
      const { data: reportCard, error: insertError } = await supabase
        .from('student_report_cards')
        .insert([{
          student_id: studentId,
          school_year: schoolYear,
          semester,
          class_name: className,
          template_id: template?.id,
          generated_data: reportCardData as any,
          status: 'draft',
          pdf_url: null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return { reportCard, reportCardData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Brouillon créé - vous pouvez l\'éditer avant génération PDF');
    },
    onError: (error: Error) => {
      console.error('Error generating report card:', error);
      toast.error('Erreur lors de la génération du bulletin');
    },
  });
};

export const useReportCards = (filters?: {
  studentId?: string;
  schoolYear?: string;
  semester?: string;
}) => {
  return useQuery({
    queryKey: ['report-cards', filters],
    queryFn: async () => {
      let query = supabase
        .from('student_report_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      if (filters?.schoolYear) {
        query = query.eq('school_year', filters.schoolYear);
      }
      if (filters?.semester) {
        query = query.eq('semester', filters.semester);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};
