/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook pour gérer les mutations sur les années scolaires
export const useSchoolYearMutations = () => {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (data: { label: string; start_date: string; end_date: string; is_active?: boolean }) => {
      const { error } = await supabase
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

// Hook pour gérer les mutations sur les classes
export const useClassMutations = () => {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (data: { name: string; level?: string | null; capacity?: number | null; is_active?: boolean }) => {
      const { error } = await supabase
        .from('classes')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes_referential'] });
      toast.success('Classe ajoutée');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('classes')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes_referential'] });
      toast.success('Classe mise à jour');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes_referential'] });
      toast.success('Classe supprimée');
    },
  });

  return { add, update, remove };
};

// Hook pour gérer les mutations sur les périodes académiques
export const useAcademicPeriodMutations = () => {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (data: { school_year_id: string; label: string; start_date: string; end_date: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('academic_periods')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic_periods'] });
      toast.success('Période académique ajoutée');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('academic_periods')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic_periods'] });
      toast.success('Période académique mise à jour');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academic_periods')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic_periods'] });
      toast.success('Période académique supprimée');
    },
  });

  return { add, update, remove };
};

// Hooks for managing levels mutations
export const useLevelMutations = () => {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (data: { name: string; is_active: boolean }) => {
      const { error } = await supabase.from('levels').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success('Niveau ajouté avec succès');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('levels').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success('Niveau mis à jour avec succès');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success('Niveau supprimé avec succès');
    },
  });

  return { add, update, remove };
};

// Hook pour gérer les mutations sur les programmes
export const useProgramMutations = () => {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (program: { name: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('programs')
        .insert(program)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Programme ajouté avec succès');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Programme mis à jour avec succès');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Programme supprimé avec succès');
    },
  });

  return { add, update, remove };
};

// Fonction helper pour synchroniser automatiquement les classes
export const syncClassToReferential = async (className: string) => {
  if (!className || !className.trim()) return;

  const { data: existing } = await supabase
    .from('classes')
    .select('id')
    .eq('name', className)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('classes')
      .insert([{ name: className, is_active: true }]);
  }
};
