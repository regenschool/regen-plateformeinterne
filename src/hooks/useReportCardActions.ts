import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createPDFGenerator, ReportCardData } from '@/lib/pdfGenerator';

// Hook pour générer le PDF final à partir d'un brouillon
export const useGenerateFinalPDF = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportCardId, data }: { reportCardId: string; data: ReportCardData }) => {
      // 1. Générer le PDF optimisé (images compressées)
      const generator = createPDFGenerator(true);
      const pdfBlob = await generator.generateReportCard(data);

      // 2. Uploader le PDF dans le storage
      const fileName = `${reportCardId}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('report-cards')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // 3. Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('report-cards')
        .getPublicUrl(fileName);

      // 4. Mettre à jour le statut et l'URL du PDF
      const { error: updateError } = await supabase
        .from('student_report_cards')
        .update({
          status: 'generated',
          pdf_url: publicUrl,
          edited_data: data as any,
        })
        .eq('id', reportCardId);

      if (updateError) throw updateError;

      return { pdfUrl: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('PDF généré avec succès');
    },
    onError: (error: Error) => {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    },
  });
};

// Hook pour sauvegarder les modifications d'un brouillon
export const useSaveDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportCardId, data }: { reportCardId: string; data: ReportCardData }) => {
      const { error } = await supabase
        .from('student_report_cards')
        .update({
          edited_data: data as any,
        })
        .eq('id', reportCardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Brouillon sauvegardé');
    },
    onError: (error: Error) => {
      console.error('Error saving draft:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });
};

// Hook pour supprimer un bulletin (brouillon ou généré)
export const useDeleteReportCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportCardId: string) => {
      // Récupérer le bulletin pour savoir s'il y a un PDF à supprimer
      const { data: reportCard } = await supabase
        .from('student_report_cards')
        .select('pdf_url')
        .eq('id', reportCardId)
        .single();

      // Supprimer le PDF du storage si existe
      if (reportCard?.pdf_url) {
        const fileName = reportCard.pdf_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('report-cards')
            .remove([fileName]);
        }
      }

      // Supprimer l'enregistrement
      const { error } = await supabase
        .from('student_report_cards')
        .delete()
        .eq('id', reportCardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Bulletin supprimé');
    },
    onError: (error: Error) => {
      console.error('Error deleting report card:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};
