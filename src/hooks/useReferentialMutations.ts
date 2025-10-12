import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook pour gérer les mutations sur les années scolaires
export const useSchoolYearMutations = () => {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await (supabase as any)
        .from('school_years')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_years'] });
      toast.success('Année scolaire ajoutée');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('school_years')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_years'] });
      toast.success('Année scolaire mise à jour');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_years')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_years'] });
      toast.success('Année scolaire supprimée');
    },
  });

  return { add, update, remove };
};
