import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSchoolYears } from "@/hooks/useReferentials";
import { useClassMutations } from "@/hooks/useReferentialMutations";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useYearTransition, type ClassMapping } from "@/hooks/useYearTransition";
import { ArrowRight, Calendar, Users, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function YearTransition() {
  const [sourceYearId, setSourceYearId] = useState("");
  const [targetYearId, setTargetYearId] = useState("");
  const [mappings, setMappings] = useState<ClassMapping[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState("");
  const [newClassCapacity, setNewClassCapacity] = useState("");

  const { data: schoolYears } = useSchoolYears();
  const { data: sourceEnrollments = [] } = useEnrollments({ schoolYearId: sourceYearId });
  const transitionMutation = useYearTransition();
  const { add: addClassMutation } = useClassMutations();

  // Classes disponibles (tous les niveaux)
  const [allClasses, setAllClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('id, name').eq('is_active', true).order('name');
      if (!error && data) setAllClasses(data);
    };
    fetchClasses();
  }, []);

  // Auto-sélection des années
  useEffect(() => {
    if (schoolYears?.length && !sourceYearId) {
      const activeYear = schoolYears.find(y => y.is_active);
      if (activeYear) {
        setSourceYearId(activeYear.id);
        
        // Suggérer l'année suivante si elle existe
        const nextYear = schoolYears.find(y => 
          parseInt(y.label.split('-')[0]) === parseInt(activeYear.label.split('-')[0]) + 1
        );
        if (nextYear) setTargetYearId(nextYear.id);
      }
    }
  }, [schoolYears, sourceYearId]);

  // Grouper les inscriptions par classe
  const classesBySource = useMemo(() => {
    const grouped = new Map<string, { classId: string; className: string; count: number }>();
    
    sourceEnrollments.forEach(enrollment => {
      const classId = enrollment.class_id || '';
      const className = enrollment.class_name_from_ref || enrollment.class_name || '';
      
      if (!grouped.has(classId)) {
        grouped.set(classId, { classId, className, count: 0 });
      }
      grouped.get(classId)!.count++;
    });
    
    return Array.from(grouped.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [sourceEnrollments]);

  // Initialiser les mappings quand les classes sources changent
  useEffect(() => {
    if (classesBySource.length > 0 && mappings.length === 0) {
      const initialMappings = classesBySource.map(cls => ({
        sourceClassId: cls.classId,
        sourceClassName: cls.className,
        targetClassId: '',
        targetClassName: '',
        studentCount: cls.count,
      }));
      setMappings(initialMappings);
    }
  }, [classesBySource, mappings.length]);

  const handleMappingChange = (sourceClassId: string, targetClassId: string) => {
    const targetClass = allClasses.find(c => c.id === targetClassId);
    
    setMappings(prev => prev.map(m => 
      m.sourceClassId === sourceClassId 
        ? { ...m, targetClassId, targetClassName: targetClass?.name || '' }
        : m
    ));
  };

  const handlePreview = () => {
    // Filtrer uniquement les mappings configurés
    const completeMappings = mappings.filter(m => m.targetClassId);
    
    if (completeMappings.length === 0) {
      toast.error('Aucune classe configurée', {
        description: 'Veuillez configurer au moins une classe de destination'
      });
      return;
    }

    setPreviewData(completeMappings);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    const completeMappings = mappings.filter(m => m.targetClassId);
    
    await transitionMutation.mutateAsync({
      sourceSchoolYearId: sourceYearId,
      targetSchoolYearId: targetYearId,
      mappings: completeMappings,
    });
    setShowConfirmDialog(false);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error('Le nom de la classe est requis');
      return;
    }

    try {
      await addClassMutation.mutateAsync({
        name: newClassName.trim(),
        level: newClassLevel.trim() || null,
        capacity: newClassCapacity ? parseInt(newClassCapacity) : null,
        is_active: true,
      });

      // Recharger les classes
      await fetchClasses();
      
      toast.success(`✅ Classe "${newClassName}" créée`);
      setShowCreateClassDialog(false);
      setNewClassName("");
      setNewClassLevel("");
      setNewClassCapacity("");
    } catch (error: any) {
      toast.error('Erreur : ' + error.message);
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase.from('classes').select('id, name').eq('is_active', true).order('name');
    if (!error && data) setAllClasses(data);
  };

  const totalStudents = useMemo(() => 
    mappings.filter(m => m.targetClassId).reduce((sum, m) => sum + m.studentCount, 0), 
    [mappings]
  );

  const hasCompleteMappings = mappings.some(m => m.targetClassId);
  const sourceYear = schoolYears?.find(y => y.id === sourceYearId);
  const targetYear = schoolYears?.find(y => y.id === targetYearId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Passage d'Année Scolaire</h1>
            <p className="text-muted-foreground">
              Transférez vos étudiants vers la nouvelle année en quelques clics
            </p>
          </div>
        </div>
      </div>

      {/* Sélection des années */}
      <Card className="border-2 hover:border-primary/20 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle>Années Scolaires</CardTitle>
          </div>
          <CardDescription>
            Sélectionnez l'année source et l'année de destination
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Année source</label>
              <Select value={sourceYearId} onValueChange={setSourceYearId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner l'année source" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears?.map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      <div className="flex items-center gap-2">
                        {year.label}
                        {year.is_active && <Badge variant="default" className="text-xs">Active</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Année cible</label>
              <Select value={targetYearId} onValueChange={setTargetYearId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner l'année cible" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears?.filter(y => y.id !== sourceYearId).map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      <div className="flex items-center gap-2">
                        {year.label}
                        {year.is_active && <Badge variant="default" className="text-xs">Active</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sourceYear && targetYear && (
            <Alert className="bg-primary/5 border-primary/20">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <AlertDescription>
                <strong>{sourceYear.label}</strong> → <strong>{targetYear.label}</strong>
                <span className="ml-2 text-muted-foreground">
                  ({totalStudents} étudiant{totalStudents > 1 ? 's' : ''})
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Mappings */}
      {sourceYearId && targetYearId && (
        <Card className="border-2 hover:border-primary/20 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <CardTitle>Configuration des Passages</CardTitle>
            </div>
            <CardDescription>
              Associez chaque classe source à sa classe de destination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mappings.length === 0 ? (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Aucun étudiant trouvé pour l'année {sourceYear?.label}
                </AlertDescription>
              </Alert>
            ) : (
              mappings.map((mapping, idx) => (
                <div 
                  key={mapping.sourceClassId}
                  className="group p-4 rounded-lg border bg-card hover:bg-accent/5 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Classe source */}
                    <div className="flex-1">
                      <div className="font-medium text-sm text-muted-foreground mb-1">
                        Classe actuelle
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                          {mapping.sourceClassName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {mapping.studentCount}
                        </span>
                      </div>
                    </div>

                    {/* Flèche */}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />

                    {/* Classe cible */}
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-muted-foreground mb-1">
                          Classe de destination
                        </div>
                        <Select 
                          value={mapping.targetClassId} 
                          onValueChange={(value) => handleMappingChange(mapping.sourceClassId, value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allClasses.map(cls => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => setShowCreateClassDialog(true)}
                          title="Créer une nouvelle classe"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {mappings.length > 0 && (
        <div className="flex justify-between items-center gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
          <div className="text-sm text-muted-foreground">
            {mappings.filter(m => m.targetClassId).length} / {mappings.length} classe(s) configurée(s)
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setMappings([])}
              disabled={transitionMutation.isPending}
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!hasCompleteMappings || transitionMutation.isPending}
              className="min-w-[200px] gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Prévisualiser ({mappings.filter(m => m.targetClassId).length})
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Confirmer le Passage d'Année
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Vous êtes sur le point de transférer <strong>{totalStudents} étudiant{totalStudents > 1 ? 's' : ''}</strong> de 
                <strong> {sourceYear?.label}</strong> vers <strong>{targetYear?.label}</strong>.
              </p>
              
              <Separator />
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {previewData.map((mapping, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-md bg-accent/50"
                  >
                    <span className="font-medium">{mapping.sourceClassName}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{mapping.targetClassName}</span>
                    <Badge variant="secondary">{mapping.studentCount} étudiant{mapping.studentCount > 1 ? 's' : ''}</Badge>
                  </div>
                ))}
              </div>
              
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-600">
                  <strong>Important :</strong> Cette action créera de nouvelles inscriptions. 
                  Les anciennes resteront archivées.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transitionMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={transitionMutation.isPending}
              className="gap-2"
            >
              {transitionMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Valider le passage
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog création de classe */}
      <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Créer une Nouvelle Classe
            </DialogTitle>
            <DialogDescription>
              Cette classe sera disponible immédiatement dans les référentiels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-class-name">Nom de la classe *</Label>
              <Input
                id="new-class-name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="M2B, Alumni, etc."
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="new-class-level">Niveau (optionnel)</Label>
              <Input
                id="new-class-level"
                value={newClassLevel}
                onChange={(e) => setNewClassLevel(e.target.value)}
                placeholder="Master, Bachelor, etc."
              />
            </div>
            <div>
              <Label htmlFor="new-class-capacity">Capacité (optionnel)</Label>
              <Input
                id="new-class-capacity"
                type="number"
                value={newClassCapacity}
                onChange={(e) => setNewClassCapacity(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateClassDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateClass}
                disabled={addClassMutation.isPending}
                className="flex-1 gap-2"
              >
                {addClassMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
