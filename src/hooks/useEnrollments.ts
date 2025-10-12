import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StudentEnrollment = {
  id: string;
  student_id: string;
  school_year_id: string;
  class_id: string | null;
  level_id: string | null;
  assigned_teacher_id: string | null;
  class_name: string | null;
  company: string | null;
  academic_background: string | null;
  created_at: string;
  updated_at: string;
  // Champs enrichis de la vue
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  age?: number;
  photo_url?: string;
  special_needs?: string;
  class_name_from_ref?: string;
  class_level?: string;
  level_name?: string;
  school_year_label?: string;
  school_year_is_active?: boolean;
  assigned_teacher_name?: string;
  assigned_teacher_email?: string;
};

type EnrollmentFilters = {
  schoolYearId?: string;
  classId?: string;
  studentId?: string;
};

// Hook pour récupérer les inscriptions avec filtres
export const useEnrollments = (filters: EnrollmentFilters = {}) => {
  const { schoolYearId, classId, studentId } = filters;
  
  return useQuery({
    queryKey: ['enrollments', schoolYearId, classId, studentId],
    queryFn: async () => {
      let query = supabase.from('v_student_enrollments_enriched').select('*');
      
      if (schoolYearId) query = query.eq('school_year_id', schoolYearId);
      if (classId) query = query.eq('class_id', classId);
      if (studentId) query = query.eq('student_id', studentId);
      
      const { data, error } = await query.order('last_name');
      
      if (error) throw error;
      return data as StudentEnrollment[];
    },
  });
};

// Hook pour ajouter une inscription
export const useAddEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enrollment: { 
      student_id: string; 
      school_year_id: string;
      class_id?: string | null;
      level_id?: string | null;
      assigned_teacher_id?: string | null;
      class_name?: string | null;
      company?: string | null;
      academic_background?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('student_enrollments')
        .insert([enrollment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Inscription ajoutée');
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });
};

// Hook pour mettre à jour une inscription
export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StudentEnrollment> }) => {
      const { data, error } = await supabase
        .from('student_enrollments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Inscription mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });
};

/**
 * Hook pour supprimer une inscription (enrollment) d'une année scolaire spécifique
 * Supprime uniquement l'inscription sans affecter l'étudiant dans les autres années
 */
export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Étudiant désinscrit de cette année scolaire');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la désinscription : ' + error.message);
    },
  });
};

/**
 * Hook pour supprimer définitivement un étudiant de toutes les années
 * ATTENTION : Supprime l'étudiant et toutes ses inscriptions via CASCADE DELETE
 */
export const useDeleteStudentPermanently = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Étudiant supprimé définitivement de toutes les années');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};
