import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ADMIN_GUIDE_URL = "/docs/guides/admin-onboarding.md";

export const DocumentationSection = () => {
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Documentation</h2>
        <p className="text-muted-foreground">
          Téléchargez les guides d'utilisation et documentation de la plateforme
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Guide d'Onboarding Administrateur
          </CardTitle>
          <CardDescription>
            Guide complet de prise en main pour les administrateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ce guide contient toutes les informations nécessaires pour :
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>Se connecter et créer son compte</li>
              <li>Gérer les utilisateurs et invitations</li>
              <li>Configurer les années scolaires et périodes</li>
              <li>Créer et gérer les classes et niveaux</li>
              <li>Gérer les étudiants et leurs données</li>
              <li>Consulter les notes et statistiques</li>
              <li>Utiliser le journal d'audit</li>
              <li>Suivre les bonnes pratiques</li>
            </ul>
            <Button 
              onClick={() => handleDownload(ADMIN_GUIDE_URL, "guide-admin-regen-school.md")}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le guide (Markdown)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Guides à venir
          </CardTitle>
          <CardDescription>
            Documentation supplémentaire en préparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>📖 Guide Enseignant - En préparation</li>
            <li>🎥 Vidéos tutorielles - En préparation</li>
            <li>❓ FAQ - En préparation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
