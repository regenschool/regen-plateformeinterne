import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Teacher = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

// Hook pour récupérer tous les enseignants
export const useTeachers = (activeOnly?: boolean) => {
  return useQuery({
    queryKey: ['teachers', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('teachers')
        .select('*')
        .order('full_name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Teacher[];
    },
  });
};

// Hook pour récupérer un enseignant spécifique
export const useTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();
      
      if (error) throw error;
      return data as Teacher;
    },
    enabled: !!teacherId,
  });
};

// Hook pour récupérer l'enseignant de l'utilisateur connecté
export const useCurrentTeacher = () => {
  return useQuery({
    queryKey: ['current-teacher'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Teacher | null;
    },
  });
};

// Hook pour ajouter un enseignant
export const useAddTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacher: Record<string, any>) => {
      const { data, error } = await (supabase as any)
        .from('teachers')
        .insert([teacher])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Enseignant ajouté avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout : ' + error.message);
    },
  });
};

// Hook pour mettre à jour un enseignant
export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Teacher> }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Enseignant mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour : ' + error.message);
    },
  });
};

// Hook pour supprimer un enseignant
export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Enseignant supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};

// Helper: Synchroniser ou créer un enseignant à partir de auth.users
export const syncTeacherFromAuth = async (userId: string, email: string, fullName?: string) => {
  const { data: existing } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('teachers')
    .insert({
      user_id: userId,
      email,
      full_name: fullName || email,
    })
    .select('id')
    .single();

  if (error && error.code !== '23505') throw error; // Ignore duplicate errors
  return data?.id;
};
