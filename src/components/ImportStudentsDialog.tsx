import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parse, format, isValid } from "date-fns";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/rateLimiter";
import { logAuditAction } from "@/hooks/useAuditLog";

type ImportStudentsDialogProps = {
  onImportComplete: () => void;
  selectedSchoolYearId: string;
};

type StudentRow = {
  first_name: string;
  last_name: string;
  class_name: string;
  photo_url: string;
  age: string;
  birth_date: string;
  academic_background: string;
  company: string;
};

export const ImportStudentsDialog = ({ onImportComplete, selectedSchoolYearId }: ImportStudentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [rows, setRows] = useState<StudentRow[]>([
    { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" },
    { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" },
    { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" },
  ]);

  // Charger les étudiants existants quand le dialogue s'ouvre
  const loadExistingStudents = async () => {
    if (!selectedSchoolYearId) return;
    
    setLoadingStudents(true);
    try {
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          class_name,
          company,
          academic_background,
          students (
            first_name,
            last_name,
            photo_url,
            age,
            birth_date
          )
        `)
        .eq('school_year_id', selectedSchoolYearId)
        .order('students(last_name)', { ascending: true });

      if (enrollments && enrollments.length > 0) {
        const studentRows: StudentRow[] = enrollments.map((enrollment) => ({
          first_name: enrollment.students?.first_name || "",
          last_name: enrollment.students?.last_name || "",
          class_name: enrollment.class_name || "",
          photo_url: enrollment.students?.photo_url || "",
          age: enrollment.students?.age?.toString() || "",
          birth_date: enrollment.students?.birth_date || "",
          academic_background: enrollment.academic_background || "",
          company: enrollment.company || "",
        }));
        
        setRows(studentRows);
        toast.success(`${studentRows.length} étudiant(s) chargé(s)`);
      }
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadExistingStudents();
    }
  };

  const handleCellChange = (index: number, field: keyof StudentRow, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, field: keyof StudentRow) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const lines = pastedData.split("\n").filter(line => line.trim());
    
    const newRows = [...rows];
    const fields: (keyof StudentRow)[] = ["first_name", "last_name", "class_name", "photo_url", "age", "birth_date", "academic_background", "company"];
    const startFieldIndex = fields.indexOf(field);
    
    lines.forEach((line, lineOffset) => {
      const values = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
      const targetRowIndex = rowIndex + lineOffset;
      
      // Add new rows if needed
      while (targetRowIndex >= newRows.length) {
        newRows.push({ first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" });
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
    setRows([...rows, { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  // Parse various date formats, including Excel serial numbers
  const excelSerialToISO = (serial: number): string | null => {
    if (!isFinite(serial)) return null;
    // Excel's day 1 = 1899-12-31, but due to leap-year bug, using 1899-12-30 works for dates >= 1900-03-01
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + Math.floor(serial) * 24 * 60 * 60 * 1000);
    if (!isValid(date)) return null;
    return format(date, 'yyyy-MM-dd');
  };

  const parseDateString = (dateStr: string): string | null => {
    if (!dateStr || !dateStr.trim()) return null;

    const trimmedDate = dateStr.trim();

    // Excel can paste serial numbers (e.g., 45361) or with decimal separators
    const numericCandidate = Number(trimmedDate.replace(',', '.'));
    if (!Number.isNaN(numericCandidate) && /^(\d+)([\.,]\d+)?$/.test(trimmedDate)) {
      const iso = excelSerialToISO(Math.floor(numericCandidate));
      if (iso) return iso;
    }

    // Try various date formats that Excel might use
    const dateFormats = [
      'yyyy-MM-dd',
      'yyyy-M-d',
      'dd/MM/yyyy',
      'd/M/yyyy',
      'MM/dd/yyyy',
      'M/d/yyyy',
      'dd-MM-yyyy',
      'd-M-yyyy',
      'MM-dd-yyyy',
      'M-d-yyyy',
      'dd.MM.yyyy',
      'd.M.yyyy',
      'dd/MM/yy',
      'd/M/yy',
      'MM/dd/yy',
      'M/d/yy',
      'yyyy/MM/dd',
      'yyyy/M/d',
    ];

    for (const fmt of dateFormats) {
      try {
        const parsedDate = parse(trimmedDate, fmt, new Date());
        if (isValid(parsedDate)) {
          return format(parsedDate, 'yyyy-MM-dd');
        }
      } catch (_) {
        // continue
      }
    }

    // Fallback: native Date parsing
    const native = new Date(trimmedDate);
    if (isValid(native)) {
      return format(native, 'yyyy-MM-dd');
    }

    return null;
  };

  const handleImport = async () => {
    if (!selectedSchoolYearId) {
      toast.error("Veuillez sélectionner une année scolaire avant d'importer");
      return;
    }

    // Vérifier le rate limiting
    try {
      await checkRateLimit(RATE_LIMITS.IMPORT_STUDENTS);
    } catch (error) {
      if (error instanceof RateLimitError) {
        toast.error(`Limite d'import atteinte. Réessayez dans ${error.retryAfter} secondes`);
        return;
      }
      throw error;
    }

    const { syncClassToReferential } = await import('@/hooks/useReferentialMutations');
    
    const validStudents = rows
      .filter((row) => row.first_name && row.last_name && row.class_name)
      .map((row) => {
        let birth_date = null;
        if (row.birth_date && row.birth_date.trim()) {
          birth_date = parseDateString(row.birth_date);
        }

        return {
          first_name: row.first_name.trim(),
          last_name: row.last_name.trim(),
          class_name: row.class_name.trim(),
          photo_url: row.photo_url?.trim() || null,
          age: row.age ? parseInt(row.age, 10) : null,
          birth_date,
          academic_background: row.academic_background?.trim() || null,
          company: row.company || null,
        };
      });

    if (validStudents.length === 0) {
      toast.error("Veuillez remplir au moins un étudiant avec Prénom, Nom et Classe");
      return;
    }

    setLoading(true);

    try {
      // 1. Synchroniser toutes les classes vers le référentiel (en parallèle)
      const uniqueClasses = [...new Set(validStudents.map(s => s.class_name))];
      await Promise.all(uniqueClasses.map(className => syncClassToReferential(className)));

      // 2. Récupérer les IDs des classes depuis le référentiel (1 requête)
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .in('name', uniqueClasses);

      const classIdMap = new Map(classesData?.map(c => [c.name, c.id]) || []);

      // 3. Récupérer tous les étudiants existants par nom (1 requête)
      const studentNames = validStudents.map(s => `${s.first_name}|${s.last_name}`);
      const { data: existingStudents } = await supabase
        .from('students')
        .select('id, first_name, last_name');

      const existingStudentsMap = new Map(
        existingStudents?.map(s => [`${s.first_name}|${s.last_name}`, s.id]) || []
      );

      // 4. Séparer les nouveaux étudiants des existants
      const studentsToInsert = [];
      const studentsToUpdate = [];
      const studentIdMapping = new Map(); // Pour mapper les données vers les IDs

      for (const student of validStudents) {
        const key = `${student.first_name}|${student.last_name}`;
        const existingId = existingStudentsMap.get(key);

        if (existingId) {
          studentsToUpdate.push({ ...student, id: existingId });
          studentIdMapping.set(key, existingId);
        } else {
          studentsToInsert.push(student);
        }
      }

      // 5. Batch insert nouveaux étudiants (1 requête)
      const newStudentIds: string[] = [];
      if (studentsToInsert.length > 0) {
        const { data: insertedStudents, error: insertError } = await supabase
          .from('students')
          .insert(studentsToInsert)
          .select('id, first_name, last_name');

        if (insertError) throw insertError;

        // Mapper les nouveaux IDs
        insertedStudents?.forEach((s, idx) => {
          const key = `${s.first_name}|${s.last_name}`;
          studentIdMapping.set(key, s.id);
          newStudentIds.push(s.id);
        });
      }

      // 6. Batch update étudiants existants (en parallèle)
      if (studentsToUpdate.length > 0) {
        await Promise.all(
          studentsToUpdate.map(student =>
            supabase
              .from('students')
              .update(student)
              .eq('id', student.id)
          )
        );
      }

      // 7. Récupérer les enrollments existants pour cette année (1 requête)
      const allStudentIds = Array.from(studentIdMapping.values());
      const { data: existingEnrollments } = await supabase
        .from('student_enrollments')
        .select('student_id, id')
        .eq('school_year_id', selectedSchoolYearId)
        .in('student_id', allStudentIds);

      const existingEnrollmentsMap = new Map(
        existingEnrollments?.map(e => [e.student_id, e.id]) || []
      );

      // 8. Préparer les enrollments
      const enrollmentsToInsert = [];
      const enrollmentsToUpdate = [];

      for (const student of validStudents) {
        const key = `${student.first_name}|${student.last_name}`;
        const studentId = studentIdMapping.get(key);
        if (!studentId) continue;

        const classId = classIdMap.get(student.class_name) || null;
        const enrollmentData = {
          student_id: studentId,
          school_year_id: selectedSchoolYearId,
          class_id: classId,
          class_name: student.class_name,
          company: student.company,
          academic_background: student.academic_background,
        };

        const existingEnrollmentId = existingEnrollmentsMap.get(studentId);
        if (existingEnrollmentId) {
          enrollmentsToUpdate.push({ ...enrollmentData, id: existingEnrollmentId });
        } else {
          enrollmentsToInsert.push(enrollmentData);
        }
      }

      // 9. Batch insert/update enrollments
      if (enrollmentsToInsert.length > 0) {
        const { error: enrollInsertError } = await supabase
          .from('student_enrollments')
          .insert(enrollmentsToInsert);

        if (enrollInsertError) throw enrollInsertError;
      }

      if (enrollmentsToUpdate.length > 0) {
        await Promise.all(
          enrollmentsToUpdate.map(enrollment =>
            supabase
              .from('student_enrollments')
              .update(enrollment)
              .eq('id', enrollment.id)
          )
        );
      }

      // 10. Logger l'action d'audit
      await logAuditAction('IMPORT', 'students', {
        total_students: validStudents.length,
        created: studentsToInsert.length,
        updated: studentsToUpdate.length,
      });

      // 11. Messages de succès détaillés
      const messages = [];
      if (studentsToInsert.length > 0) messages.push(`${studentsToInsert.length} étudiant(s) créé(s)`);
      if (studentsToUpdate.length > 0) messages.push(`${studentsToUpdate.length} étudiant(s) mis à jour`);
      if (enrollmentsToInsert.length > 0) messages.push(`${enrollmentsToInsert.length} inscription(s) créée(s)`);
      if (enrollmentsToUpdate.length > 0) messages.push(`${enrollmentsToUpdate.length} inscription(s) mise(s) à jour`);
      
      toast.success(`✅ Import ultra-rapide : ${messages.join(", ")}`);
      setOpen(false);
      setRows([
        { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" },
        { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" },
        { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", birth_date: "", academic_background: "", company: "" },
      ]);
      onImportComplete();
    } catch (error: any) {
      toast.error("Failed to import students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
        </DialogHeader>
        
        {loadingStudents ? (
          <p className="text-sm text-muted-foreground">
            Chargement des étudiants existants...
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Les étudiants existants sont pré-remplis. Copiez-collez une colonne pour mettre à jour un seul champ.
          </p>
        )}

        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">First Name *</TableHead>
                <TableHead className="min-w-[120px]">Last Name *</TableHead>
                <TableHead className="min-w-[150px]">Class *</TableHead>
                <TableHead className="min-w-[200px]">Photo URL</TableHead>
                <TableHead className="min-w-[80px]">Age</TableHead>
                <TableHead className="min-w-[120px]">Birth Date</TableHead>
                <TableHead className="min-w-[180px]">Academic Background</TableHead>
                <TableHead className="min-w-[150px]">Company</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={row.first_name}
                      onChange={(e) => handleCellChange(index, "first_name", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "first_name")}
                      placeholder="John"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.last_name}
                      onChange={(e) => handleCellChange(index, "last_name", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "last_name")}
                      placeholder="Doe"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.class_name}
                      onChange={(e) => handleCellChange(index, "class_name", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "class_name")}
                      placeholder="B3, M1..."
                      maxLength={5}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.photo_url}
                      onChange={(e) => handleCellChange(index, "photo_url", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "photo_url")}
                      placeholder="https://..."
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.age}
                      onChange={(e) => handleCellChange(index, "age", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "age")}
                      placeholder="25"
                      type="number"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.birth_date}
                      onChange={(e) => handleCellChange(index, "birth_date", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "birth_date")}
                      placeholder="1999-01-15 or 15/01/1999 or Excel serial"
                      type="text"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.academic_background}
                      onChange={(e) => handleCellChange(index, "academic_background", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "academic_background")}
                      placeholder="MBA"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.company}
                      onChange={(e) => handleCellChange(index, "company", e.target.value)}
                      onPaste={(e) => handlePaste(e, index, "company")}
                      placeholder="Google"
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
            Add Row
          </Button>
          <Button onClick={handleImport} disabled={loading} className="flex-1">
            {loading ? "Importing..." : "Import Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
