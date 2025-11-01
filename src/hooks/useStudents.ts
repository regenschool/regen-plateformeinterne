import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemo } from 'react';

export type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  birth_date: string | null;
  special_needs: string | null;
  created_at: string;
  level_id: string | null;
  user_id: string | null;
  updated_at: string;
  is_active: boolean | null;
  deleted_at: string | null;
};

// Hook optimisé pour récupérer tous les étudiants avec cache et relations
export const useStudents = (classFilter?: string) => {
  return useQuery({
    queryKey: ['students', classFilter],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          class:classes(id, name, level),
          level:levels(id, name),
          school_year:school_years(id, label),
          assigned_teacher:teachers(id, full_name, email)
        `)
        .order('last_name');
      
      // Filtrage par classe via enrollments (plus via students.class_name qui n'existe plus)
      // if (classFilter && classFilter !== 'all') {
      //   Filtrage désactivé temporairement - à refaire via JOIN avec enrollments
      // }
      
      const { data, error } = await query;
      
      if (error) throw error;
      // Map to Student type (ignoring relations)
      return (data || []).map((s: any) => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        photo_url: s.photo_url,
        age: s.age,
        birth_date: s.birth_date,
        special_needs: s.special_needs,
        created_at: s.created_at,
        level_id: s.level_id,
        user_id: s.user_id,
        updated_at: s.updated_at,
        is_active: s.is_active,
        deleted_at: s.deleted_at,
      }));
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collection après 10 minutes
  });
};

// Hook pour récupérer un étudiant spécifique
export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    enabled: !!studentId,
  });
};

// Hook pour récupérer les classes uniques
export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      // Récupérer les classes depuis la table classes au lieu de students
      const { data, error } = await supabase
        .from('classes')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      return data?.map(c => c.name) || [];
    },
  });
};

// Hook pour ajouter un étudiant avec enrollment automatique
export const useAddStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentInput: Record<string, any>) => {
      const { class_name, school_year_id, ...studentData } = studentInput;
      
      // 1. ✅ Créer l'étudiant (SANS class_name qui n'existe plus)
      const { data: newStudent, error: studentError } = await (supabase as any)
        .from('students')
        .insert([{
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          photo_url: studentData.photo_url,
          birth_date: studentData.birth_date,
          special_needs: studentData.special_needs,
        }])
        .select()
        .single();
      
      if (studentError) throw studentError;
      
      // 2. ✅ Créer l'enrollment si class_name et school_year_id fournis
      if (class_name && school_year_id) {
        // Récupérer l'ID de la classe
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('name', class_name)
          .maybeSingle();
        
        if (classData) {
          await supabase.from('student_enrollments').insert({
            student_id: newStudent.id,
            school_year_id: school_year_id,
            class_id: classData.id,
            class_name: class_name,
            academic_background: studentData.academic_background || null,
            company: studentData.company || null,
          });
        }
      }
      
      return newStudent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Étudiant ajouté avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout : ' + error.message);
    },
  });
};

// Hook pour mettre à jour un étudiant
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { class_name, school_year_id, academic_background, company, ...studentUpdates } = updates;
      
      // 1. ✅ Mettre à jour l'étudiant (SANS class_name)
      const { data, error} = await supabase
        .from('students')
        .update(studentUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // 2. ✅ Mettre à jour l'enrollment si class_name fourni
      if (class_name && school_year_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('name', class_name)
          .maybeSingle();
        
        if (classData) {
          // Chercher l'enrollment existant
          const { data: existingEnrollment } = await supabase
            .from('student_enrollments')
            .select('id')
            .eq('student_id', id)
            .eq('school_year_id', school_year_id)
            .maybeSingle();
          
          if (existingEnrollment) {
            // Mettre à jour
            await supabase
              .from('student_enrollments')
              .update({
                class_id: classData.id,
                class_name: class_name,
                academic_background: academic_background || null,
                company: company || null,
              })
              .eq('id', existingEnrollment.id);
          } else {
            // Créer
            await supabase.from('student_enrollments').insert({
              student_id: id,
              school_year_id: school_year_id,
              class_id: classData.id,
              class_name: class_name,
              academic_background: academic_background || null,
              company: company || null,
            });
          }
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students', data.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Étudiant mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour : ' + error.message);
    },
  });
};

// Hook pour supprimer un étudiant
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Étudiant supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + error.message);
    },
  });
};
