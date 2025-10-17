import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * ARCHITECTURE: Teachers = Users with 'teacher' role
 * 
 * - teachers table: table légère pour jointures fréquentes (grades, subjects)
 *   Contient: user_id (PK) + full_name uniquement
 * - teacher_profiles table: données complètes et sensibles (email, phone, IBAN, etc.)
 * - Quand on insère dans teachers, le trigger sync_teacher_role crée automatiquement le rôle
 */

export type Teacher = {
  user_id: string; // PRIMARY KEY
  full_name: string;
  created_at: string;
  updated_at: string;
};

// Hook pour récupérer tous les enseignants
export const useTeachers = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data as Teacher[];
    },
  });
};

// Hook pour récupérer un enseignant spécifique
export const useTeacher = (userId: string) => {
  return useQuery({
    queryKey: ['teachers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data as Teacher;
    },
    enabled: !!userId,
  });
};

// Hook pour ajouter un enseignant
// IMPORTANT: user_id doit correspondre à un utilisateur existant dans auth.users
export const useAddTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacher: { user_id: string; full_name: string }) => {
      // Le rôle 'teacher' sera créé automatiquement par le trigger
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
    mutationFn: async ({ user_id, updates }: { user_id: string; updates: Partial<Teacher> }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('user_id', user_id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Enseignant mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour : ' + error.message);
    },
  });
};

// Hook pour supprimer un enseignant
// IMPORTANT: Cela supprime aussi automatiquement le rôle 'teacher' via trigger
export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('user_id', userId);
      
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

/**
 * Helper function pour synchroniser un enseignant depuis auth.users
 * Utilisé lors de la première connexion d'un enseignant
 */
export const syncTeacherFromAuth = async (userId: string, fullName: string) => {
  const { data, error } = await supabase
    .from('teachers')
    .insert([{ user_id: userId, full_name: fullName }])
    .select()
    .single();
  
  if (error && error.code !== '23505') { // Ignore duplicate key errors
    throw error;
  }
  
  return data;
};
