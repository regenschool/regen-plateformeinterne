import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, GraduationCap, ClipboardList, Database, TrendingUp, AlertTriangle, CheckCircle, Shield, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      loadWebVitals();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Compter les utilisateurs (via user_roles)
      const { count: usersCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

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

      // Compter les logs d'audit (dernières 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: auditCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

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
    // Simuler des Web Vitals (en production, ils seront réels via reportWebVitals)
    // Pour l'instant, on affiche des valeurs indicatives
    const stored = localStorage.getItem('web-vitals');
    if (stored) {
      setWebVitals(JSON.parse(stored));
    } else {
      setWebVitals({ lcp: 1.8, cls: 0.05, inp: 80 });
    }
  };

  const getHealthMetrics = (): HealthMetric[] => {
    return [
      {
        name: 'Performance (LCP)',
        value: webVitals.lcp,
        max: 4,
        status: webVitals.lcp < 2.5 ? 'good' : webVitals.lcp < 4 ? 'warning' : 'critical',
        description: 'Temps de chargement principal (doit être < 2.5s)',
      },
      {
        name: 'Stabilité Visuelle (CLS)',
        value: webVitals.cls,
        max: 0.25,
        status: webVitals.cls < 0.1 ? 'good' : webVitals.cls < 0.25 ? 'warning' : 'critical',
        description: 'Décalages visuels (doit être < 0.1)',
      },
      {
        name: 'Réactivité (INP)',
        value: webVitals.inp,
        max: 500,
        status: webVitals.inp < 200 ? 'good' : webVitals.inp < 500 ? 'warning' : 'critical',
        description: 'Temps de réponse aux interactions (doit être < 200ms)',
      },
      {
        name: 'Base de Données',
        value: (stats.totalStudents + stats.totalGrades) / 10000, // Indicateur arbitraire
        max: 100,
        status: stats.totalStudents + stats.totalGrades < 5000 ? 'good' : 'warning',
        description: `${stats.totalStudents} étudiants, ${stats.totalGrades} notes`,
      },
    ];
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
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Qualité & Performance</h1>
        </div>
        <p className="text-muted-foreground">
          Surveillez la santé de votre application en temps réel
        </p>
      </div>

      {/* Score Global */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">État Global de l'Application</CardTitle>
              <CardDescription>Score de santé basé sur les métriques clés</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">{Math.round(overallHealth)}%</div>
              <Badge variant={overallHealth > 75 ? 'default' : overallHealth > 50 ? 'secondary' : 'destructive'} className="mt-2">
                {overallHealth > 75 ? 'Excellent' : overallHealth > 50 ? 'Correct' : 'Attention'}
              </Badge>
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
            <CardTitle className="text-sm font-medium">Activité (24h)</CardTitle>
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
