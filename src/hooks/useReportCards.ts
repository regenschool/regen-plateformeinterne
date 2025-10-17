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

export const useGenerateReportCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateReportCardParams) => {
      const { studentId, schoolYear, semester, className } = params;

      // 1. Récupérer les données de l'élève
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
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

      // 4. Calculer les moyennes
      const studentAverage = grades && grades.length > 0
        ? grades.reduce((acc, g) => acc + (g.grade / g.max_grade) * 20 * g.weighting, 0) /
          grades.reduce((acc, g) => acc + g.weighting, 0)
        : 0;

      // Pour la moyenne de classe, on calcule sur tous les étudiants de la même classe
      const { data: classGrades } = await supabase
        .from('grades')
        .select('grade, max_grade, weighting')
        .eq('class_name', className)
        .eq('school_year', schoolYear)
        .eq('semester', semester);

      const classAverage = classGrades && classGrades.length > 0
        ? classGrades.reduce((acc, g) => acc + (g.grade / g.max_grade) * 20 * g.weighting, 0) /
          classGrades.reduce((acc, g) => acc + g.weighting, 0)
        : 0;

      // 5. Construire les données pour le PDF
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
        },
        grades: grades?.map(g => ({
          subject: g.subject,
          grade: g.grade,
          maxGrade: g.max_grade,
          weighting: g.weighting,
          assessmentType: g.assessment_type,
          appreciation: g.appreciation,
        })) || [],
        template: template ? {
          name: template.name,
          headerColor: template.header_color,
          logoUrl: template.logo_url,
          footerText: template.footer_text,
          sections: template.sections_order as string[],
          htmlTemplate: template.html_template,
          cssTemplate: template.css_template,
          useCustomHtml: template.use_custom_html,
        } : undefined,
        averages: {
          student: studentAverage,
          class: classAverage,
        },
      };

      // 6. Générer le PDF avec Puppeteer
      const generator = createPDFGenerator(true);
      const pdfBlob = await generator.generateReportCard(reportCardData);

      // 7. Uploader le PDF dans le storage
      const fileName = `${studentId}_${schoolYear}_${semester}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-cards')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('report-cards')
        .getPublicUrl(fileName);

      // 8. Sauvegarder dans la base de données avec l'URL du PDF
      const { data: reportCard, error: insertError } = await supabase
        .from('student_report_cards')
        .insert([{
          student_id: studentId,
          school_year: schoolYear,
          semester,
          class_name: className,
          template_id: template?.id,
          generated_data: reportCardData as any,
          status: 'generated',
          pdf_url: publicUrl,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return { reportCard, pdfBlob, pdfUrl: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Bulletin généré avec succès');
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
