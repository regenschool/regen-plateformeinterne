import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGenerateFinalPDF } from './useReportCardActions';

interface BulkGeneratePDFsParams {
  reportCardIds: string[];
  onProgress?: (current: number, total: number) => void;
}

// Hook pour convertir en masse les brouillons en PDFs générés
export const useBulkGeneratePDFs = () => {
  const queryClient = useQueryClient();
  const generatePDF = useGenerateFinalPDF();

  return useMutation({
    mutationFn: async ({ reportCardIds, onProgress }: BulkGeneratePDFsParams) => {
      if (!reportCardIds || reportCardIds.length === 0) {
        throw new Error('Aucun bulletin à générer');
      }

      const results = {
        success: [] as string[],
        errors: [] as { id: string; error: string }[],
      };

      // Traiter par lots de 3 pour éviter la surcharge
      const batchSize = 3;
      for (let i = 0; i < reportCardIds.length; i += batchSize) {
        const batch = reportCardIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (reportCardId) => {
            try {
              // Récupérer les données du bulletin
              const { data: reportCard, error } = await supabase
                .from('student_report_cards')
                .select('*')
                .eq('id', reportCardId)
                .single();

              if (error) throw error;
              if (reportCard.status !== 'draft') {
                throw new Error('Le bulletin n\'est pas un brouillon');
              }

              // Utiliser edited_data si disponible, sinon generated_data
              const dataToUse = reportCard.edited_data || reportCard.generated_data;

              // Appeler l'edge function pour générer le PDF via le hook
              await generatePDF.mutateAsync({
                reportCardId: reportCard.id,
                data: dataToUse as any,
              });

              results.success.push(reportCardId);
            } catch (error: any) {
              console.error(`Erreur pour le bulletin ${reportCardId}:`, error);
              results.errors.push({
                id: reportCardId,
                error: error.message || 'Erreur inconnue',
              });
            }

            // Mise à jour de la progression
            if (onProgress) {
              const current = Math.min(i + batch.indexOf(reportCardId) + 1, reportCardIds.length);
              onProgress(current, reportCardIds.length);
            }
          })
        );
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      
      if (results.errors.length === 0) {
        toast.success(`${results.success.length} PDF(s) générés avec succès`);
      } else {
        toast.warning(
          `${results.success.length} succès, ${results.errors.length} erreurs`
        );
      }
    },
    onError: (error: Error) => {
      console.error('Error in bulk PDF generation:', error);
      toast.error('Erreur lors de la génération en masse');
    },
  });
};
