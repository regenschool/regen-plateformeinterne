import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload } from "lucide-react";

type ImportStudentsDialogProps = {
  onImportComplete: () => void;
};

export const ImportStudentsDialog = ({ onImportComplete }: ImportStudentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    setLoading(true);

    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const students = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const student: any = {
          first_name: "",
          last_name: "",
          class_name: "",
        };

        headers.forEach((header, index) => {
          const value = values[index];
          if (header.includes("first") || header.includes("name") && !header.includes("last")) {
            student.first_name = value;
          } else if (header.includes("last") || header.includes("surname")) {
            student.last_name = value;
          } else if (header.includes("photo") || header.includes("image")) {
            student.photo_url = value || null;
          } else if (header.includes("age")) {
            student.age = value ? parseInt(value) : null;
          } else if (header.includes("academic") || header.includes("diploma") || header.includes("background")) {
            student.academic_background = value || null;
          } else if (header.includes("company") || header.includes("work")) {
            student.company = value || null;
          } else if (header.includes("class")) {
            student.class_name = value;
          }
        });

        return student;
      });

      const validStudents = students.filter(
        (s) => s.first_name && s.last_name && s.class_name
      );

      if (validStudents.length === 0) {
        toast.error("No valid students found. Make sure CSV has first_name, last_name, and class_name columns.");
        return;
      }

      const { error } = await supabase.from("students").insert(validStudents);

      if (error) throw error;

      toast.success(`Successfully imported ${validStudents.length} students!`);
      setOpen(false);
      setCsvData("");
      onImportComplete();
    } catch (error: any) {
      toast.error("Failed to import students");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Paste your CSV data below. Required columns:</p>
            <ul className="list-disc list-inside ml-2">
              <li>first_name (or name)</li>
              <li>last_name (or surname)</li>
              <li>class_name (or class)</li>
            </ul>
            <p>Optional columns: photo, age, academic_background, company</p>
          </div>
          <Textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="first_name,last_name,class_name,age,academic_background,company,photo&#10;John,Doe,2024 Cohort A,25,MBA,Google,https://..."
            className="min-h-[200px] font-mono text-sm"
          />
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? "Importing..." : "Import Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
