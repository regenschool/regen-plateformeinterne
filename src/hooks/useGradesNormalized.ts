/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * NORMALIZED HOOKS - Phase 3A Migration
 * Ces hooks utilisent subject_id (FK) au lieu des colonnes dénormalisées
 * Avantages: performance, intégrité, évolutivité
 */

export type GradeNormalized = {
  id: string;
  student_id: string;
  subject_id: string;
  assessment_name: string | null;
  assessment_type: string;
  assessment_custom_label: string | null;
  grade: number;
  max_grade: number;
  weighting: number;
  appreciation: string | null;
  created_at: string;
  teacher_id: string;
  is_absent?: boolean;
  is_active?: boolean;
  deleted_at?: string | null;
  // Relations enrichies via JOIN sur subjects
  subjects?: {
    subject_name: string;
    classes: { name: string };
    school_years: { label: string };
    academic_periods: { label: string };
  };
  // Propriétés de compatibilité mappées
  subject?: string;
  class_name?: string;
  school_year?: string | null;
  semester?: string | null;
};

type GradesNormalizedFilters = {
  subject_id?: string;
  teacherId?: string;
};

/**
 * Hook pour récupérer les notes avec JOIN sur subjects
 * Architecture normalisée - Utilise subject_id uniquement
 */
export const useGradesNormalized = (filters: GradesNormalizedFilters = {}) => {
  const { subject_id, teacherId } = filters;
  
  return useQuery({
    queryKey: ['grades-normalized', subject_id, teacherId],
    queryFn: async () => {
      console.log('🔍 useGradesNormalized - Fetching grades with:', { subject_id, teacherId });
      
      let query = supabase
        .from('grades')
        .select(`
          *,
          subjects!fk_grades_subject (
            subject_name,
            classes!fk_subjects_class(name),
            school_years!fk_subjects_school_year(label),
            academic_periods!fk_subjects_academic_period(label)
          )
        `)
        .eq('is_active', true)
        .is('deleted_at', null);
      
      if (subject_id) {
        query = query.eq('subject_id', subject_id);
      }
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapper pour compatibilité avec composants existants
      const mappedData = (data || []).map(grade => ({
        ...grade,
        subject: grade.subjects?.subject_name,
        class_name: grade.subjects?.classes?.name,
        school_year: grade.subjects?.school_years?.label || null,
        semester: grade.subjects?.academic_periods?.label || null,
      }));
      
      console.log('✅ useGradesNormalized - Fetched', mappedData.length, 'grades');
      return mappedData;
    },
    enabled: !!subject_id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les notes d'un étudiant
 * Utilise la vue v_student_visible_grades pour filtrer automatiquement selon le rôle
 */
export const useStudentGradesNormalized = (
  studentId: string
) => {
  return useQuery({
    queryKey: ['grades-normalized', 'student', studentId],
    queryFn: async () => {
      // ✅ Récupérer le rôle de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id || '')
        .maybeSingle();
      
      const isTeacherOrAdmin = roles?.role === 'teacher' || roles?.role === 'admin';
      
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          subjects!fk_grades_subject (
            subject_name,
            classes!fk_subjects_class(name),
            school_years!fk_subjects_school_year(label),
            academic_periods!fk_subjects_academic_period(label)
          )
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (gradesError) throw gradesError;
      
      let filteredGrades = gradesData || [];
      
      // ✅ Si étudiant : filtrer selon visibilité
      if (!isTeacherOrAdmin) {
        const { data: assessments } = await supabase
          .from('assessments')
          .select('subject_id, assessment_name, assessment_type, teacher_id')
          .eq('is_visible_to_students', true)
          .eq('is_active', true)
          .is('deleted_at', null);
        
        const visibleKeys = new Set(
          (assessments || []).map(a => `${a.subject_id}_${a.assessment_name}_${a.assessment_type}_${a.teacher_id}`)
        );
        
        filteredGrades = filteredGrades.filter(g => 
          visibleKeys.has(`${g.subject_id}_${g.assessment_name}_${g.assessment_type}_${g.teacher_id}`)
        );
      }
      
      return filteredGrades.map(grade => ({
        ...grade,
        subject: grade.subjects?.subject_name,
        class_name: grade.subjects?.classes?.name,
        school_year: grade.subjects?.school_years?.label || null,
        semester: grade.subjects?.academic_periods?.label || null,
      }));
    },
    enabled: !!studentId,
    staleTime: 1 * 60 * 1000,
  });
};

// ✅ Fonction getSubjectId supprimée - migration complète vers subject_id

/**
 * Hook pour ajouter une note avec subject_id
 * NOUVEAU SYSTÈME - Utilise uniquement subject_id
 */
export const useAddGradeNormalized = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (grade: {
      student_id: string;
      subject_id: string;
      assessment_name: string;
      assessment_type: 'participation_individuelle' | 'oral_groupe' | 'oral_individuel' | 'ecrit_groupe' | 'ecrit_individuel' | 'memoire' | 'autre';
      assessment_custom_label?: string | null;
      grade: number;
      max_grade: number;
      weighting: number;
      appreciation?: string | null;
      is_absent?: boolean;
      teacher_id: string;
    }) => {
      // Vérifier si une note existe déjà
      const { data: existingGrade } = await supabase
        .from('grades')
        .select('id')
        .eq('student_id', grade.student_id)
        .eq('subject_id', grade.subject_id)
        .eq('assessment_name', grade.assessment_name || '')
        .eq('assessment_type', grade.assessment_type)
        .maybeSingle();

      let data, error;
      if (existingGrade) {
        // Update
        const result = await supabase
          .from('grades')
          .update(grade as any)
          .eq('id', existingGrade.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert
        const result = await supabase
          .from('grades')
          .insert([grade as any])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['grades-normalized'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'student', data.student_id] });
      toast.success('Note enregistrée');
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });
};

/**
 * Hook pour mettre à jour une note (normalisé)
 */
export const useUpdateGradeNormalized = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['grades-normalized'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'student', data.student_id] });
      toast.success('Note mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });
};

/**
 * Hook pour supprimer une note
 */
export const useDeleteGradeNormalized = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gradeId: string) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['grades-normalized'] });
      toast.success('Note supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });
};

/**
 * Hook pour supprimer toutes les notes d'une épreuve (par subject_id)
 */
export const useDeleteAssessmentGradesNormalized = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      subjectId: string;
      assessmentName: string;
      assessmentType: 'participation_individuelle' | 'oral_groupe' | 'oral_individuel' | 'ecrit_groupe' | 'ecrit_individuel' | 'memoire' | 'autre';
    }) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('subject_id', params.subjectId)
        .eq('assessment_name', params.assessmentName)
        .eq('assessment_type', params.assessmentType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['grades-normalized'] });
      toast.success('Épreuve supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });
};
