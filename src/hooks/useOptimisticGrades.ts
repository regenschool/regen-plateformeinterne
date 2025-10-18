import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer les mises à jour optimistes des notes
 * Permet d'éviter les conflits lors de saisie simultanée par plusieurs enseignants
 */
export const useOptimisticGradeUpdate = () => {
  const queryClient = useQueryClient();

  const updateGradeOptimistically = async (
    gradeId: string,
    updates: any,
    queryKey: string[] = ['grades']
  ) => {
    // Snapshot de l'état actuel
    const previousData = queryClient.getQueryData(queryKey);

    // Mise à jour optimiste
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return old.map((grade: any) => 
        grade.id === gradeId ? { ...grade, ...updates } : grade
      );
    });

    try {
      // Mise à jour réelle avec gestion de concurrence
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', gradeId)
        .select()
        .single();

      if (error) throw error;

      // Invalider les caches liés pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['class-subject-stats'] });
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });

      return data;
    } catch (error) {
      // Rollback en cas d'erreur
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  };

  return { updateGradeOptimistically };
};
