import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, FileText, Download } from 'lucide-react';
import { useGenerateReportCard, useReportCards } from '@/hooks/useReportCards';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
  
  const queryClient = useQueryClient();
  const generateReportCard = useGenerateReportCard();
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

  // Récupérer les matières pour la classe sélectionnée
  const { data: subjects } = useQuery({
    queryKey: ['subjects', selectedClass, selectedSchoolYear, selectedSemester],
    queryFn: async () => {
      if (!selectedClass || !selectedSchoolYear || !selectedSemester) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('school_year', selectedSchoolYear)
        .eq('semester', selectedSemester);
      
      if (error) throw error;
      return data;
    },
    enabled: !!(selectedClass && selectedSchoolYear && selectedSemester),
  });

  // Récupérer les pondérations existantes
  const { data: existingWeights } = useQuery({
    queryKey: ['subject-weights', selectedClass, selectedSchoolYear, selectedSemester],
    queryFn: async () => {
      if (!selectedClass || !selectedSchoolYear || !selectedSemester) return [];
      
      const { data, error } = await supabase
        .from('subject_weights')
        .select('*, subjects(subject_name)')
        .eq('class_name', selectedClass)
        .eq('school_year', selectedSchoolYear)
        .eq('semester', selectedSemester);
      
      if (error) throw error;
      return data;
    },
    enabled: !!(selectedClass && selectedSchoolYear && selectedSemester),
  });

  // Récupérer les élèves de la classe
  const { data: students } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_name', selectedClass)
        .order('last_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
  });

  // Récupérer les bulletins déjà générés
  const { data: existingReportCards } = useReportCards({
    schoolYear: selectedSchoolYear,
    semester: selectedSemester,
  });

  // Sauvegarder les pondérations
  const saveWeightsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClass || !selectedSchoolYear || !selectedSemester) {
        throw new Error('Veuillez sélectionner une classe, une année et un semestre');
      }

      // Supprimer les pondérations existantes
      await supabase
        .from('subject_weights')
        .delete()
        .eq('class_name', selectedClass)
        .eq('school_year', selectedSchoolYear)
        .eq('semester', selectedSemester);

      // Insérer les nouvelles pondérations
      const { error } = await supabase
        .from('subject_weights')
        .insert(
          subjectWeights.map(sw => ({
            subject_id: sw.subject_id,
            class_name: selectedClass,
            school_year: selectedSchoolYear,
            semester: selectedSemester,
            weight: sw.weight,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-weights'] });
      toast.success('Pondérations sauvegardées');
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

  // Charger automatiquement les pondérations quand les matières sont disponibles
  useEffect(() => {
    if (subjects && subjects.length > 0 && subjectWeights.length === 0) {
      initializeWeights();
    }
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
                <Button
                  onClick={() => generateAllReportCards.mutate()}
                  disabled={generateAllReportCards.isPending || subjectWeights.length === 0}
                  size="lg"
                >
                  {generateAllReportCards.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Générer tous les bulletins
                    </>
                  )}
                </Button>
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
                            <TableCell>{student.class_name}</TableCell>
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
              <h3 className="text-lg font-semibold">Bulletins générés ({existingReportCards.length})</h3>
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
                          <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800">
                            {report.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
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
