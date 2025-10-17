import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemo } from 'react';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  birth_date: string | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
  special_needs: string | null;
  created_at: string;
  class_id: string | null;
  level_id: string | null;
  school_year_id: string | null;
  assigned_teacher_id: string | null;
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
      
      if (classFilter && classFilter !== 'all') {
        query = query.eq('class_name', classFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Student[];
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
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .order('class_name');
      
      if (error) throw error;
      
      const uniqueClasses = Array.from(new Set(data?.map(s => s.class_name) || []));
      return uniqueClasses;
    },
  });
};

// Hook pour ajouter un étudiant avec enrollment automatique
export const useAddStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentInput: Record<string, any>) => {
      const { school_year_id, ...studentData } = studentInput;
      
      // 1. Créer l'étudiant (avec class_name pour compatibilité)
      const { data: newStudent, error: studentError } = await (supabase as any)
        .from('students')
        .insert([studentData])
        .select()
        .single();
      
      if (studentError) throw studentError;
      
      // 2. Si school_year_id fourni, créer automatiquement un enrollment
      if (school_year_id && studentData.class_name) {
        // Récupérer class_id depuis class_name
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('name', studentData.class_name)
          .maybeSingle();
        
        if (classData) {
          const { error: enrollmentError } = await supabase
            .from('student_enrollments')
            .insert([{
              student_id: newStudent.id,
              school_year_id: school_year_id,
              class_id: classData.id,
              class_name: studentData.class_name,
            }]);
          
          if (enrollmentError) {
            console.error('Erreur création enrollment:', enrollmentError);
            // On ne bloque pas si l'enrollment échoue (possiblement déjà existant)
          }
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
      // Si class_name fourni mais pas class_id, chercher l'ID
      if (updates.class_name && !updates.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('name', updates.class_name)
          .maybeSingle();
        
        if (classData) {
          updates.class_id = classData.id;
        }
      }
      
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students', data.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
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
