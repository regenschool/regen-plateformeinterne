import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ClassMapping = {
  sourceClassId: string;
  sourceClassName: string;
  targetClassId: string;
  targetClassName: string;
  studentCount: number;
};

type TransitionPayload = {
  sourceSchoolYearId: string;
  targetSchoolYearId: string;
  mappings: ClassMapping[];
};

// Hook pour exécuter le passage d'année
export const useYearTransition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sourceSchoolYearId, targetSchoolYearId, mappings }: TransitionPayload) => {
      const results = [];
      
      for (const mapping of mappings) {
        // Récupérer tous les étudiants de la classe source
        const { data: enrollments, error: fetchError } = await supabase
          .from('student_enrollments')
          .select('student_id, assigned_teacher_id')
          .eq('school_year_id', sourceSchoolYearId)
          .eq('class_id', mapping.sourceClassId);
        
        if (fetchError) throw fetchError;
        
        // Créer les nouvelles inscriptions pour l'année cible
        const newEnrollments = enrollments.map(enrollment => ({
          student_id: enrollment.student_id,
          school_year_id: targetSchoolYearId,
          class_id: mapping.targetClassId,
          class_name: mapping.targetClassName,
          assigned_teacher_id: enrollment.assigned_teacher_id,
        }));
        
        // Insertion en masse
        const { error: insertError } = await supabase
          .from('student_enrollments')
          .insert(newEnrollments);
        
        if (insertError) {
          // Si erreur de conflit (déjà existant), on l'ignore
          if (insertError.code !== '23505') {
            throw insertError;
          }
        }
        
        results.push({
          sourceClass: mapping.sourceClassName,
          targetClass: mapping.targetClassName,
          count: enrollments.length,
        });
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      
      const totalMoved = results.reduce((sum, r) => sum + r.count, 0);
      toast.success(`✅ Passage réussi : ${totalMoved} étudiants transférés`, {
        description: results.map(r => `${r.sourceClass} → ${r.targetClass} (${r.count})`).join('\n'),
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors du passage d\'année', {
        description: error.message,
      });
    },
  });
};

// Hook pour prévisualiser le passage
export const usePreviewTransition = () => {
  return async (sourceSchoolYearId: string, mappings: ClassMapping[]) => {
    const preview = [];
    
    for (const mapping of mappings) {
      const { count, error } = await supabase
        .from('student_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('school_year_id', sourceSchoolYearId)
        .eq('class_id', mapping.sourceClassId);
      
      if (error) throw error;
      
      preview.push({
        sourceClass: mapping.sourceClassName,
        targetClass: mapping.targetClassName,
        studentCount: count || 0,
      });
    }
    
    return preview;
  };
};
