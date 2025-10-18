import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateConfigValue } from '@/lib/templateConfigUtils';

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

// Hook pour récupérer les stats de classe (avec cache)
export const useClassSubjectStats = (className?: string, schoolYear?: string, semester?: string) => {
  return useQuery({
    queryKey: ['class-subject-stats', className, schoolYear, semester],
    queryFn: async () => {
      if (!className || !schoolYear || !semester) return null;
      
      const { data, error } = await supabase.rpc('calculate_class_subject_stats', {
        p_class_name: className,
        p_school_year: schoolYear,
        p_semester: semester
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!(className && schoolYear && semester),
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en cache pendant 10 minutes
  });
};

// Hook pour récupérer les coefficients (avec cache)
export const useSubjectWeights = (className?: string, schoolYear?: string, semester?: string) => {
  return useQuery({
    queryKey: ['subject-weights', className, schoolYear, semester],
    queryFn: async () => {
      if (!className || !schoolYear || !semester) return null;
      
      const { data, error } = await supabase.rpc('get_subject_weights_for_class', {
        p_class_name: className,
        p_school_year: schoolYear,
        p_semester: semester
      });

      if (error) throw error;
      
      // Convertir en Map pour accès rapide
      const weightMap = new Map<string, number>();
      if (data) {
        data.forEach((sw: any) => {
          weightMap.set(sw.subject_name, sw.weight);
        });
      }
      return weightMap;
    },
    enabled: !!(className && schoolYear && semester),
    staleTime: 10 * 60 * 1000, // Cache pendant 10 minutes
    gcTime: 20 * 60 * 1000,
  });
};

export const useGenerateReportCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateReportCardParams) => {
      const { studentId, schoolYear, semester, className } = params;

      // 0. Vérifier si un bulletin existe déjà pour cet étudiant/année/semestre
      const { data: existingReportCard } = await supabase
        .from('student_report_cards')
        .select('id, pdf_url')
        .eq('student_id', studentId)
        .eq('school_year', schoolYear)
        .eq('semester', semester)
        .maybeSingle();

      // Si un bulletin avec PDF existe, supprimer le PDF du storage avant de continuer
      if (existingReportCard?.pdf_url) {
        const fileName = existingReportCard.pdf_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('report-cards').remove([fileName]);
        }
      }

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

      // ✅ OPTIMISÉ : Récupérer les coefficients via RPC (avec cache potentiel)
      const { data: subjectWeightsData } = await supabase.rpc('get_subject_weights_for_class', {
        p_class_name: className,
        p_school_year: schoolYear,
        p_semester: semester
      });

      const weightMap = new Map<string, number>();
      if (subjectWeightsData) {
        subjectWeightsData.forEach((sw: any) => {
          weightMap.set(sw.subject_name, sw.weight);
        });
      }

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

      let templateConfig: any[] = [];
      if (template) {
        const { data: configData } = await supabase
          .from('report_card_template_config')
          .select('*')
          .eq('template_id', template.id);
        
        templateConfig = configData || [];
        
        // ✅ ROBUSTESSE 10/10 : Initialiser les appréciations dans config si elles n'existent pas
        const hasSchoolAppreciation = templateConfig.some(
          c => c.section_key === 'appreciation' && c.element_key === 'school_appreciation_text'
        );
        const hasCompanyAppreciation = templateConfig.some(
          c => c.section_key === 'appreciation' && c.element_key === 'company_appreciation_text'
        );
        
        if (!hasSchoolAppreciation) {
          templateConfig = updateConfigValue(
            templateConfig,
            'appreciation',
            'school_appreciation_text',
            '' // Vide par défaut, sera rempli en édition
          );
        }
        
        if (!hasCompanyAppreciation) {
          templateConfig = updateConfigValue(
            templateConfig,
            'appreciation',
            'company_appreciation_text',
            '' // Vide par défaut, sera rempli en édition
          );
        }
      }

      // 4. Calculer les moyennes par matière
      const subjectAverages = grades && grades.length > 0 
        ? calculateSubjectAverages(grades) 
        : [];
      
      const studentAverage = subjectAverages.length > 0
        ? subjectAverages.reduce((acc, s) => acc + s.average * s.weighting, 0) /
          subjectAverages.reduce((acc, s) => acc + s.weighting, 0)
        : 0;

      // 5. ✅ OPTIMISÉ : Calculer les stats de classe via SQL
      const { data: classStats } = await supabase.rpc('calculate_class_subject_stats', {
        p_class_name: className,
        p_school_year: schoolYear,
        p_semester: semester
      });

      const subjectStats = new Map<string, { classAvg: number; min: number; max: number }>();
      if (classStats) {
        classStats.forEach((stat: any) => {
          subjectStats.set(stat.subject, {
            classAvg: stat.class_avg,
            min: stat.min_avg,
            max: stat.max_avg
          });
        });
      }

      // Calculer la moyenne de classe générale
      const classAverage = classStats && classStats.length > 0
        ? classStats.reduce((sum: number, stat: any) => {
            const weight = weightMap.get(stat.subject) || 1;
            return sum + stat.class_avg * weight;
          }, 0) / classStats.reduce((sum: number, stat: any) => {
            const weight = weightMap.get(stat.subject) || 1;
            return sum + weight;
          }, 0)
        : 0;

      // 6. Enrichir les moyennes avec les stats de classe ET les coefficients
      const enrichedSubjectAverages = subjectAverages.map(s => {
        const stats = subjectStats.get(s.subject);
        const subjectWeight = weightMap.get(s.subject) || 1; // Utiliser le coefficient depuis subject_weights
        return {
          ...s,
          weighting: subjectWeight, // ✅ CORRECTION : utiliser le vrai coefficient
          classAverage: stats?.classAvg,
          minAverage: stats?.min,
          maxAverage: stats?.max,
        };
      });

      // 6. Résoudre le nom du programme (depuis la classe liée ou via le nom de classe)
      let programName: string | undefined = (student as any).classes?.programs?.name || undefined;
      if (!programName && className) {
        const { data: cls } = await supabase
          .from('classes')
          .select('name, programs:program_id (name)')
          .eq('name', className)
          .single();
        programName = (cls as any)?.programs?.name || undefined;
      }

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
          programName: programName || 'Programme de Formation',
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
          logo_url: template.logo_url,
          signature_url: template.signature_url,
          header_color: template.header_color,
          footer_text: template.footer_text,
          config: templateConfig,
        } : undefined,
        averages: {
          student: studentAverage,
          class: classAverage,
        },
      };

      // 8. Créer ou mettre à jour le brouillon
      let reportCard;
      if (existingReportCard) {
        // Mise à jour du bulletin existant
        const { data, error: updateError } = await supabase
          .from('student_report_cards')
          .update({
            generated_data: reportCardData as any,
            edited_data: null, // Reset des modifications
            status: 'draft',
            pdf_url: null, // Reset du PDF
            template_id: template?.id,
          })
          .eq('id', existingReportCard.id)
          .select()
          .single();

        if (updateError) throw updateError;
        reportCard = data;
      } else {
        // Création d'un nouveau bulletin
        const { data, error: insertError } = await supabase
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
        reportCard = data;
      }

      return { reportCard, reportCardData };
    },
    onSuccess: (data, variables) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      queryClient.invalidateQueries({ 
        queryKey: ['class-subject-stats', variables.className, variables.schoolYear, variables.semester] 
      });
      
      const message = data.reportCard.created_at === data.reportCard.updated_at 
        ? 'Brouillon créé - vous pouvez l\'éditer avant génération PDF'
        : 'Brouillon mis à jour - l\'ancien PDF a été supprimé';
      toast.success(message);
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
