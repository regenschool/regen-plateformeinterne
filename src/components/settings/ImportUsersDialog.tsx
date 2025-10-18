import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email("Email invalide"),
  full_name: z.string().min(1, "Nom requis"),
  role: z.enum(["admin", "teacher", "moderator"], {
    errorMap: () => ({ message: "Rôle doit être: admin, teacher ou moderator" }),
  }),
  phone: z.string().optional(),
});

type ImportUsersDialogProps = {
  onImportComplete: () => void;
};

export const ImportUsersDialog = ({ onImportComplete }: ImportUsersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = () => {
    const template = `email,full_name,role,phone
john.doe@regen-school.com,John Doe,teacher,+33 6 12 34 56 78
admin@regen-school.com,Admin User,admin,
moderator@regen-school.com,Moderator User,moderator,+33 6 98 76 54 32`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_utilisateurs.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Modèle CSV téléchargé");
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("Le CSV doit contenir au moins une ligne d'en-tête et une ligne de données");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    
    // Vérifier les colonnes requises
    const requiredHeaders = ["email", "full_name", "role"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Colonnes manquantes : ${missingHeaders.join(", ")}`);
    }

    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const user: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        user[header] = values[index] || "";
      });

      // Validation avec zod
      const validated = userSchema.parse(user);
      users.push(validated);
    }

    return users;
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Veuillez coller des données CSV");
      return;
    }

    setIsImporting(true);
    try {
      const users = parseCSV(csvData);
      
      if (users.length === 0) {
        toast.error("Aucun utilisateur à importer");
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const user of users) {
        try {
          // 1. Créer l'utilisateur dans auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              full_name: user.full_name,
            },
          });

          if (authError) {
            if (authError.message.includes("already")) {
              errors.push(`${user.email}: déjà existant`);
              errorCount++;
              continue;
            }
            throw authError;
          }

          if (!authData.user) {
            throw new Error("Utilisateur non créé");
          }

          // 2. Ajouter le rôle
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert([{ user_id: authData.user.id, role: user.role }]);

          if (roleError && roleError.code !== '23505') {
            throw roleError;
          }

          // 3. Si enseignant, créer l'entrée teachers
          if (user.role === "teacher") {
            const { error: teacherError } = await supabase
              .from("teachers")
              .insert([{
                user_id: authData.user.id,
                full_name: user.full_name,
                phone: user.phone || null,
              }]);

            if (teacherError && teacherError.code !== '23505') {
              console.error("Teacher creation error:", teacherError);
              // Continue même si l'ajout dans teachers échoue
            }
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error importing ${user.email}:`, error);
          errors.push(`${user.email}: ${error.message}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} utilisateur(s) importé(s) avec succès`);
        onImportComplete();
        setCsvData("");
        setOpen(false);
      }

      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} erreur(s). Consultez la console pour plus de détails.`);
        console.error("Import errors:", errors);
      }

    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import utilisateurs par CSV</DialogTitle>
          <DialogDescription>
            Importez plusieurs utilisateurs en une seule fois. Format: email, nom complet, rôle (admin/teacher/moderator), téléphone (optionnel)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Format CSV requis : email, full_name, role, phone
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-3 h-3" />
              Télécharger modèle
            </Button>
          </div>

          <Textarea
            placeholder="email,full_name,role,phone&#10;john.doe@regen-school.com,John Doe,teacher,+33 6 12 34 56 78&#10;admin@regen-school.com,Admin User,admin,"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="font-mono text-sm min-h-[300px]"
          />

          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <p className="font-medium">📋 Instructions :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>La première ligne doit contenir les en-têtes : email, full_name, role, phone</li>
              <li>Rôles acceptés : admin, teacher, moderator</li>
              <li>Le téléphone est optionnel (laisser vide si non renseigné)</li>
              <li>Un mot de passe temporaire sera généré automatiquement</li>
              <li>Les emails seront auto-confirmés</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? "Import en cours..." : "Importer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
