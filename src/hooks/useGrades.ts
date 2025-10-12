import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  teacher_id: string;
  school_year: string | null;
  semester: string | null;
  class_name: string;
  is_absent?: boolean;
};

type GradesFilters = {
  className?: string;
  subject?: string;
  schoolYear?: string;
  semester?: string;
  teacherId?: string;
};

// Hook pour récupérer les notes avec filtres
export const useGrades = (filters: GradesFilters) => {
  const { className, subject, schoolYear, semester, teacherId } = filters;
  
  return useQuery({
    queryKey: ['grades', className, subject, schoolYear, semester, teacherId],
    queryFn: async () => {
      let query = supabase.from('grades').select('*');
      
      if (className) query = query.eq('class_name', className);
      if (subject) query = query.eq('subject', subject);
      if (schoolYear) query = query.eq('school_year', schoolYear);
      if (semester) query = query.eq('semester', semester);
      if (teacherId) query = query.eq('teacher_id', teacherId);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Grade[];
    },
    enabled: !!(className && subject && schoolYear && semester),
  });
};

// Hook pour récupérer les notes d'un étudiant spécifique
export const useStudentGrades = (studentId: string, filters?: Omit<GradesFilters, 'teacherId'>) => {
  return useQuery({
    queryKey: ['grades', 'student', studentId, filters],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId);
      
      if (filters?.className) query = query.eq('class_name', filters.className);
      if (filters?.subject) query = query.eq('subject', filters.subject);
      if (filters?.schoolYear) query = query.eq('school_year', filters.schoolYear);
      if (filters?.semester) query = query.eq('semester', filters.semester);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Grade[];
    },
    enabled: !!studentId,
  });
};

// Hook pour ajouter une note
export const useAddGrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (grade: Record<string, any>) => {
      const { data, error } = await (supabase as any)
        .from('grades')
        .upsert([grade], {
          onConflict: 'student_id,subject,school_year,semester,assessment_name,assessment_type,assessment_custom_label'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalider les caches concernés
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'student', data.student_id] });
    },
  });
};

// Hook pour mettre à jour une note
export const useUpdateGrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'student', data.student_id] });
      toast.success('Note mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour : ' + error.message);
    },
  });
};

// Hook pour supprimer une note
export const useDeleteGrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gradeId: string) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Note supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};

// Hook pour supprimer toutes les notes d'une épreuve
export const useDeleteAssessmentGrades = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      className: string;
      subject: string;
      schoolYear: string;
      semester: string;
      assessmentName: string;
      assessmentType: string;
    }) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('class_name', params.className)
        .eq('subject', params.subject)
        .eq('school_year', params.schoolYear)
        .eq('semester', params.semester)
        .eq('assessment_name', params.assessmentName)
        .eq('assessment_type', params.assessmentType as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Épreuve supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};
