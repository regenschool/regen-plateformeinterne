import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, GraduationCap, ClipboardList, Database, TrendingUp, AlertTriangle, CheckCircle, Shield, HardDrive, Download, Calendar, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AppStats = {
  totalUsers: number;
  totalStudents: number;
  totalGrades: number;
  totalSubjects: number;
  activeSchoolYears: number;
  auditLogsCount: number;
  storageUsedMB: number;
};

type HealthMetric = {
  name: string;
  value: number;
  max: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
};

export default function Quality() {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<AppStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalGrades: 0,
    totalSubjects: 0,
    activeSchoolYears: 0,
    auditLogsCount: 0,
    storageUsedMB: 0,
  });
  const [loading, setLoading] = useState(true);
  const [webVitals, setWebVitals] = useState<{ lcp: number; cls: number; inp: number }>({
    lcp: 0,
    cls: 0,
    inp: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [auditLogsRetention, setAuditLogsRetention] = useState<number>(7); // jours
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      loadWebVitals();
      
      // Recharger les métriques toutes les 30 secondes
      const interval = setInterval(() => {
        fetchStats();
        loadWebVitals();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Compter les utilisateurs UNIQUES (via user_roles)
      const { data: uniqueUsers } = await supabase
        .from('user_roles')
        .select('user_id');
      
      const usersCount = uniqueUsers 
        ? new Set(uniqueUsers.map(u => u.user_id)).size 
        : 0;

      // Compter les étudiants
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Compter les notes
      const { count: gradesCount } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true });

      // Compter les matières
      const { count: subjectsCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });

      // Compter les années scolaires actives
      const { count: activeYearsCount } = await supabase
        .from('school_years')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Compter les logs d'audit (selon la rétention configurée)
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - auditLogsRetention);
      const { count: auditCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', retentionDate.toISOString());

      // Calculer l'espace de stockage utilisé
      const { data: buckets } = await supabase.storage.listBuckets();
      let totalSize = 0;
      
      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await supabase.storage.from(bucket.name).list();
          if (files) {
            totalSize += files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
          }
        }
      }

      setStats({
        totalUsers: usersCount || 0,
        totalStudents: studentsCount || 0,
        totalGrades: gradesCount || 0,
        totalSubjects: subjectsCount || 0,
        activeSchoolYears: activeYearsCount || 0,
        auditLogsCount: auditCount || 0,
        storageUsedMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebVitals = () => {
    // Charger les vrais Web Vitals depuis reportWebVitals
    // Ils sont mis à jour en temps réel par l'app
    const stored = localStorage.getItem('web-vitals');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setWebVitals({
          lcp: parsed.lcp || 0,
          cls: parsed.cls || 0,
          inp: parsed.inp || 0
        });
      } catch (e) {
        // Valeurs par défaut si parsing échoue
        setWebVitals({ lcp: 0, cls: 0, inp: 0 });
      }
    } else {
      // Pas encore de données - valeurs nulles
      setWebVitals({ lcp: 0, cls: 0, inp: 0 });
    }
  };

  const getHealthMetrics = (): HealthMetric[] => {
    const metrics: HealthMetric[] = [];

    // 1. Performance LCP (si disponible)
    if (webVitals.lcp > 0) {
      metrics.push({
        name: 'Performance (LCP)',
        value: webVitals.lcp,
        max: 4,
        status: webVitals.lcp < 2.5 ? 'good' : webVitals.lcp < 4 ? 'warning' : 'critical',
        description: 'Temps de chargement principal (doit être < 2.5s)',
      });
    }

    // 2. Stabilité Visuelle CLS (si disponible)
    if (webVitals.cls >= 0) {
      metrics.push({
        name: 'Stabilité Visuelle (CLS)',
        value: webVitals.cls,
        max: 0.25,
        status: webVitals.cls < 0.1 ? 'good' : webVitals.cls < 0.25 ? 'warning' : 'critical',
        description: 'Décalages visuels (doit être < 0.1)',
      });
    }

    // 3. Réactivité INP (si disponible)
    if (webVitals.inp > 0) {
      metrics.push({
        name: 'Réactivité (INP)',
        value: webVitals.inp,
        max: 500,
        status: webVitals.inp < 200 ? 'good' : webVitals.inp < 500 ? 'warning' : 'critical',
        description: 'Temps de réponse aux interactions (doit être < 200ms)',
      });
    }

    // 4. Volume de données (toujours disponible)
    const dataVolume = stats.totalStudents + stats.totalGrades;
    metrics.push({
      name: 'Volume de Données',
      value: dataVolume,
      max: 10000,
      status: dataVolume < 5000 ? 'good' : dataVolume < 8000 ? 'warning' : 'critical',
      description: `${stats.totalStudents} étudiants, ${stats.totalGrades} notes`,
    });

    // 5. Utilisateurs actifs (toujours disponible)
    metrics.push({
      name: 'Utilisateurs Actifs',
      value: stats.totalUsers,
      max: 100,
      status: stats.totalUsers > 0 ? 'good' : 'warning',
      description: `${stats.totalUsers} comptes utilisateurs`,
    });

    // 6. Stockage (toujours disponible)
    metrics.push({
      name: 'Stockage Utilisé',
      value: stats.storageUsedMB,
      max: 1000,
      status: stats.storageUsedMB < 500 ? 'good' : stats.storageUsedMB < 800 ? 'warning' : 'critical',
      description: `${stats.storageUsedMB} MB sur disque`,
    });

    return metrics;
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100 border-green-300';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      
      // Exporter toutes les tables critiques
      const backupData: Record<string, any> = {
        students: [],
        grades: [],
        subjects: [],
        teachers: [],
        school_years: [],
        academic_periods: [],
        classes: []
      };

      // Récupérer les données de chaque table
      const { data: studentsData } = await supabase.from('students').select('*');
      const { data: gradesData } = await supabase.from('grades').select('*');
      const { data: subjectsData } = await supabase.from('subjects').select('*');
      const { data: teachersData } = await supabase.from('teachers').select('*');
      const { data: yearsData } = await supabase.from('school_years').select('*');
      const { data: periodsData } = await supabase.from('academic_periods').select('*');
      const { data: classesData } = await supabase.from('classes').select('*');

      backupData.students = studentsData || [];
      backupData.grades = gradesData || [];
      backupData.subjects = subjectsData || [];
      backupData.teachers = teachersData || [];
      backupData.school_years = yearsData || [];
      backupData.academic_periods = periodsData || [];
      backupData.classes = classesData || [];

      // Créer un fichier JSON
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Télécharger
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Sauvegarde exportée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export de la sauvegarde');
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewHistoricalState = async (date: Date) => {
    try {
      setSelectedDate(date);
      
      // Récupérer les statistiques à la date sélectionnée via audit_logs
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { count: auditCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', endOfDay.toISOString());

      toast.success(`État au ${format(date, 'dd/MM/yyyy', { locale: fr })} : ${auditCount} actions enregistrées`);
      
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      toast.error('Erreur lors de la récupération de l\'état historique');
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  const healthMetrics = getHealthMetrics();
  const overallHealth = healthMetrics.filter(m => m.status === 'good').length / healthMetrics.length * 100;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Qualité & Performance</h1>
              <p className="text-muted-foreground mt-1">
                Surveillez la santé de votre application en temps réel
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              fetchStats();
              loadWebVitals();
              toast.success('Métriques actualisées');
            }}
            variant="outline"
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Score Global */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">État Global de l'Application</CardTitle>
              <CardDescription>
                Score de santé basé sur {healthMetrics.length} métriques clés
                {webVitals.lcp === 0 && webVitals.cls === 0 && webVitals.inp === 0 && (
                  <span className="block mt-1 text-xs text-yellow-600">
                    ⚠️ Web Vitals en cours de collecte - naviguez dans l'app pour générer des données
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">{Math.round(overallHealth)}%</div>
              <Badge variant={overallHealth > 75 ? 'default' : overallHealth > 50 ? 'secondary' : 'destructive'} className="mt-2">
                {overallHealth > 75 ? 'Excellent' : overallHealth > 50 ? 'Correct' : 'Attention'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {healthMetrics.filter(m => m.status === 'good').length}/{healthMetrics.length} OK
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallHealth} className="h-3" />
        </CardContent>
      </Card>

      {/* Statistiques de l'App */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Comptes actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Inscrits dans la base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalGrades}</div>
            <p className="text-xs text-muted-foreground mt-1">Évaluations enregistrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Matières</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Matières configurées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Années Actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeSchoolYears}</div>
            <p className="text-xs text-muted-foreground mt-1">Années scolaires en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activité ({auditLogsRetention}j)</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.auditLogsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Actions dans l'audit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stockage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.storageUsedMB} MB</div>
            <p className="text-xs text-muted-foreground mt-1">Espace utilisé</p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de Santé */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques de Performance</CardTitle>
          <CardDescription>Indicateurs clés de santé technique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthMetrics.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full p-1 border ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
                <Badge variant={metric.status === 'good' ? 'default' : 'secondary'}>
                  {metric.name.includes('CLS') ? metric.value.toFixed(2) : metric.value < 1 ? (metric.value * 100).toFixed(2) : metric.value.toFixed(0)}
                  {metric.name.includes('CLS') ? '' : metric.name.includes('ms') ? 'ms' : metric.name.includes('LCP') ? 's' : ''}
                </Badge>
              </div>
              <Progress value={(metric.value / metric.max) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sauvegardes & Historique */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sauvegardes & Historique
          </CardTitle>
          <CardDescription>Gestion des sauvegardes et consultation de l'historique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Backup */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Export de Sauvegarde</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Téléchargez une copie complète de toutes vos données (étudiants, notes, matières, etc.)
              </p>
            </div>
            <Button 
              onClick={handleExportBackup} 
              disabled={isExporting}
              className="ml-4"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </div>

          {/* Voir l'historique */}
          <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium text-purple-900 dark:text-purple-100">État Historique</h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Consultez l'état de votre base de données à une date précise
              </p>
              {selectedDate && (
                <Badge variant="secondary" className="mt-2">
                  Dernière consultation : {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
                </Badge>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Choisir une date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && handleViewHistoricalState(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Configuration rétention */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Rétention des Logs d'Audit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actuellement configuré sur {auditLogsRetention} jours
                </p>
              </div>
              <div className="flex gap-2">
                {[7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    size="sm"
                    variant={auditLogsRetention === days ? "default" : "outline"}
                    onClick={() => {
                      setAuditLogsRetention(days);
                      fetchStats();
                    }}
                  >
                    {days}j
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              💡 Plus la rétention est longue, plus vous pourrez remonter loin dans l'historique
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Guide de Maintenance */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Guide de Maintenance Rapide</CardTitle>
          <CardDescription>Actions recommandées pour maintenir l'application en bonne santé</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Hebdomadaire</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  • Vérifier le Journal d'Audit pour détecter les anomalies<br />
                  • Consulter cette page Qualité pour surveiller les métriques<br />
                  • S'assurer qu'aucune métrique n'est en rouge
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Mensuel</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  • Vérifier l'espace de stockage utilisé<br />
                  • Nettoyer les anciennes années scolaires archivées<br />
                  • Exporter une sauvegarde des données importantes
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">En cas de Problème</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Si une métrique passe au rouge :<br />
                  • Contactez votre développeur avec une capture d'écran<br />
                  • Consultez le Journal d'Audit pour identifier la cause<br />
                  • En urgence, utilisez la fonction de rollback (historique)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
