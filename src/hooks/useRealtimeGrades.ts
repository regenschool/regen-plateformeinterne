import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour écouter les changements en temps réel sur les notes
 * Permet de synchroniser les données entre plusieurs enseignants travaillant simultanément
 * 
 * Optimisé pour l'architecture normalisée avec subject_id
 */
export const useRealtimeGrades = (subjectId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!subjectId) return;

    const channel = supabase
      .channel(`grades-subject-${subjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `subject_id=eq.${subjectId}`,
        },
        (payload) => {
          console.log('Grade change detected (normalized):', payload);
          
          // Invalider les caches pertinents (architecture normalisée)
          queryClient.invalidateQueries({ queryKey: ['grades-normalized'] });
          queryClient.invalidateQueries({ queryKey: ['student-grades-normalized'] });
          queryClient.invalidateQueries({ queryKey: ['class-subject-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId, queryClient]);
};
