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
  // Relations enrichies via JOIN
  subjects?: {
    subject_name: string;
    class_name: string;
    school_year: string;
    semester: string;
    teacher_name: string;
  };
  // Propriétés de compatibilité pour EditGradeDialog (mappées depuis subjects)
  subject?: string;
  teacher_name?: string | null;
  school_year?: string | null;
  semester?: string | null;
};

type GradesNormalizedFilters = {
  subject_id?: string;
  className?: string;
  subject?: string;
  schoolYear?: string;
  semester?: string;
  teacherId?: string;
};

/**
 * Hook pour récupérer les notes avec JOIN sur subjects
 * Utilise subject_id pour des requêtes optimisées
 */
export const useGradesNormalized = (filters: GradesNormalizedFilters = {}) => {
  const { subject_id, className, subject, schoolYear, semester, teacherId } = filters;
  
  return useQuery({
    queryKey: ['grades-normalized', subject_id, className, subject, schoolYear, semester, teacherId],
    queryFn: async () => {
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
        `);
      
      // Filtrage direct via subject_id si fourni
      if (subject_id) {
        query = query.eq('subject_id', subject_id);
      }
      
      // Filtrage via JOIN sur subjects
      if (className || subject || schoolYear || semester) {
        query = query.not('subjects', 'is', null);
      }
      
      if (teacherId) query = query.eq('teacher_id', teacherId);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filtrer côté client si besoin (via JOINs)
      let filteredData = data as any[];
      
      if (className) {
        filteredData = filteredData.filter(g => g.subjects?.classes?.[0]?.name === className);
      }
      if (subject) {
        filteredData = filteredData.filter(g => g.subjects?.subject_name === subject);
      }
      if (schoolYear) {
        filteredData = filteredData.filter(g => g.subjects?.school_years?.[0]?.label === schoolYear);
      }
      if (semester) {
        filteredData = filteredData.filter(g => g.subjects?.academic_periods?.[0]?.label === semester);
      }
      
      // Mapper les données pour compatibilité avec les anciens composants
      return filteredData.map(grade => ({
        ...grade,
        subject: grade.subjects?.subject_name,
        teacher_name: null, // Plus disponible, sera récupéré si besoin
        school_year: grade.subjects?.school_years?.[0]?.label || null,
        semester: grade.subjects?.academic_periods?.[0]?.label || null,
      }));
    },
    enabled: !!(subject_id || (className && subject && schoolYear && semester)),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les notes d'un étudiant avec JOIN
 */
export const useStudentGradesNormalized = (
  studentId: string, 
  filters?: Omit<GradesNormalizedFilters, 'teacherId'>
) => {
  return useQuery({
    queryKey: ['grades-normalized', 'student', studentId, filters],
    queryFn: async () => {
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
        .eq('student_id', studentId);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      let filteredData = data as any[];
      
      if (filters?.className) {
        filteredData = filteredData.filter(g => g.subjects?.classes?.[0]?.name === filters.className);
      }
      if (filters?.subject) {
        filteredData = filteredData.filter(g => g.subjects?.subject_name === filters.subject);
      }
      if (filters?.schoolYear) {
        filteredData = filteredData.filter(g => g.subjects?.school_years?.[0]?.label === filters.schoolYear);
      }
      if (filters?.semester) {
        filteredData = filteredData.filter(g => g.subjects?.academic_periods?.[0]?.label === filters.semester);
      }
      
      // Mapper pour compatibilité
      return filteredData.map(grade => ({
        ...grade,
        subject: grade.subjects?.subject_name,
        teacher_name: null,
        school_year: grade.subjects?.school_years?.[0]?.label || null,
        semester: grade.subjects?.academic_periods?.[0]?.label || null,
      }));
    },
    enabled: !!studentId,
  });
};

/**
 * Utilitaire pour récupérer subject_id depuis les métadonnées
 * Permet la transition progressive depuis l'ancien système
 */
export const getSubjectId = async (params: {
  subjectName: string;
  className: string;
  schoolYear: string;
  semester: string;
  teacherId: string;
}): Promise<string | null> => {
  try {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('subject_name', params.subjectName)
    .eq('class_name', params.className)
    .eq('school_year', params.schoolYear)
    .eq('semester', params.semester)
    .eq('teacher_id', params.teacherId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching subject_id:', error);
    return null;
  }
  
  return data?.id || null;
  } catch (err) {
    console.error('Exception in getSubjectId:', err);
    return null;
  }
};

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
