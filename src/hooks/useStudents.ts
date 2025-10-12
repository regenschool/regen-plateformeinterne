import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  birth_date: string | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
  special_needs: string | null;
  created_at: string;
};

// Hook pour récupérer tous les étudiants avec cache
export const useStudents = (className?: string) => {
  return useQuery({
    queryKey: ['students', className],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select('*')
        .order('last_name');
      
      if (className && className !== 'all') {
        query = query.eq('class_name', className);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Student[];
    },
  });
};

// Hook pour récupérer un étudiant spécifique
export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    enabled: !!studentId,
  });
};

// Hook pour récupérer les classes uniques
export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .order('class_name');
      
      if (error) throw error;
      
      const uniqueClasses = Array.from(new Set(data?.map(s => s.class_name) || []));
      return uniqueClasses;
    },
  });
};

// Hook pour ajouter un étudiant
export const useAddStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (student: Record<string, any>) => {
      const { data, error } = await (supabase as any)
        .from('students')
        .insert([student])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalider le cache des étudiants pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Étudiant ajouté avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout : ' + error.message);
    },
  });
};

// Hook pour mettre à jour un étudiant
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalider le cache de cet étudiant spécifique et la liste globale
      queryClient.invalidateQueries({ queryKey: ['students', data.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Étudiant mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour : ' + error.message);
    },
  });
};

// Hook pour supprimer un étudiant
export const useDeleteStudent = () => {
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
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Étudiant supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};
