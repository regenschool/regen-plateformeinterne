import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ImportStudentsDialogProps = {
  onImportComplete: () => void;
};

export const ImportStudentsDialog = ({ onImportComplete }: ImportStudentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please paste your data");
      return;
    }

    setLoading(true);

    try {
      const lines = csvData.trim().split("\n");
      
      const students = lines.map((line) => {
        const values = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
        const cleanValues = values.map((v) => v.trim().replace(/^["']|["']$/g, ""));
        
        return {
          first_name: cleanValues[0] || "",
          last_name: cleanValues[1] || "",
          class_name: cleanValues[2] || "",
          photo_url: cleanValues[3] || null,
          age: cleanValues[4] ? parseInt(cleanValues[4]) : null,
          academic_background: cleanValues[5] || null,
          company: cleanValues[6] || null,
        };
      });

      const validStudents = students.filter(
        (s) => s.first_name && s.last_name && s.class_name
      );

      if (validStudents.length === 0) {
        toast.error("No valid students found. Make sure all rows have First Name, Last Name, and Class.");
        return;
      }

      const { error } = await supabase.from("students").insert(validStudents);

      if (error) throw error;

      toast.success(`Successfully imported ${validStudents.length} students!`);
      setOpen(false);
      setCsvData("");
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Copy your data from Excel/Google Sheets and paste it below. Data should be in this exact column order:
            </AlertDescription>
          </Alert>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-muted font-medium text-sm">
              <div className="p-3 border-r">First Name *</div>
              <div className="p-3 border-r">Last Name *</div>
              <div className="p-3 border-r">Class *</div>
              <div className="p-3 border-r">Photo URL</div>
              <div className="p-3 border-r">Age</div>
              <div className="p-3 border-r">Academic Background</div>
              <div className="p-3">Company</div>
            </div>
            <div className="grid grid-cols-7 bg-background/50 text-xs text-muted-foreground">
              <div className="p-2 border-r border-t">John</div>
              <div className="p-2 border-r border-t">Doe</div>
              <div className="p-2 border-r border-t">2024 Cohort A</div>
              <div className="p-2 border-r border-t">https://...</div>
              <div className="p-2 border-r border-t">25</div>
              <div className="p-2 border-r border-t">MBA</div>
              <div className="p-2 border-t">Google</div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Paste your data here:</p>
            <p className="text-xs text-muted-foreground">
              * Required fields. Photo URL should be a direct link to an image (jpg, png, webp). Paste from Excel/Sheets with tabs or comma-separated values.
            </p>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="John	Doe	2024 Cohort A	https://example.com/photo.jpg	25	MBA	Google
Jane	Smith	2024 Cohort B	https://example.com/photo2.jpg	27	MSc Engineering	Tesla"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? "Importing..." : "Import Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
