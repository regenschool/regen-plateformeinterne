import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Copy, Check, Play, BarChart3, Eye, FileCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Tests() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const copyToClipboard = (command: string, label: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    toast({
      title: "✅ Commande copiée !",
      description: `"${label}" copié dans le presse-papier`,
    });
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const testCommands = [
    {
      id: "unit",
      icon: Play,
      title: "Lancer les tests",
      description: "Exécute tous les tests unitaires une seule fois",
      command: "npx vitest run",
      color: "bg-blue-500",
      badge: "Essentiel",
      badgeVariant: "default" as const,
    },
    {
      id: "watch",
      icon: Eye,
      title: "Mode watch",
      description: "Lance les tests en continu, se relance automatiquement à chaque modification de code",
      command: "npx vitest",
      color: "bg-green-500",
      badge: "Développement",
      badgeVariant: "secondary" as const,
    },
    {
      id: "ui",
      icon: FileCode,
      title: "Interface graphique",
      description: "Ouvre une interface web interactive pour explorer les tests en détail",
      command: "npx vitest --ui",
      color: "bg-purple-500",
      badge: "Visuel",
      badgeVariant: "outline" as const,
    },
    {
      id: "coverage",
      icon: BarChart3,
      title: "Couverture de code",
      description: "Génère un rapport détaillé montrant quelles parties du code sont testées",
      command: "npx vitest run --coverage",
      color: "bg-orange-500",
      badge: "Analyse",
      badgeVariant: "destructive" as const,
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Tests & Qualité</h1>
        </div>
        <p className="text-muted-foreground">
          Lancez et suivez vos tests unitaires facilement depuis cette interface
        </p>
      </div>

      <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Comment utiliser :</strong> Cliquez sur une carte pour copier la commande, puis collez-la dans votre terminal (Ctrl+V ou Cmd+V) et appuyez sur Entrée.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testCommands.map((cmd) => (
          <Card
            key={cmd.id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
            onClick={() => copyToClipboard(cmd.command, cmd.title)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-3 rounded-lg ${cmd.color} bg-opacity-10`}>
                  <cmd.icon className={`h-6 w-6 ${cmd.color.replace('bg-', 'text-')}`} />
                </div>
                <Badge variant={cmd.badgeVariant}>{cmd.badge}</Badge>
              </div>
              <CardTitle className="flex items-center gap-2">
                {cmd.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {cmd.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono text-foreground">
                  {cmd.command}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(cmd.command, cmd.title);
                  }}
                  className="shrink-0"
                >
                  {copiedCommand === cmd.command ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">📖 Guide rapide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
              Pour débuter
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Utilisez <strong>"Lancer les tests"</strong> pour vérifier que tout fonctionne correctement.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">2</span>
              Pendant le développement
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Utilisez <strong>"Mode watch"</strong> - il relancera automatiquement les tests à chaque modification.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">3</span>
              Pour une vision détaillée
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Utilisez <strong>"Interface graphique"</strong> - vous pourrez explorer chaque test visuellement dans votre navigateur.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">4</span>
              Pour mesurer la qualité
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Utilisez <strong>"Couverture de code"</strong> - obtenez un rapport détaillé du pourcentage de code testé.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          💡 <strong>Astuce :</strong> Les tests s'exécutent dans votre terminal. Gardez-le ouvert pour voir les résultats en temps réel.
        </p>
      </div>
    </div>
  );
}
