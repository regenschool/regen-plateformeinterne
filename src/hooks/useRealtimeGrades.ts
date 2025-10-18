import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour écouter les changements en temps réel sur les notes
 * Permet de synchroniser les données entre plusieurs enseignants travaillant simultanément
 */
export const useRealtimeGrades = (className?: string, schoolYear?: string, semester?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!className || !schoolYear || !semester) return;

    const channel = supabase
      .channel(`grades-${className}-${schoolYear}-${semester}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `class_name=eq.${className}`,
        },
        (payload) => {
          console.log('Grade change detected:', payload);
          
          // Invalider les caches pertinents
          queryClient.invalidateQueries({ queryKey: ['grades'] });
          queryClient.invalidateQueries({ 
            queryKey: ['class-subject-stats', className, schoolYear, semester] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [className, schoolYear, semester, queryClient]);
};
