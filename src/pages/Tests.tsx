import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, CheckCircle2, GitBranch, Github, ExternalLink, Zap } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Tests() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Tests & Qualité</h1>
        </div>
        <p className="text-muted-foreground">
          Votre code est automatiquement testé à chaque modification
        </p>
      </div>

      <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/30">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200 font-semibold">
          Les tests s'exécutent automatiquement !
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300 mt-2">
          Vous n'avez <strong>rien à faire manuellement</strong>. Chaque fois que du code est modifié et envoyé sur GitHub, 
          les tests s'exécutent automatiquement grâce à GitHub Actions.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-blue-500 bg-opacity-10">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <Badge>Automatique</Badge>
            </div>
            <CardTitle className="text-lg">Tests unitaires</CardTitle>
            <CardDescription>
              Vérifient que chaque partie du code fonctionne correctement de manière isolée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              ✅ 12 tests configurés<br/>
              📁 Fichiers testés : utils, validation
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-purple-500 bg-opacity-10">
                <GitBranch className="h-6 w-6 text-purple-500" />
              </div>
              <Badge variant="secondary">CI/CD</Badge>
            </div>
            <CardTitle className="text-lg">Intégration continue</CardTitle>
            <CardDescription>
              Teste automatiquement le code avant chaque déploiement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              ✅ GitHub Actions configuré<br/>
              🔄 Tests + Build + Sécurité
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-orange-500 bg-opacity-10">
                <CheckCircle2 className="h-6 w-6 text-orange-500" />
              </div>
              <Badge variant="outline">Qualité</Badge>
            </div>
            <CardTitle className="text-lg">Couverture de code</CardTitle>
            <CardDescription>
              Mesure le pourcentage de code testé automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              📊 Rapport généré automatiquement<br/>
              🎯 Objectif : {'>'} 80% de couverture
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Github className="h-6 w-6" />
            <CardTitle>Comment voir les résultats des tests ?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0 font-bold">1</span>
              <div>
                <h3 className="font-semibold mb-1">Allez sur votre projet GitHub</h3>
                <p className="text-sm text-muted-foreground">
                  Ouvrez votre dépôt GitHub dans votre navigateur
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0 font-bold">2</span>
              <div>
                <h3 className="font-semibold mb-1">Cliquez sur l'onglet "Actions"</h3>
                <p className="text-sm text-muted-foreground">
                  C'est là que vous verrez tous les tests qui s'exécutent
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0 font-bold">3</span>
              <div>
                <h3 className="font-semibold mb-1">Consultez les résultats</h3>
                <p className="text-sm text-muted-foreground">
                  Vous verrez une ✅ coche verte si tout fonctionne, ou ❌ une croix rouge si un test échoue
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full gap-2" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                Ouvrir GitHub Actions
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              (Remplacez l'URL par celle de votre projet)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>En résumé :</strong> Vous n'avez rien à faire ! Les tests s'exécutent automatiquement. 
          Consultez simplement GitHub Actions pour voir si tout est vert ✅
        </p>
      </div>
    </div>
  );
}
