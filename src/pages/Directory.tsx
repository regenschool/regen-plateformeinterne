import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { ImportStudentsDialog } from "@/components/ImportStudentsDialog";
import { Plus, Upload, Sprout, Download } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
};

const Directory = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveSearchOnly, setShowActiveSearchOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedClass, searchTerm, showActiveSearchOnly]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("class_name", { ascending: true })
        .order("last_name", { ascending: true });

      if (error) throw error;

      setStudents(data || []);
      const uniqueClasses = Array.from(new Set(data?.map((s) => s.class_name) || []));
      setClasses(uniqueClasses);
    } catch (error: any) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (selectedClass !== "all") {
      filtered = filtered.filter((s) => s.class_name === selectedClass);
    }

    if (showActiveSearchOnly) {
      filtered = filtered.filter(
        (s) => s.company?.toLowerCase() === "en recherche active"
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(term) ||
          s.last_name.toLowerCase().includes(term) ||
          s.company?.toLowerCase().includes(term) ||
          s.academic_background?.toLowerCase().includes(term)
      );
    }

    setFilteredStudents(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Prénom",
      "Nom",
      "Âge",
      "Parcours académique",
      "Entreprise",
      "Classe",
    ];

    const csvData = filteredStudents.map((student) => [
      student.first_name,
      student.last_name,
      student.age || "",
      student.academic_background || "",
      student.company || "",
      student.class_name,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `etudiants_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV réussi");
  };

  const handleStudentAdded = () => {
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Sprout className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Chargement de l'écosystème...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Écosystème étudiant</h2>
          <p className="text-muted-foreground">
            {filteredStudents.length} {filteredStudents.length === 1 ? "étudiant" : "étudiants"} · Leaders responsables de demain
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="default">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <ImportStudentsDialog onImportComplete={handleStudentAdded} />
          <AddStudentDialog onStudentAdded={handleStudentAdded} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Rechercher par nom, entreprise ou parcours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:flex-1"
          />
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="md:w-[200px]">
              <SelectValue placeholder="Filtrer par classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active-search"
            checked={showActiveSearchOnly}
            onCheckedChange={(checked) => setShowActiveSearchOnly(checked === true)}
          />
          <Label
            htmlFor="active-search"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Afficher uniquement les étudiants en recherche active
          </Label>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Sprout className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium text-foreground">Aucun étudiant trouvé</p>
            <p className="text-muted-foreground">
              {searchTerm || selectedClass !== "all"
                ? "Ajustez vos filtres"
                : "Ajoutez votre premier étudiant"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;
