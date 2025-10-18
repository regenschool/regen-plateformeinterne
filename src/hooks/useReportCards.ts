import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createPDFGenerator, ReportCardData } from '@/lib/pdfGenerator';

interface GenerateReportCardParams {
  studentId: string;
  schoolYear: string;
  semester: string;
  className: string;
}

interface SubjectAverage {
  subject: string;
  average: number;
  maxGrade: number;
  weighting: number;
  assessmentType: string;
  appreciation?: string;
  gradeCount: number;
}

// Fonction pour grouper les notes par matière et calculer les moyennes
const calculateSubjectAverages = (grades: any[]): SubjectAverage[] => {
  const subjectMap = new Map<string, any[]>();
  
  // Grouper les notes par matière
  grades.forEach(grade => {
    const key = grade.subject;
    if (!subjectMap.has(key)) {
      subjectMap.set(key, []);
    }
    subjectMap.get(key)!.push(grade);
  });
  
  // Calculer la moyenne pour chaque matière
  const subjectAverages: SubjectAverage[] = [];
  subjectMap.forEach((subjectGrades, subject) => {
    // Calculer la moyenne pondérée des notes de la matière
    const totalWeightedGrade = subjectGrades.reduce(
      (acc, g) => acc + (g.grade / g.max_grade) * 20 * g.weighting, 
      0
    );
    const totalWeighting = subjectGrades.reduce((acc, g) => acc + g.weighting, 0);
    const average = totalWeightedGrade / totalWeighting;
    
    // Prendre le coefficient de la première note (devrait être uniforme pour une matière)
    const weighting = subjectGrades[0].weighting;
    
    // Combiner les appréciations si plusieurs
    const appreciations = subjectGrades
      .map(g => g.appreciation)
      .filter(Boolean);
    const appreciation = appreciations.length > 0 ? appreciations.join(' - ') : undefined;
    
    subjectAverages.push({
      subject,
      average: parseFloat(average.toFixed(2)),
      maxGrade: 20, // Normalisé à 20
      weighting,
      assessmentType: 'Moyenne', // Type = moyenne pour distinguer des épreuves individuelles
      appreciation,
      gradeCount: subjectGrades.length,
    });
  });
  
  return subjectAverages;
};

export const useGenerateReportCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateReportCardParams) => {
      const { studentId, schoolYear, semester, className } = params;

      // 1. Récupérer les données de l'élève avec sa classe et le programme
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

      // 3. Récupérer le template actif
      const { data: template, error: templateError } = await supabase
        .from('report_card_templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.warn('No default template found, using basic template');
      }

      // 4. Calculer les moyennes par matière
      const subjectAverages = grades && grades.length > 0 
        ? calculateSubjectAverages(grades) 
        : [];
      
      // Calculer la moyenne générale (moyenne pondérée des moyennes de matières)
      const studentAverage = subjectAverages.length > 0
        ? subjectAverages.reduce((acc, s) => acc + s.average * s.weighting, 0) /
          subjectAverages.reduce((acc, s) => acc + s.weighting, 0)
        : 0;

      // Pour la moyenne de classe, récupérer toutes les notes de la classe et calculer par matière
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

      // Calculer les statistiques par matière (moyenne, min, max de la classe)
      // Grouper tous les élèves de la classe par matière pour calculer les stats
      const subjectStats = new Map<string, { averages: number[]; classAvg: number; min: number; max: number }>();
      
      if (classGrades && classGrades.length > 0) {
        // Grouper les notes par élève et par matière
        const studentsBySubject = new Map<string, Map<string, { total: number; weight: number; count: number }>>();
        
        classGrades.forEach(grade => {
          if (!studentsBySubject.has(grade.subject)) {
            studentsBySubject.set(grade.subject, new Map());
          }
          const subjectMap = studentsBySubject.get(grade.subject)!;
          
          if (!subjectMap.has(grade.student_id)) {
            subjectMap.set(grade.student_id, { total: 0, weight: 0, count: 0 });
          }
          const studentData = subjectMap.get(grade.student_id)!;
          studentData.total += (grade.grade / grade.max_grade) * 20 * grade.weighting;
          studentData.weight += grade.weighting;
          studentData.count++;
        });
        
        // Calculer les moyennes par élève et les statistiques
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
            subjectStats.set(subject, { averages, classAvg, min, max });
          }
        });
      }

      // Récupérer le nom du programme
      const programName = (student as any).classes?.programs?.name || template?.program_name || 'Programme de Formation';

      // 5. Construire les données pour le PDF (utilise les moyennes par matière)
      const reportCardData: ReportCardData = {
        student: {
          firstName: student.first_name,
          lastName: student.last_name,
          birthDate: student.birth_date,
          className: student.class_name,
          photoUrl: student.photo_url,
        },
        academic: {
          schoolYear,
          semester,
          programName, // Nom du programme dynamique de l'étudiant
        },
        // Utiliser les moyennes par matière au lieu des notes individuelles
        grades: subjectAverages.map(s => {
          const stats = subjectStats.get(s.subject);
          return {
            subject: s.subject,
            grade: s.average,
            maxGrade: s.maxGrade,
            weighting: s.weighting,
            assessmentType: s.assessmentType,
            appreciation: s.appreciation,
            classAverage: stats?.classAvg,
            minAverage: stats?.min,
            maxAverage: stats?.max,
          };
        }),
        template: template ? {
          id: template.id,
          name: template.name,
          headerColor: template.header_color,
          logoUrl: template.logo_url,
          footerText: template.footer_text,
          sections: template.sections_order as string[],
          htmlTemplate: template.html_template,
          cssTemplate: template.css_template,
          useCustomHtml: template.use_custom_html,
          show_header: template.show_header,
          show_footer: template.show_footer,
          show_student_info: template.show_student_info,
          show_academic_info: template.show_academic_info,
          show_grades_table: template.show_grades_table,
          show_average: template.show_average,
          show_class_average: template.show_class_average,
          show_appreciation: template.show_appreciation,
          show_student_photo: template.show_student_photo,
          show_logo: template.show_logo,
        } : undefined,
        averages: {
          student: studentAverage,
          class: classAverage,
        },
      };

      // 6. Créer un brouillon éditable (status = 'draft')
      const { data: reportCard, error: insertError } = await supabase
        .from('student_report_cards')
        .insert([{
          student_id: studentId,
          school_year: schoolYear,
          semester,
          class_name: className,
          template_id: template?.id,
          generated_data: reportCardData as any,
          status: 'draft', // Statut brouillon pour permettre l'édition
          pdf_url: null, // Pas encore de PDF
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return { reportCard, reportCardData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Brouillon créé avec succès - vous pouvez maintenant l\'éditer');
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
