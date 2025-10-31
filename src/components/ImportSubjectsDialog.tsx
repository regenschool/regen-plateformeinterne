import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Plus, Trash2, AlertCircle, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rateLimiter";
import { logAuditAction } from "@/hooks/useAuditLog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface TeacherSuggestion {
  rowIndex: number;
  email: string;
  name: string;
  suggestions: Array<{ id: string; email: string; name: string; similarity: number }>;
  action: 'create' | 'use_existing' | 'skip';
  selectedTeacherId?: string;
}

// Fonction de calcul de similarité Levenshtein
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen;
};

export function ImportSubjectsDialog({ open, onClose, onImportComplete }: ImportSubjectsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SubjectRow[]>([
    { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
    { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
    { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
  ]);
  const [validationStep, setValidationStep] = useState(false);
  const [teacherSuggestions, setTeacherSuggestions] = useState<TeacherSuggestion[]>([]);

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

  const validateTeachers = async () => {
    const validSubjects = rows.filter(
      (row) => row.school_year && row.semester && row.class_name && row.subject_name
    );

    if (validSubjects.length === 0) {
      toast.error("Veuillez remplir au moins une matière complète (année, semestre, classe, matière)");
      return;
    }

    setLoading(true);

    try {
      await checkRateLimit(RATE_LIMITS.IMPORT_SUBJECTS);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer tous les enseignants via user_roles
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');

      const teacherIds = teacherRoles?.map(r => r.user_id) || [];
      
      // Récupérer les emails via RPC
      const allTeachers = await Promise.all(
        teacherIds.map(async (id) => {
          const email = await supabase.rpc('get_user_email', { _user_id: id });
          return { user_id: id, email: email.data || '', full_name: email.data?.split('@')[0] || '' };
        })
      );

      const suggestions: TeacherSuggestion[] = [];

      for (let i = 0; i < validSubjects.length; i++) {
        const subject = validSubjects[i];
        
        if (!subject.teacher_email) continue;

        // Chercher enseignant exact
        const exactMatch = allTeachers.find(t => t.email === subject.teacher_email);
        
        if (!exactMatch) {
          // Chercher enseignants similaires (seuil de similarité : 0.7)
          const similar = allTeachers
            .map(t => ({
              id: t.user_id,
              email: t.email,
              name: t.full_name || t.email,
              similarity: calculateSimilarity(subject.teacher_email, t.email)
            }))
            .filter(t => t.similarity >= 0.7)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3);

          suggestions.push({
            rowIndex: i,
            email: subject.teacher_email,
            name: subject.teacher_name,
            suggestions: similar,
            action: similar.length > 0 ? 'skip' : 'create',
            selectedTeacherId: similar.length > 0 ? similar[0].id : undefined
          });
        }
      }

      setLoading(false);

      if (suggestions.length > 0) {
        setTeacherSuggestions(suggestions);
        setValidationStep(true);
      } else {
        // Aucune validation nécessaire, import direct
        await performImport([]);
      }
    } catch (error: any) {
      setLoading(false);
      if (error instanceof RateLimitError) {
        toast.error(`Limite d'import atteinte. Réessayez dans ${error.retryAfter} secondes`);
        return;
      }
      console.error("Erreur validation enseignants:", error);
      toast.error(error.message || "Erreur lors de la validation");
    }
  };

  const performImport = async (teacherDecisions: TeacherSuggestion[]) => {
    const validSubjects = rows.filter(
      (row) => row.school_year && row.semester && row.class_name && row.subject_name
    );

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer les IDs de référentiels
      const { data: schoolYears } = await supabase.from('school_years').select('id, label');
      const { data: academicPeriods } = await supabase.from('academic_periods').select('id, label, school_year_id');
      const { data: classes } = await supabase.from('classes').select('id, name');
      
      const { data: existingSubjects } = await supabase
        .from('subjects')
        .select('id, school_year_fk_id, academic_period_id, class_fk_id, subject_name');

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < validSubjects.length; i++) {
        const subject = validSubjects[i];
        
        const decision = teacherDecisions.find(d => d.rowIndex === i);

        if (decision?.action === 'skip') {
          skippedCount++;
          continue;
        }

        let targetTeacherId: string | null = user.id;
        let teacherName = subject.teacher_name;

        if (subject.teacher_email) {
          if (decision?.action === 'create') {
            // Créer nouveau compte enseignant via edge function
            const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
              body: {
                email: subject.teacher_email,
                role: 'teacher',
                metadata: { full_name: subject.teacher_name }
              }
            });

            if (inviteError) {
              toast.error(`Erreur création ${subject.teacher_email}: ${inviteError.message}`);
              continue;
            }

            targetTeacherId = inviteData.user_id;
          } else if (decision?.action === 'use_existing' && decision.selectedTeacherId) {
            targetTeacherId = decision.selectedTeacherId;
            const teacherEmail = await supabase.rpc('get_user_email', { _user_id: decision.selectedTeacherId });
            teacherName = teacherEmail.data?.split('@')[0] || subject.teacher_name;
          } else {
            // Pas de décision, chercher enseignant existant
            const { data: teacherUserId } = await supabase.rpc('get_user_id_from_email', {
              _email: subject.teacher_email
            });

            if (teacherUserId) {
              targetTeacherId = teacherUserId;
              const teacherEmail = await supabase.rpc('get_user_email', { _user_id: teacherUserId });
              teacherName = teacherEmail.data?.split('@')[0] || subject.teacher_name;
            }
          }
        }

        // ✅ Trouver les IDs de référentiels pour les FK
        const schoolYearFk = schoolYears?.find(sy => sy.label === subject.school_year);
        const classFk = classes?.find(c => c.name === subject.class_name);
        const academicPeriodFk = academicPeriods?.find(ap => 
          ap.label === subject.semester && ap.school_year_id === schoolYearFk?.id
        );

        const existing = existingSubjects?.find(
          (s) =>
            s.school_year_fk_id === schoolYearFk?.id &&
            s.academic_period_id === academicPeriodFk?.id &&
            s.class_fk_id === classFk?.id &&
            s.subject_name === subject.subject_name
        );

        const subjectData: any = {
          subject_name: subject.subject_name,
          teacher_id: targetTeacherId,
          school_year_fk_id: schoolYearFk?.id || null,
          academic_period_id: academicPeriodFk?.id || null,
          class_fk_id: classFk?.id || null,
        };

        if (existing) {
          await supabase
            .from('subjects')
            .update(subjectData)
            .eq('id', existing.id);
          updatedCount++;
        } else {
          await supabase
            .from('subjects')
            .insert([subjectData]);
          importedCount++;
        }
      }

      await logAuditAction('IMPORT', 'subjects', {
        total: validSubjects.length,
        created: importedCount,
        updated: updatedCount,
        skipped: skippedCount
      });

      const msg = [];
      if (importedCount > 0) msg.push(`${importedCount} créée(s)`);
      if (updatedCount > 0) msg.push(`${updatedCount} mise(s) à jour`);
      if (skippedCount > 0) msg.push(`${skippedCount} ignorée(s)`);
      
      toast.success(`Import réussi : ${msg.join(", ")}`);
      
      setRows([
        { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
        { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
        { school_year: "", semester: "", class_name: "", subject_name: "", teacher_email: "", teacher_name: "" },
      ]);
      setValidationStep(false);
      setTeacherSuggestions([]);
      onImportComplete();
      onClose();
    } catch (error: any) {
      console.error("Erreur import:", error);
      toast.error("Erreur lors de l'import : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {validationStep ? "Validation des enseignants" : "Importer des matières (CSV)"}
          </DialogTitle>
          {!validationStep && (
            <DialogDescription>
              Copiez les données depuis Excel/Sheets et collez-les directement dans le tableau
            </DialogDescription>
          )}
        </DialogHeader>

        {validationStep ? (
          <div className="space-y-4 overflow-auto flex-1">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {teacherSuggestions.length} enseignant(s) non trouvé(s). Choisissez une action pour chacun.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {teacherSuggestions.map((suggestion, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-medium">{suggestion.name || suggestion.email}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.email}</p>
                  </div>

                  {suggestion.suggestions.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                      <p className="text-sm font-medium mb-2">⚠️ Enseignants similaires détectés :</p>
                      <ul className="text-sm space-y-1">
                        {suggestion.suggestions.map((s, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {s.name} - {s.email} ({Math.round(s.similarity * 100)}% similaire)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Select
                      value={suggestion.action}
                      onValueChange={(value: 'create' | 'use_existing' | 'skip') => {
                        const updated = [...teacherSuggestions];
                        updated[idx].action = value;
                        if (value === 'use_existing' && suggestion.suggestions.length > 0) {
                          updated[idx].selectedTeacherId = suggestion.suggestions[0].id;
                        }
                        setTeacherSuggestions(updated);
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create">Créer nouveau compte</SelectItem>
                        {suggestion.suggestions.length > 0 && (
                          <SelectItem value="use_existing">Utiliser existant</SelectItem>
                        )}
                        <SelectItem value="skip">Ignorer cette ligne</SelectItem>
                      </SelectContent>
                    </Select>

                    {suggestion.action === 'use_existing' && suggestion.suggestions.length > 0 && (
                      <Select
                        value={suggestion.selectedTeacherId}
                        onValueChange={(value) => {
                          const updated = [...teacherSuggestions];
                          updated[idx].selectedTeacherId = value;
                          setTeacherSuggestions(updated);
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {suggestion.suggestions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} - {s.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setValidationStep(false)}>
                Retour
              </Button>
              <Button onClick={() => performImport(teacherSuggestions)} disabled={loading}>
                {loading ? "Import en cours..." : "Confirmer et importer"}
              </Button>
            </div>
          </div>
        ) : (
          <>
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
                          onChange={(e) => handleCellChange(index, "subject_name", e.target.value.slice(0, 60))}
                          onPaste={(e) => handlePaste(e, index, "subject_name")}
                          placeholder="Management (max 60 car.)"
                          className="h-8"
                          maxLength={60}
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
              <Button onClick={validateTeachers} disabled={loading} className="flex-1">
                {loading ? "Validation..." : "Valider et importer"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
