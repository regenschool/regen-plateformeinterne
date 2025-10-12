import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { ImportStudentsDialog } from "@/components/ImportStudentsDialog";
import { Sprout, Download, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useDebounce } from "@/hooks/useDebounce";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  birth_date: string | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
  special_needs: string | null;
  created_at: string;
};

const Directory = () => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveSearchOnly, setShowActiveSearchOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"lastName" | "class" | "classReverse" | "age" | "createdAt">("lastName");
  const [loading, setLoading] = useState(true);
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchStudents();
  }, []);
  
  // Real-time subscription for students table
  useRealtimeSubscription({
    table: "students",
    onChange: () => {
      // Refetch students when any change occurs
      fetchStudents();
    },
  });

  useEffect(() => {
    filterStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, selectedClass, debouncedSearchTerm, showActiveSearchOnly, sortBy]);

  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("last_name");

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }

      const uniqueById = Array.from(
        new Map((data || []).map((s) => [s.id, s])).values()
      );
      setStudents(uniqueById);
      const uniqueClasses = Array.from(new Set(uniqueById.map((s) => s.class_name)));
      setClasses(uniqueClasses);
    } catch (error: any) {
      toast.error(t("directory.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(term) ||
          s.last_name.toLowerCase().includes(term) ||
          s.company?.toLowerCase().includes(term) ||
          s.academic_background?.toLowerCase().includes(term)
      );
    }

    // Dédupliquer par (first_name, last_name, class_name) pour éviter doublons multi-professeurs
    const seen = new Set<string>();
    filtered = filtered.filter((s) => {
      const key = `${s.first_name.toLowerCase()}|${s.last_name.toLowerCase()}|${s.class_name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "lastName":
          return a.last_name.localeCompare(b.last_name);
        case "class":
          return a.class_name.localeCompare(b.class_name);
        case "classReverse":
          return b.class_name.localeCompare(a.class_name);
        case "age":
          // Plus jeune en premier (âge croissant)
          if (a.age === null) return 1;
          if (b.age === null) return -1;
          return a.age - b.age;
        case "createdAt":
          // Plus récent en premier (date décroissante)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

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
    toast.success(t("directory.exportSuccess"));
  };

  const handleStudentAdded = () => {
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Sprout className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">{t("directory.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t("directory.title")}</h2>
          <p className="text-muted-foreground">
            {filteredStudents.length} / {students.length} {filteredStudents.length === 1 ? t("directory.student") : t("directory.studentsCount")} · {t("directory.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="default">
            <Download className="w-4 h-4 mr-2" />
            {t("directory.exportCSV")}
          </Button>
          <ImportStudentsDialog onImportComplete={handleStudentAdded} />
          <AddStudentDialog onStudentAdded={handleStudentAdded} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder={t("directory.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:flex-1"
          />
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="md:w-[200px]">
              <SelectValue placeholder={t("directory.filterByClass")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("directory.allClasses")}</SelectItem>
              {classes.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="md:w-[220px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("directory.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastName">{t("directory.sortLastName")}</SelectItem>
              <SelectItem value="class">{t("directory.sortClass")}</SelectItem>
              <SelectItem value="classReverse">{t("directory.sortClassReverse")}</SelectItem>
              <SelectItem value="age">{t("directory.sortAge")}</SelectItem>
              <SelectItem value="createdAt">{t("directory.sortCreatedAt")}</SelectItem>
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
            {t("directory.showActiveSearch")}
          </Label>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Sprout className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium text-foreground">{t("directory.noStudents")}</p>
            <p className="text-muted-foreground">
              {searchTerm || selectedClass !== "all"
                ? t("directory.adjustFilters")
                : t("directory.addFirstStudent")}
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
