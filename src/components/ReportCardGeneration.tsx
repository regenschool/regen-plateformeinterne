import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, FileText, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useGenerateReportCard, useReportCards } from '@/hooks/useReportCards';
import { useDeleteReportCard } from '@/hooks/useReportCardActions';
import { useBulkGeneratePDFs } from '@/hooks/useBulkReportCardGeneration';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReportCardPreview } from '@/components/settings/ReportCardPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface SubjectWeight {
  subject_id: string;
  subject_name: string;
  weight: number;
}

export const ReportCardGeneration = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [subjectWeights, setSubjectWeights] = useState<SubjectWeight[]>([]);
  
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  
  const queryClient = useQueryClient();
  const generateReportCard = useGenerateReportCard();
  const deleteReportCard = useDeleteReportCard();
  const bulkGeneratePDFs = useBulkGeneratePDFs();
  const navigate = useNavigate();
  // Récupérer les classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les années scolaires
  const { data: schoolYears } = useQuery({
    queryKey: ['school-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .eq('is_active', true)
        .order('label', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les matières pour la classe sélectionnée (Phase 4A: JOIN sur FK)
  const { data: subjects } = useQuery({
    queryKey: ['subjects', selectedClass, selectedSchoolYear, selectedSemester],
    queryFn: async () => {
      if (!selectedClass || !selectedSchoolYear || !selectedSemester) return [];
      
      // Récupérer les IDs de référentiels pour filtrage
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('label', selectedSchoolYear)
        .maybeSingle();
      
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('name', selectedClass)
        .maybeSingle();
      
      if (!schoolYearData || !classData) return [];
      
      const { data: academicPeriodData } = await supabase
        .from('academic_periods')
        .select('id')
        .eq('label', selectedSemester)
        .eq('school_year_id', schoolYearData.id)
        .maybeSingle();
      
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('class_fk_id', classData.id)
        .eq('school_year_fk_id', schoolYearData.id)
        .eq('academic_period_id', academicPeriodData?.id || null);
      
      if (error) throw error;
      return data;
    },
    enabled: !!(selectedClass && selectedSchoolYear && selectedSemester),
  });

  // Récupérer les pondérations existantes (Phase 4A: via subject_id)
  const { data: existingWeights } = useQuery({
    queryKey: ['subject-weights', selectedClass, selectedSchoolYear, selectedSemester],
    queryFn: async () => {
      if (!selectedClass || !selectedSchoolYear || !selectedSemester || !subjects) return [];
      
      const subjectIds = subjects.map(s => s.id);
      if (subjectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('subject_weights')
        .select('*, subjects(subject_name)')
        .in('subject_id', subjectIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!(selectedClass && selectedSchoolYear && selectedSemester && subjects && subjects.length > 0),
  });

  // Récupérer les élèves de la classe via enrollments
  const { data: students } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select('students(id, first_name, last_name, photo_url, age, birth_date, special_needs), classes!inner(name)')
        .eq('classes.name', selectedClass);
      
      if (error) throw error;
      return enrollments?.map(e => (e as any).students).filter(Boolean) || [];
    },
    enabled: !!selectedClass,
  });

  // Récupérer les bulletins déjà générés - FILTRÉ PAR CLASSE
  const { data: allReportCards } = useReportCards({
    schoolYear: selectedSchoolYear,
    semester: selectedSemester,
  });

  // Filtrer les bulletins par la classe sélectionnée
  const existingReportCards = allReportCards?.filter(
    rc => rc.class_name === selectedClass
  );

  // Récupérer le template par défaut pour l'aperçu
  const { data: defaultTemplate } = useQuery({
    queryKey: ['default-report-card-template'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_card_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Sauvegarder les pondérations (Phase 4A: subject_id uniquement)
  const saveWeightsMutation = useMutation({
    mutationFn: async () => {
      if (!subjectWeights || subjectWeights.length === 0) {
        throw new Error('Aucune pondération à sauvegarder');
      }

      // Supprimer les pondérations existantes pour ces subjects
      const subjectIds = subjectWeights.map(sw => sw.subject_id);
      await supabase
        .from('subject_weights')
        .delete()
        .in('subject_id', subjectIds);

      // Insérer les nouvelles pondérations (uniquement subject_id et weight, as any pour compatibilité)
      const { error } = await supabase
        .from('subject_weights')
        .insert(
          subjectWeights.map(sw => ({
            subject_id: sw.subject_id,
            weight: sw.weight,
          }) as any)
        );

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux coefficients
      queryClient.invalidateQueries({ queryKey: ['subject-weights'] });
      queryClient.invalidateQueries({ queryKey: ['class-subject-stats'] });
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Pondérations sauvegardées - régénérez les brouillons pour appliquer les changements');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la sauvegarde des pondérations');
      console.error(error);
    },
  });

  // Générer les bulletins pour toute la classe
  const generateAllReportCards = useMutation({
    mutationFn: async () => {
      if (!students || students.length === 0) {
        throw new Error('Aucun élève dans cette classe');
      }

      const results = [];
      for (const student of students) {
        try {
          const result = await generateReportCard.mutateAsync({
            studentId: student.id,
            schoolYear: selectedSchoolYear,
            semester: selectedSemester,
            className: selectedClass,
          });
          results.push(result);
        } catch (error) {
          console.error(`Erreur pour ${student.first_name} ${student.last_name}:`, error);
        }
      }

      return results;
    },
    onSuccess: () => {
      toast.success('Bulletins générés avec succès');
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la génération des bulletins');
      console.error(error);
    },
  });

  // Mutation pour supprimer tous les bulletins d'un semestre/classe
  const deleteBulkReportCards = useMutation({
    mutationFn: async ({ filters }: { filters: { schoolYear?: string; semester?: string; className?: string } }) => {
      let query = supabase.from('student_report_cards').delete();
      
      if (filters.schoolYear) query = query.eq('school_year', filters.schoolYear);
      if (filters.semester) query = query.eq('semester', filters.semester);
      if (filters.className) query = query.eq('class_name', filters.className);
      
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Bulletins supprimés avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression des bulletins');
    },
  });

  // Initialiser les pondérations quand les matières changent
  const initializeWeights = () => {
    if (!subjects) return;
    
    const weights: SubjectWeight[] = subjects.map(subject => {
      const existingWeight = existingWeights?.find(w => w.subject_id === subject.id);
      return {
        subject_id: subject.id,
        subject_name: subject.subject_name,
        weight: existingWeight?.weight || 1,
      };
    });
    
    setSubjectWeights(weights);
  };

  // Réinitialiser les pondérations quand les filtres changent
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      initializeWeights();
    } else {
      setSubjectWeights([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, existingWeights]);

  // Mettre à jour une pondération
  const updateWeight = (subjectId: string, weight: number) => {
    setSubjectWeights(prev =>
      prev.map(sw =>
        sw.subject_id === subjectId ? { ...sw, weight } : sw
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Génération de Bulletins</CardTitle>
          <CardDescription>
            Configurez les paramètres et générez les bulletins pour une classe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection des paramètres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Année scolaire</Label>
              <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears?.map((year) => (
                    <SelectItem key={year.id} value={year.label}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semestre 1">Semestre 1</SelectItem>
                  <SelectItem value="Semestre 2">Semestre 2</SelectItem>
                  <SelectItem value="Annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerte si aucune matière pour les filtres sélectionnés */}
          {selectedClass && selectedSchoolYear && selectedSemester && subjects && subjects.length === 0 && (
            <Alert>
              <AlertTitle>Aucune matière trouvée</AlertTitle>
              <AlertDescription>
                Aucune matière n’a été définie pour cette classe ({selectedClass}), cette année ({selectedSchoolYear}) et ce semestre ({selectedSemester}).
                Ajoutez d’abord les matières pour pouvoir configurer les coefficients.
              </AlertDescription>
              <div className="mt-3">
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  Gérer les matières
                </Button>
              </div>
            </Alert>
          )}

          {/* Configuration des pondérations */}
          {subjects && subjects.length > 0 && subjectWeights.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pondérations des matières</h3>
                <p className="text-sm text-muted-foreground">
                  Configurez les coefficients pour chaque matière
                </p>
              </div>

              <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matière</TableHead>
                        <TableHead className="w-32">Coefficient</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectWeights.map((sw) => (
                        <TableRow key={sw.subject_id}>
                          <TableCell className="font-medium">{sw.subject_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={sw.weight}
                              onChange={(e) => updateWeight(sw.subject_id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Button
                    onClick={() => saveWeightsMutation.mutate()}
                    disabled={saveWeightsMutation.isPending}
                  >
                    {saveWeightsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder les pondérations
                  </Button>
              </>
            </div>
          )}


          {/* Génération des bulletins */}
          {selectedClass && selectedSchoolYear && selectedSemester && students && subjects && subjects.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Génération des bulletins</h3>
                  <p className="text-sm text-muted-foreground">
                    {students.length} élève{students.length > 1 ? 's' : ''} dans cette classe
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {defaultTemplate && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="lg">
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu du modèle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Aperçu du bulletin - {defaultTemplate.name}</DialogTitle>
                        </DialogHeader>
                        <ReportCardPreview template={defaultTemplate} />
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    onClick={() => generateAllReportCards.mutate()}
                    disabled={generateAllReportCards.isPending || subjectWeights.length === 0}
                    size="lg"
                    variant="secondary"
                  >
                    {generateAllReportCards.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Créer brouillons en masse
                      </>
                    )}
                  </Button>
                  {existingReportCards && existingReportCards.some(r => r.status === 'draft') && (
                    <Button
                      onClick={() => {
                        const draftIds = existingReportCards
                          .filter(r => r.status === 'draft' && r.school_year === selectedSchoolYear && r.semester === selectedSemester)
                          .map(r => r.id);
                        
                        bulkGeneratePDFs.mutate({
                          reportCardIds: draftIds,
                          onProgress: (current, total) => {
                            setBulkGenerationProgress({ current, total });
                          },
                        }, {
                          onSettled: () => {
                            setBulkGenerationProgress(null);
                          },
                        });
                      }}
                      disabled={bulkGeneratePDFs.isPending}
                      size="lg"
                    >
                      {bulkGeneratePDFs.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {bulkGenerationProgress 
                            ? `Génération ${bulkGenerationProgress.current}/${bulkGenerationProgress.total}...`
                            : 'Génération PDFs...'
                          }
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Générer PDFs des brouillons
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {subjectWeights.length === 0 && (
                <p className="text-sm text-amber-600">
                  ⚠️ Veuillez d'abord configurer et sauvegarder les pondérations des matières
                </p>
              )}

              {/* Liste des étudiants avec génération individuelle */}
              {subjectWeights.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3">Génération individuelle</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const existingReport = existingReportCards?.find(
                          r => r.student_id === student.id && 
                               r.school_year === selectedSchoolYear && 
                               r.semester === selectedSemester
                        );
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.first_name} {student.last_name}
                            </TableCell>
                            <TableCell>{(student as any).class?.name || '-'}</TableCell>
                            <TableCell>
                              {existingReport ? (
                                <Badge variant="secondary">
                                  Généré le {new Date(existingReport.created_at).toLocaleDateString('fr-FR')}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Non généré</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {existingReport && existingReport.status === 'draft' ? (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => navigate(`/bulletins/edit/${existingReport.id}`)}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Éditer le brouillon
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant={existingReport ? "outline" : "default"}
                                  onClick={() => generateReportCard.mutate({
                                    studentId: student.id,
                                    schoolYear: selectedSchoolYear,
                                    semester: selectedSemester,
                                    className: selectedClass,
                                  })}
                                  disabled={generateReportCard.isPending}
                                >
                                  {generateReportCard.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <FileText className="mr-2 h-4 w-4" />
                                      {existingReport ? 'Créer nouveau brouillon' : 'Créer brouillon'}
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Liste des bulletins générés */}
          {existingReportCards && existingReportCards.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bulletins générés ({existingReportCards.length})</h3>
                <div className="flex gap-2">
                  {selectedClass && selectedSchoolYear && selectedSemester && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer tous ({existingReportCards.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Confirmer la suppression en masse
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div>
                              <p>Vous êtes sur le point de supprimer <strong>{existingReportCards.length} bulletin(s)</strong> pour :</p>
                              <div className="mt-2 p-3 bg-muted rounded-md space-y-1">
                                <div><strong>Année :</strong> {selectedSchoolYear}</div>
                                <div><strong>Semestre :</strong> {selectedSemester}</div>
                                <div><strong>Classe :</strong> {selectedClass}</div>
                              </div>
                              <div className="mt-3 text-destructive font-medium">
                                Cette action est irréversible.
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBulkReportCards.mutate({
                              filters: {
                                schoolYear: selectedSchoolYear,
                                semester: selectedSemester,
                                className: selectedClass,
                              }
                            })}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Supprimer tous
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Date de génération</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingReportCards.map((report) => {
                    const data = report.generated_data as any;
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {data?.student?.firstName} {data?.student?.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                         <TableCell>
                           {report.status === 'draft' ? (
                             <Badge variant="outline">Brouillon</Badge>
                           ) : (
                             <Badge variant="default">PDF généré</Badge>
                           )}
                         </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {report.pdf_url && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(report.pdf_url!, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {report.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/bulletins/edit/${report.id}`)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Éditer
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReportCard.mutate(report.id)}
                              disabled={deleteReportCard.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
