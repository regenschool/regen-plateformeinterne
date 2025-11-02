import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Subject = {
  id: string;
  teacher_fk_id: string;  // ✅ teacher_id supprimée, utiliser teacher_fk_id
  subject_name: string;
  created_at: string;
  updated_at: string;
  // FK normalisées (architecture Phase 4A)
  school_year_fk_id: string | null;
  academic_period_id: string | null;
  class_fk_id: string | null;
  // Relations JOINées
  classes?: {
    name: string;
    level: string | null;
  };
  school_years?: {
    label: string;
  };
  academic_periods?: {
    label: string;
  };
  teachers?: {
    full_name: string;
  };
};

type SubjectsFilters = {
  className?: string;
  schoolYear?: string;
  semester?: string;
  teacherId?: string;
};

// Hook pour récupérer les matières avec filtres (architecture normalisée Phase 4A)
export const useSubjects = (filters: SubjectsFilters) => {
  const { className, schoolYear, semester, teacherId } = filters;
  
  return useQuery({
    queryKey: ['subjects', className, schoolYear, semester, teacherId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      // ✅ Récupérer le teachers.id depuis l'user_id
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', teacherId || user.id)
        .maybeSingle();

      if (!teacherData) {
        return [];
      }

      let query = supabase
        .from('subjects')
        .select(`
          *,
          classes!fk_subjects_class(name, level),
          school_years!fk_subjects_school_year(label),
          academic_periods!fk_subjects_academic_period(label),
          teachers!fk_subjects_teacher(full_name)
        `)
        .eq('teacher_fk_id', teacherData.id);  // ✅ Utiliser teacher_fk_id
      
      const { data, error } = await query.order('subject_name');
      
      if (error) throw error;
      
      // Filtrer côté client pour className/schoolYear/semester
      let filtered = data || [];
      if (className) {
        filtered = filtered.filter((s: any) => s.classes?.[0]?.name === className);
      }
      if (schoolYear) {
        filtered = filtered.filter((s: any) => s.school_years?.[0]?.label === schoolYear);
      }
      if (semester) {
        filtered = filtered.filter((s: any) => s.academic_periods?.[0]?.label === semester);
      }
      
      return filtered as any;
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

// Hook pour supprimer une matière (Phase 4A - par ID)
export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subjectId: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);
      
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
