import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ImportStudentsDialogProps = {
  onImportComplete: () => void;
};

type StudentRow = {
  first_name: string;
  last_name: string;
  class_name: string;
  photo_url: string;
  age: string;
  academic_background: string;
  company: string;
};

export const ImportStudentsDialog = ({ onImportComplete }: ImportStudentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<StudentRow[]>([
    { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" },
    { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" },
    { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" },
  ]);

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
    const fields: (keyof StudentRow)[] = ["first_name", "last_name", "class_name", "photo_url", "age", "academic_background", "company"];
    const startFieldIndex = fields.indexOf(field);
    
    lines.forEach((line, lineOffset) => {
      const values = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
      const targetRowIndex = rowIndex + lineOffset;
      
      // Add new rows if needed
      while (targetRowIndex >= newRows.length) {
        newRows.push({ first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" });
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
    setRows([...rows, { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleImport = async () => {
    const validStudents = rows
      .filter((row) => row.first_name && row.last_name && row.class_name)
      .map((row) => ({
        first_name: row.first_name,
        last_name: row.last_name,
        class_name: row.class_name,
        photo_url: row.photo_url || null,
        age: row.age ? parseInt(row.age) : null,
        academic_background: row.academic_background || null,
        company: row.company || null,
      }));

    if (validStudents.length === 0) {
      toast.error("Please fill in at least one student with First Name, Last Name, and Class.");
      return;
    }

    setLoading(true);

    try {
      // Fetch existing students to check for matches
      const { data: existingStudents, error: fetchError } = await supabase
        .from("students")
        .select("id, first_name, last_name, class_name");

      if (fetchError) throw fetchError;

      let updatedCount = 0;
      let createdCount = 0;

      // Process each student
      for (const student of validStudents) {
        // Find existing student by first_name, last_name, and class_name
        const existing = existingStudents?.find(
          (s) =>
            s.first_name.toLowerCase() === student.first_name.toLowerCase() &&
            s.last_name.toLowerCase() === student.last_name.toLowerCase() &&
            s.class_name.toLowerCase() === student.class_name.toLowerCase()
        );

        if (existing) {
          // Update existing student
          const { error: updateError } = await supabase
            .from("students")
            .update(student)
            .eq("id", existing.id);

          if (updateError) throw updateError;
          updatedCount++;
        } else {
          // Create new student
          const { error: insertError } = await supabase
            .from("students")
            .insert([student]);

          if (insertError) throw insertError;
          createdCount++;
        }
      }

      const message = [];
      if (createdCount > 0) message.push(`${createdCount} créé(s)`);
      if (updatedCount > 0) message.push(`${updatedCount} mis à jour`);
      
      toast.success(`Import réussi : ${message.join(", ")}`);
      setOpen(false);
      setRows([
        { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" },
        { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" },
        { first_name: "", last_name: "", class_name: "", photo_url: "", age: "", academic_background: "", company: "" },
      ]);
      onImportComplete();
    } catch (error: any) {
      toast.error("Failed to import students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        
        <p className="text-sm text-muted-foreground">
          Copy data from Excel/Sheets and paste directly into the table. You can paste multiple rows at once.
        </p>

        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">First Name *</TableHead>
                <TableHead className="min-w-[120px]">Last Name *</TableHead>
                <TableHead className="min-w-[150px]">Class *</TableHead>
                <TableHead className="min-w-[200px]">Photo URL</TableHead>
                <TableHead className="min-w-[80px]">Age</TableHead>
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
                      placeholder="2024 Cohort A"
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
