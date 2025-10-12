import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SchoolYear = {
  id: string;
  label: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  student_count?: number;
  grade_count?: number;
};

export default function ArchiveManager() {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const fetchSchoolYears = async () => {
    try {
      const { data: years, error } = await supabase
        .from('school_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Enrichir avec le nombre d'étudiants et notes
      const enrichedYears = await Promise.all(
        (years || []).map(async (year) => {
          const { count: studentCount } = await supabase
            .from('student_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('school_year_id', year.id);

          const { count: gradeCount } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('school_year', year.label);

          return {
            ...year,
            student_count: studentCount || 0,
            grade_count: gradeCount || 0,
          };
        })
      );

      setSchoolYears(enrichedYears);
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
      toast.error('Impossible de charger les années scolaires');
    }
  };

  const handleArchiveClick = (year: SchoolYear) => {
    setSelectedYear(year);
    setShowConfirmDialog(true);
  };

  const handleArchive = async () => {
    if (!selectedYear) return;

    setIsArchiving(true);
    try {
      // 1. Exporter les données de l'année avant archivage
      const { data: students } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('school_year_id', selectedYear.id);

      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('school_year', selectedYear.label);

      const archiveData = {
        school_year: selectedYear,
        students,
        grades,
        archived_at: new Date().toISOString(),
      };

      // Télécharger l'archive
      const blob = new Blob([JSON.stringify(archiveData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archive_${selectedYear.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 2. Désactiver l'année scolaire
      const { error: updateError } = await supabase
        .from('school_years')
        .update({ is_active: false })
        .eq('id', selectedYear.id);

      if (updateError) throw updateError;

      toast.success(
        `Année ${selectedYear.label} archivée avec succès ! Le fichier d'archive a été téléchargé.`
      );
      
      setShowConfirmDialog(false);
      setSelectedYear(null);
      fetchSchoolYears();
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      toast.error('Erreur lors de l\'archivage de l\'année scolaire');
    } finally {
      setIsArchiving(false);
    }
  };

  const getYearStatus = (year: SchoolYear) => {
    if (year.is_active) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Archivée</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            <CardTitle>Archivage des Années Scolaires</CardTitle>
          </div>
          <CardDescription>
            Archivez les anciennes années pour optimiser les performances. Un fichier de sauvegarde sera automatiquement téléchargé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schoolYears.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune année scolaire trouvée
            </p>
          ) : (
            schoolYears.map((year) => (
              <div
                key={year.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{year.label}</h3>
                    {getYearStatus(year)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      📅 {new Date(year.start_date).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(year.end_date).toLocaleDateString('fr-FR')}
                    </p>
                    <p>
                      👥 {year.student_count} inscriptions • 📝 {year.grade_count} notes
                    </p>
                  </div>
                </div>

                {year.is_active && (
                  <Button
                    variant="outline"
                    onClick={() => handleArchiveClick(year)}
                    disabled={isArchiving}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </Button>
                )}

                {!year.is_active && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Archivée
                  </div>
                )}
              </div>
            ))
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Important :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>L'archivage télécharge automatiquement une copie de sauvegarde</li>
                  <li>Les données archivées restent dans la base mais sont marquées comme inactives</li>
                  <li>Vous pouvez toujours consulter les données archivées si besoin</li>
                  <li>Conservez précieusement les fichiers téléchargés</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'archivage</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'archiver l'année scolaire{' '}
              <strong>{selectedYear?.label}</strong>.
              <br />
              <br />
              Un fichier de sauvegarde contenant :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{selectedYear?.student_count} inscriptions d'étudiants</li>
                <li>{selectedYear?.grade_count} notes</li>
              </ul>
              <br />
              sera automatiquement téléchargé sur votre ordinateur.
              <br />
              <br />
              <strong>Cette action est réversible</strong> mais il est recommandé de conserver
              le fichier de sauvegarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Archivage...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Archiver et télécharger
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
