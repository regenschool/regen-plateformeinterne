import { useState, useEffect, useMemo } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useSchoolYears } from "@/hooks/useReferentials";

const Directory = () => {
  const { t } = useLanguage();
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveSearchOnly, setShowActiveSearchOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"nameAsc" | "nameDesc" | "class" | "ageAsc" | "ageDesc" | "createdAt">("nameAsc");
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data: schoolYears } = useSchoolYears();
  const { data: enrollments = [], isLoading } = useEnrollments({ 
    schoolYearId: selectedSchoolYearId 
  });

  // Auto-sélectionner l'année active au chargement
  useEffect(() => {
    if (schoolYears?.length && !selectedSchoolYearId) {
      const activeYear = schoolYears.find(sy => sy.is_active);
      if (activeYear) setSelectedSchoolYearId(activeYear.id);
    }
  }, [schoolYears, selectedSchoolYearId]);

  // Extraire les classes uniques des enrollments
  const classes = useMemo(() => {
    const uniqueClasses = new Set(enrollments.map(e => e.class_name_from_ref || e.class_name).filter(Boolean));
    return Array.from(uniqueClasses).sort();
  }, [enrollments]);

  // Filtrage et tri avec useMemo pour optimiser les performances
  const filteredEnrollments = useMemo(() => {
    let filtered = enrollments;

    if (selectedClass !== "all") {
      filtered = filtered.filter((e) => 
        (e.class_name_from_ref || e.class_name) === selectedClass
      );
    }

    if (showActiveSearchOnly) {
      filtered = filtered.filter(
        (e) => e.company?.toLowerCase() === "en recherche active"
      );
    }

    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.first_name?.toLowerCase().includes(term) ||
          e.last_name?.toLowerCase().includes(term) ||
          e.company?.toLowerCase().includes(term) ||
          e.academic_background?.toLowerCase().includes(term)
      );
    }

    // Tri optimisé
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return (a.last_name || '').localeCompare(b.last_name || '');
        case "nameDesc":
          return (b.last_name || '').localeCompare(a.last_name || '');
        case "class":
          return (a.class_name_from_ref || a.class_name || '').localeCompare(
            b.class_name_from_ref || b.class_name || ''
          );
        case "ageAsc":
          if (a.age === null) return 1;
          if (b.age === null) return -1;
          return (a.age || 0) - (b.age || 0);
        case "ageDesc":
          if (a.age === null) return 1;
          if (b.age === null) return -1;
          return (b.age || 0) - (a.age || 0);
        case "createdAt":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [enrollments, selectedClass, debouncedSearchTerm, showActiveSearchOnly, sortBy]);

  const exportToCSV = () => {
    const headers = [
      "Prénom",
      "Nom",
      "Âge",
      "Parcours académique",
      "Entreprise",
      "Classe",
    ];

    const csvData = filteredEnrollments.map((enrollment) => [
      enrollment.first_name || '',
      enrollment.last_name || '',
      enrollment.age || "",
      enrollment.academic_background || "",
      enrollment.company || "",
      enrollment.class_name_from_ref || enrollment.class_name || '',
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

  if (isLoading) {
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
            {filteredEnrollments.length} / {enrollments.length} {filteredEnrollments.length === 1 ? t("directory.student") : t("directory.studentsCount")} · {t("directory.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="default">
            <Download className="w-4 h-4 mr-2" />
            {t("directory.exportCSV")}
          </Button>
          <ImportStudentsDialog onImportComplete={() => {}} />
          <AddStudentDialog onStudentAdded={() => {}} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={selectedSchoolYearId} onValueChange={setSelectedSchoolYearId}>
            <SelectTrigger className="md:w-[200px]">
              <SelectValue placeholder="Année scolaire" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears?.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.label} {year.is_active && '✓'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <SelectItem value="nameAsc">A → Z</SelectItem>
              <SelectItem value="nameDesc">Z → A</SelectItem>
              <SelectItem value="class">Classe</SelectItem>
              <SelectItem value="ageAsc">Âge (jeune → âgé)</SelectItem>
              <SelectItem value="ageDesc">Âge (âgé → jeune)</SelectItem>
              <SelectItem value="createdAt">Récemment ajouté</SelectItem>
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

      {filteredEnrollments.length === 0 ? (
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
          {filteredEnrollments.map((enrollment) => (
            <StudentCard 
              key={enrollment.id}
              enrollmentId={enrollment.id}
              schoolYear={enrollment.school_year_label}
              student={{
                id: enrollment.student_id,
                first_name: enrollment.first_name || '',
                last_name: enrollment.last_name || '',
                class_name: enrollment.class_name_from_ref || enrollment.class_name || '',
                photo_url: enrollment.photo_url || null,
                birth_date: enrollment.birth_date || null,
                age: enrollment.age || null,
                company: enrollment.company || null,
                academic_background: enrollment.academic_background || null,
                special_needs: enrollment.special_needs || null,
              }} 
              onUpdate={() => {}} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;
