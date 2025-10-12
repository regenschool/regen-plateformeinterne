import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rateLimiter";
import { logAuditAction } from "@/hooks/useAuditLog";

interface ImportSubjectsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type SubjectRow = {
  school_year: string;
  semester: string;
  class_name: string;
  subject_name: string;
  teacher_email: string;
  teacher_name: string;
};

export function ImportSubjectsDialog({ open, onClose, onImportComplete }: ImportSubjectsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SubjectRow[]>([
    { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
    { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
    { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
  ]);

  const handleCellChange = (index: number, field: keyof SubjectRow, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, field: keyof SubjectRow) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const lines = pastedData.split("\n").filter(line => line.trim());
    
    const newRows = [...rows];
    const fields: (keyof SubjectRow)[] = ["school_year", "semester", "class_name", "subject_name", "teacher_email", "teacher_name"];
    const startFieldIndex = fields.indexOf(field);
    
    lines.forEach((line, lineOffset) => {
      const values = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
      const targetRowIndex = rowIndex + lineOffset;
      
      while (targetRowIndex >= newRows.length) {
        newRows.push({ school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" });
      }
      
      values.forEach((value, valueIndex) => {
        const targetFieldIndex = startFieldIndex + valueIndex;
        if (targetFieldIndex < fields.length) {
          newRows[targetRowIndex][fields[targetFieldIndex]] = value.trim().replace(/^["']|["']$/g, "");
        }
      });
    });
    
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleImport = async () => {
    const validSubjects = rows.filter(
      (row) => row.school_year && row.semester && row.class_name && row.subject_name
    );

    if (validSubjects.length === 0) {
      toast.error("Veuillez remplir au moins une matière complète (année, semestre, classe, matière)");
      return;
    }

    // Vérifier le rate limiting
    try {
      await checkRateLimit(RATE_LIMITS.IMPORT_SUBJECTS);
    } catch (error) {
      if (error instanceof RateLimitError) {
        toast.error(`Limite d'import atteinte. Réessayez dans ${error.retryAfter} secondes`);
        return;
      }
      throw error;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer toutes les matières existantes
      const { data: existingSubjects, error: fetchError } = await supabase
        .from("subjects")
        .select("id, school_year, semester, class_name, subject_name, teacher_email");

      if (fetchError) throw fetchError;

      let updatedCount = 0;
      let createdCount = 0;

      for (const subject of validSubjects) {
        // Résoudre le teacher_id depuis l'email si fourni
        let targetTeacherId: string | null = null;
        
        if (subject.teacher_email) {
          // Chercher l'utilisateur avec cet email
          const { data: teacherUser } = await supabase.rpc('get_user_id_from_email', { 
            _email: subject.teacher_email 
          });
          
          if (teacherUser) {
            targetTeacherId = teacherUser;
          } else {
            // Créer un nouvel utilisateur enseignant sans mot de passe (invitation)
            console.log(`Création d'un enseignant pour ${subject.teacher_email}`);
            
            // Créer l'entrée dans teachers sans user_id (sera lié plus tard quand l'enseignant se connecte)
            const teacherInsert = {
              full_name: subject.teacher_name || subject.teacher_email.split('@')[0],
              email: subject.teacher_email,
            };
            
            // Teachers table nécessite user_id, on ne peut pas créer sans
            // Pour l'instant, on laisse targetTeacherId à null
            // L'enseignant devra être invité à créer son compte plus tard
            console.warn(`Enseignant ${subject.teacher_email} pas encore inscrit - matière créée sans teacher_id`);
          }
        } else {
          // Si pas d'email fourni, assigner à l'utilisateur qui importe
          targetTeacherId = user.id;
        }

        // Chercher une matière existante avec les mêmes critères
        const existing = existingSubjects?.find(
          (s) =>
            s.school_year === subject.school_year &&
            s.semester === subject.semester &&
            s.class_name === subject.class_name &&
            s.subject_name === subject.subject_name
        );

        const subjectData = {
          school_year: subject.school_year,
          semester: subject.semester,
          class_name: subject.class_name,
          subject_name: subject.subject_name,
          teacher_email: subject.teacher_email || null,
          teacher_name: subject.teacher_name || (subject.teacher_email ? subject.teacher_email.split("@")[0] : "Admin Import"),
          teacher_id: targetTeacherId, // Peut être null si l'enseignant n'est pas encore inscrit
        };

        if (existing) {
          // Mettre à jour la matière existante
          const { error: updateError } = await supabase
            .from("subjects")
            .update(subjectData)
            .eq("id", existing.id);

          if (updateError) throw updateError;
          updatedCount++;
        } else {
          // Créer une nouvelle matière
          const { error: insertError } = await supabase
            .from("subjects")
            .insert([subjectData]);

          if (insertError) throw insertError;
          createdCount++;
        }
      }

      // Logger l'action d'audit
      await logAuditAction('IMPORT', 'subjects', {
        total_subjects: validSubjects.length,
        created: createdCount,
        updated: updatedCount,
      });

      const message = [];
      if (createdCount > 0) message.push(`${createdCount} créée(s)`);
      if (updatedCount > 0) message.push(`${updatedCount} mise(s) à jour`);
      
      toast.success(`Import réussi : ${message.join(", ")}`);
      
      setRows([
        { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
        { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
        { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
      ]);
      onImportComplete();
      onClose();
    } catch (error: any) {
      console.error("Erreur lors de l'import:", error);
      toast.error("Erreur lors de l'import : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importer des matières (CSV)</DialogTitle>
          <DialogDescription>
            Copiez les données depuis Excel/Sheets et collez-les directement dans le tableau
          </DialogDescription>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground">
          Vous pouvez coller plusieurs lignes à la fois
        </p>

        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Année Scolaire *</TableHead>
                <TableHead className="min-w-[120px]">Semestre *</TableHead>
                <TableHead className="min-w-[100px]">Classe *</TableHead>
                <TableHead className="min-w-[150px]">Matière *</TableHead>
                <TableHead className="min-w-[200px]">Email Enseignant</TableHead>
                <TableHead className="min-w-[150px]">Nom Enseignant</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={row.school_year}
                      onChange={(e) => handleCellChange(index, "school_year", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "school_year")}
                      placeholder="2025-2026"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.semester}
                      onChange={(e) => handleCellChange(index, "semester", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "semester")}
                      placeholder="Semestre 1"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.class_name}
                      onChange={(e) => handleCellChange(index, "class_name", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "class_name")}
                      placeholder="B3"
                      maxLength={5}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.subject_name}
                      onChange={(e) => handleCellChange(index, "subject_name", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "subject_name")}
                      placeholder="Management"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.teacher_email}
                      onChange={(e) => handleCellChange(index, "teacher_email", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "teacher_email")}
                      placeholder="prof@example.com"
                      type="email"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.teacher_name}
                      onChange={(e) => handleCellChange(index, "teacher_name", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "teacher_name")}
                      placeholder="Dupont"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={addRow} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une ligne
          </Button>
          <Button onClick={handleImport} disabled={loading} className="flex-1">
            {loading ? "Import en cours..." : "Importer les matières"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
