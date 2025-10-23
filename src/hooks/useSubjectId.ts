import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook utilitaire pour récupérer subject_id depuis les métadonnées
 * Utilisé pendant la phase de transition (Phase 3A)
 */
export const useSubjectId = (params: {
  subjectName?: string;
  className?: string;
  schoolYear?: string;
  semester?: string;
  teacherId?: string;
}) => {
  const { subjectName, className, schoolYear, semester, teacherId } = params;
  
  return useQuery({
    queryKey: ['subject-id', subjectName, className, schoolYear, semester, teacherId],
    queryFn: async () => {
      if (!subjectName || !className || !schoolYear || !semester || !teacherId) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('subjects')
        .select('id')
        .eq('subject_name', subjectName)
        .eq('class_name', className)
        .eq('school_year', schoolYear)
        .eq('semester', semester)
        .eq('teacher_id', teacherId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching subject_id:', error);
        return null;
      }
      
      return data?.id || null;
    },
    enabled: !!(subjectName && className && schoolYear && semester && teacherId),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes (subjects changent rarement)
  });
};
