import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Subject = {
  id: string;
  teacher_id: string;
  teacher_email: string | null;
  teacher_name: string;
  school_year: string;
  semester: string;
  class_name: string;
  subject_name: string;
  created_at: string;
  updated_at: string;
  // FK normalisées
  school_year_fk_id: string | null;
  academic_period_id: string | null;
  teacher_fk_id: string | null;
  class_fk_id: string | null;
};

type SubjectsFilters = {
  className?: string;
  schoolYear?: string;
  semester?: string;
  teacherId?: string;
};

// Hook pour récupérer les matières avec filtres
export const useSubjects = (filters: SubjectsFilters) => {
  const { className, schoolYear, semester, teacherId } = filters;
  
  return useQuery({
    queryKey: ['subjects', className, schoolYear, semester, teacherId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      let query = supabase.from('subjects').select('*');
      
      // Filtrer par utilisateur si teacherId n'est pas fourni
      if (!teacherId) {
        query = query.or(`teacher_id.eq.${user.id},teacher_email.eq.${user.email}`);
      } else {
        query = query.eq('teacher_id', teacherId);
      }
      
      if (className) query = query.eq('class_name', className);
      if (schoolYear) query = query.eq('school_year', schoolYear);
      if (semester) query = query.eq('semester', semester);
      
      const { data, error } = await query.order('subject_name');
      
      if (error) throw error;
      return data as Subject[];
    },
    enabled: !!(className && schoolYear && semester),
  });
};

// Hook pour récupérer les noms uniques de matières
export const useSubjectNames = (filters: SubjectsFilters) => {
  const { data: subjects } = useSubjects(filters);
  
  return {
    data: subjects ? Array.from(new Set(subjects.map(s => s.subject_name))) : [],
    isLoading: !subjects,
  };
};

// Hook pour ajouter une matière
export const useAddSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subject: Record<string, any>) => {
      const { data, error} = await (supabase as any)
        .from('subjects')
        .insert([subject])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Matière ajoutée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout : ' + error.message);
    },
  });
};

// Hook pour supprimer une matière
export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      className: string;
      subject: string;
      schoolYear: string;
      semester: string;
    }) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('class_name', params.className)
        .eq('subject_name', params.subject)
        .eq('school_year', params.schoolYear)
        .eq('semester', params.semester);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Matière supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};
