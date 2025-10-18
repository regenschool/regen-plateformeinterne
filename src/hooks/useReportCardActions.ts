import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createPDFGenerator, ReportCardData } from '@/lib/pdfGenerator';

// Hook pour générer le PDF final à partir d'un brouillon
export const useGenerateFinalPDF = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportCardId, data }: { reportCardId: string; data: ReportCardData }) => {
      // 1. Appeler l'edge function pour générer le HTML
      const { data: htmlData, error: htmlError } = await supabase.functions.invoke(
        'generate-report-card-pdf-v2',
        {
          body: { reportCardData: data },
        }
      );

      if (htmlError) throw htmlError;
      if (!htmlData?.html) throw new Error('No HTML generated');

      // 2. Convertir le HTML en PDF (via navigateur, plus léger)
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');

      printWindow.document.write(htmlData.html);
      printWindow.document.close();

      // Attendre le chargement des images
      await new Promise<void>((resolve) => {
        if (printWindow.document.readyState === 'complete') {
          resolve();
        } else {
          printWindow.addEventListener('load', () => resolve());
        }
      });

      // Déclencher l'impression (l'utilisateur peut sauvegarder en PDF)
      printWindow.print();

      // 3. Mettre à jour le statut (sans URL de PDF pour l'instant)
      const { error: updateError } = await supabase
        .from('student_report_cards')
        .update({
          status: 'generated',
          edited_data: data as any,
        })
        .eq('id', reportCardId);

      if (updateError) throw updateError;

      return { pdfUrl: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Bulletin généré - Utilisez Ctrl+P / Cmd+P pour imprimer ou sauvegarder en PDF');
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
