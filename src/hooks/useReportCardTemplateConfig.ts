import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Section {
  section_key: string;
  label: string;
  display_order: number;
}

export interface SectionElement {
  section_key: string;
  element_key: string;
  label: string;
  element_type: 'text' | 'variable' | 'image' | 'number';
  display_order: number;
  is_editable_in_draft: boolean;
}

export interface TemplateConfig {
  id?: string;
  template_id: string;
  section_key: string;
  element_key: string;
  is_visible: boolean;
  is_editable: boolean;
  default_value?: string;
  style_options?: Record<string, any>;
}

export const useSections = () => {
  return useQuery({
    queryKey: ['report-card-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_card_sections')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as Section[];
    },
  });
};

export const useSectionElements = (sectionKey?: string) => {
  return useQuery({
    queryKey: ['report-card-section-elements', sectionKey],
    queryFn: async () => {
      let query = supabase
        .from('report_card_section_elements')
        .select('*')
        .order('display_order');

      if (sectionKey) {
        query = query.eq('section_key', sectionKey);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SectionElement[];
    },
  });
};

export const useTemplateConfig = (templateId?: string) => {
  return useQuery({
    queryKey: ['report-card-template-config', templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from('report_card_template_config')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;
      return data as TemplateConfig[];
    },
    enabled: !!templateId,
  });
};

export const useUpsertTemplateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configs: TemplateConfig[]) => {
      const { error } = await supabase
        .from('report_card_template_config')
        .upsert(configs, { onConflict: 'template_id,section_key,element_key' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['report-card-template-config', variables[0]?.template_id] 
      });
      toast.success('Configuration enregistrée');
    },
    onError: (error) => {
      console.error('Error upserting config:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // Supprimer d'abord les bulletins associés
      const { error: reportCardsError } = await supabase
        .from('student_report_cards')
        .delete()
        .eq('template_id', templateId);

      if (reportCardsError) throw reportCardsError;

      // Puis supprimer le template (cascade supprimera la config)
      const { error } = await supabase
        .from('report_card_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-card-templates'] });
      queryClient.invalidateQueries({ queryKey: ['student-report-cards'] });
      toast.success('Modèle supprimé avec succès');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};
