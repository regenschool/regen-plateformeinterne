import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { syncExistingDataToReferentials } from '@/utils/syncReferentials';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const SyncReferentialsButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const result = await syncExistingDataToReferentials();
      
      if (result.success) {
        // Invalidate caches to reflect latest backend state immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['school_years'] }),
          queryClient.invalidateQueries({ queryKey: ['classes_referential'] }),
          queryClient.invalidateQueries({ queryKey: ['levels'] }),
          queryClient.invalidateQueries({ queryKey: ['classes'] }),
          queryClient.invalidateQueries({ queryKey: ['subjects'] }),
          queryClient.invalidateQueries({ queryKey: ['students'] }),
        ]);

        toast.success(
          `Synchronisation réussie ! ${result.stats.classesAdded} classes, ${result.stats.yearsAdded} années, ${result.stats.levelsAdded} niveaux, ${result.stats.periodsAdded} périodes ajoutées.`,
          { duration: 5000 }
        );
      }
    } catch (error: any) {
      toast.error(`Erreur lors de la synchronisation: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Synchroniser les données
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Synchroniser les référentiels</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Cette action va analyser toutes les données existantes (étudiants, notes, matières)
                et créer automatiquement les entrées manquantes dans les référentiels :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Classes trouvées dans le Directory et les notes</li>
                <li>Années scolaires mentionnées dans les notes et matières</li>
                <li>Périodes académiques (semestres) utilisées</li>
              </ul>
              <p className="text-sm font-medium mt-3">
                L'année scolaire 2025-2026 sera activée par défaut.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
