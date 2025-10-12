import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SchoolYear = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Class = {
  id: string;
  name: string;
  level: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AcademicPeriod = {
  id: string;
  school_year_id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Hook pour récupérer les années scolaires
export const useSchoolYears = (activeOnly = false) => {
  return useQuery({
    queryKey: ['school_years', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('school_years')
        .select('*')
        .order('label', { ascending: false });
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SchoolYear[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - Les référentiels changent rarement
  });
};

// Hook pour récupérer les classes du référentiel
export const useClassesReferential = (activeOnly = true) => {
  return useQuery({
    queryKey: ['classes_referential', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Class[];
    },
    staleTime: 30 * 60 * 1000,
  });
};

// Hook pour récupérer les périodes académiques
export const useAcademicPeriods = (schoolYearId?: string, activeOnly = false) => {
  return useQuery({
    queryKey: ['academic_periods', schoolYearId, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('academic_periods')
        .select('*')
        .order('start_date');
      
      if (schoolYearId) {
        query = query.eq('school_year_id', schoolYearId);
      }
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AcademicPeriod[];
    },
    enabled: !schoolYearId || !!schoolYearId,
    staleTime: 30 * 60 * 1000,
  });
};

// Hook pour récupérer l'année scolaire active
export const useActiveSchoolYear = () => {
  return useQuery({
    queryKey: ['active_school_year'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as SchoolYear | null;
    },
    staleTime: 30 * 60 * 1000,
  });
};

// Hook pour récupérer les périodes académiques actives
export const useActivePeriods = () => {
  return useQuery({
    queryKey: ['active_periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*, school_years(*)')
        .eq('is_active', true)
        .order('start_date');
      
      if (error) throw error;
      return data as (AcademicPeriod & { school_years: SchoolYear })[];
    },
    staleTime: 30 * 60 * 1000,
  });
};
