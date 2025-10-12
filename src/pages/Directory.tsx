import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentCard } from "@/components/StudentCard";
import { Sprout, Download, ArrowUpDown, Trash2, UserMinus, UserX, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useSchoolYears } from "@/hooks/useReferentials";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lazy load dialogs pour réduire le bundle initial
const AddStudentDialog = lazy(() => import("@/components/AddStudentDialog").then(m => ({ default: m.AddStudentDialog })));
const ImportStudentsDialog = lazy(() => import("@/components/ImportStudentsDialog").then(m => ({ default: m.ImportStudentsDialog })));

const ITEMS_PER_PAGE = 24; // Pagination : 24 étudiants par page

const Directory = () => {
  const { t } = useLanguage();
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveSearchOnly, setShowActiveSearchOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"nameAsc" | "nameDesc" | "class" | "ageAsc" | "ageDesc" | "createdAt">("nameAsc");
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showPermanentDeleteAllDialog, setShowPermanentDeleteAllDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data: schoolYears } = useSchoolYears();
  const { data: enrollments = [], isLoading, refetch } = useEnrollments({ 
    schoolYearId: selectedSchoolYearId 
  });

  // Récupérer l'userId au montage
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Charger toutes les notes en une seule requête quand les enrollments changent
  useEffect(() => {
    const loadAllNotes = async () => {
      if (!userId || enrollments.length === 0) return;

      const studentIds = enrollments.map(e => e.student_id);
      
      const { data, error } = await supabase
        .from('user_notes')
        .select('student_id, note')
        .eq('user_id', userId)
        .in('student_id', studentIds);

      if (error) {
        console.error('Error loading notes:', error);
        return;
      }

      const notesMap: Record<string, string> = {};
      data?.forEach(note => {
        if (note.note) {
          notesMap[note.student_id] = note.note;
        }
      });
      setUserNotes(notesMap);
    };

    loadAllNotes();
  }, [userId, enrollments]);

  // Auto-sélectionner l'année en cours au chargement
  useEffect(() => {
    if (schoolYears?.length && !selectedSchoolYearId) {
      const today = new Date();
      const currentYear = schoolYears.find(sy => {
        const start = new Date(sy.start_date);
        const end = new Date(sy.end_date);
        return today >= start && today <= end;
      });
      
      const yearToSelect = currentYear || schoolYears.find(sy => sy.is_active) || schoolYears[0];
      if (yearToSelect) setSelectedSchoolYearId(yearToSelect.id);
    }
  }, [schoolYears, selectedSchoolYearId]);

  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, debouncedSearchTerm, showActiveSearchOnly, sortBy]);

  // Extraire les classes uniques avec useMemo
  const classes = useMemo(() => {
    const uniqueClasses = new Set(enrollments.map(e => e.class_name_from_ref || e.class_name).filter(Boolean));
    return Array.from(uniqueClasses).sort();
  }, [enrollments]);

  // Filtrage et tri optimisé avec useMemo
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
        case "ageAsc": {
          const ageA = calculateAge(a.birth_date);
          const ageB = calculateAge(b.birth_date);
          if (ageA === null && ageB === null) return 0;
          if (ageA === null) return 1;
          if (ageB === null) return -1;
          return ageA - ageB;
        }
        case "ageDesc": {
          const ageA = calculateAge(a.birth_date);
          const ageB = calculateAge(b.birth_date);
          if (ageA === null && ageB === null) return 0;
          if (ageA === null) return 1;
          if (ageB === null) return -1;
          return ageB - ageA;
        }
        case "createdAt":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [enrollments, selectedClass, debouncedSearchTerm, showActiveSearchOnly, sortBy]);

  // Pagination des résultats filtrés
  const paginatedEnrollments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEnrollments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEnrollments, currentPage]);

  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);

  // Callbacks optimisés avec useCallback
  const exportToCSV = useCallback(() => {
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
  }, [filteredEnrollments, t]);

  const handleDeleteAllDisplayed = useCallback(async () => {
    setIsDeleting(true);
    try {
      const enrollmentIds = filteredEnrollments.map(e => e.id);
      
      for (const id of enrollmentIds) {
        await supabase.from('student_enrollments').delete().eq('id', id);
      }
      
      toast.success(`${enrollmentIds.length} étudiant(s) désinscrit(s) de cette année`);
      refetch();
      setShowDeleteAllDialog(false);
    } catch (error: any) {
      toast.error('Erreur lors de la désinscription : ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  }, [filteredEnrollments, refetch]);

  const handlePermanentDeleteAllDisplayed = useCallback(async () => {
    setIsDeleting(true);
    try {
      const studentIds = filteredEnrollments.map(e => e.student_id);
      const uniqueStudentIds = [...new Set(studentIds)];
      
      for (const id of uniqueStudentIds) {
        await supabase.from('students').delete().eq('id', id);
      }
      
      toast.success(`${uniqueStudentIds.length} étudiant(s) supprimé(s) définitivement de toutes les années`);
      refetch();
      setShowPermanentDeleteAllDialog(false);
    } catch (error: any) {
      toast.error('Erreur lors de la suppression : ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  }, [filteredEnrollments, refetch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="default"
            title="Actualiser les données"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="default"
                disabled={filteredEnrollments.length === 0}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer tout ({filteredEnrollments.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => setShowDeleteAllDialog(true)}
                className="text-orange-600 focus:text-orange-600"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Désinscrire de {schoolYears?.find(y => y.id === selectedSchoolYearId)?.label || "cette année"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowPermanentDeleteAllDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialogs de suppression */}
          <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Désinscrire {filteredEnrollments.length} étudiant(s) de {schoolYears?.find(y => y.id === selectedSchoolYearId)?.label} ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Les {filteredEnrollments.length} étudiant(s) affiché(s) seront désinscrit(s) de cette année scolaire.
                  {searchTerm || selectedClass !== "all" ? (
                    <span className="block mt-2 text-orange-600 font-medium">
                      ⚠️ Attention : seuls les étudiants filtrés seront désinscrit(s) !
                    </span>
                  ) : null}
                  <span className="block mt-2">
                    Ils resteront visibles dans les autres années scolaires.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAllDisplayed}
                  disabled={isDeleting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isDeleting ? "Désinscription..." : "Désinscrire"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showPermanentDeleteAllDialog} onOpenChange={setShowPermanentDeleteAllDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ Suppression définitive de {[...new Set(filteredEnrollments.map(e => e.student_id))].length} étudiant(s)</AlertDialogTitle>
                <AlertDialogDescription>
                  Les {filteredEnrollments.length} étudiant(s) affiché(s) seront supprimés de <strong>toutes les années scolaires</strong>.
                  {searchTerm || selectedClass !== "all" ? (
                    <span className="block mt-2 text-orange-600 font-medium">
                      ⚠️ Attention : seuls les étudiants filtrés seront supprimés !
                    </span>
                  ) : null}
                  <span className="block mt-2 font-bold text-destructive">
                    Cette action est irréversible.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handlePermanentDeleteAllDisplayed}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={exportToCSV} variant="outline" size="default">
            <Download className="w-4 h-4 mr-2" />
            {t("directory.exportCSV")}
          </Button>
          <Suspense fallback={<Button variant="outline" disabled>Chargement...</Button>}>
            <ImportStudentsDialog 
              onImportComplete={() => refetch()} 
              selectedSchoolYearId={selectedSchoolYearId}
            />
          </Suspense>
          <Suspense fallback={<Button disabled>Chargement...</Button>}>
            <AddStudentDialog onStudentAdded={() => refetch()} />
          </Suspense>
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

        <div className="flex items-center gap-2">
          <Checkbox
            id="active-search"
            checked={showActiveSearchOnly}
            onCheckedChange={(checked) => setShowActiveSearchOnly(checked === true)}
          />
          <Label htmlFor="active-search" className="cursor-pointer">
            {t("directory.showOnlyActiveSearch")}
          </Label>
        </div>
      </div>

      {paginatedEnrollments.length === 0 ? (
        <div className="text-center py-12">
          <Sprout className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{t("directory.noStudents")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedEnrollments.map((enrollment) => {
              const student = {
                id: enrollment.student_id,
                first_name: enrollment.first_name,
                last_name: enrollment.last_name,
                photo_url: enrollment.photo_url,
                age: enrollment.age,
                birth_date: enrollment.birth_date,
                academic_background: enrollment.academic_background,
                company: enrollment.company,
                class_name: enrollment.class_name_from_ref || enrollment.class_name,
                special_needs: enrollment.special_needs,
              };

              return (
                <StudentCard
                  key={enrollment.id}
                  student={student}
                  enrollmentId={enrollment.id}
                  schoolYear={schoolYears?.find(y => y.id === selectedSchoolYearId)?.label}
                  userId={userId}
                  initialNote={userNotes[enrollment.student_id]}
                  onUpdate={() => refetch()}
                  onNoteUpdate={(studentId, note) => {
                    setUserNotes(prev => ({
                      ...prev,
                      [studentId]: note
                    }));
                  }}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Afficher les 3 premières pages, la page courante +/- 1, et les 3 dernières
                  if (
                    page <= 3 || 
                    page >= totalPages - 2 || 
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === 4 && currentPage > 5) {
                    return <span key="dots1" className="px-2">...</span>;
                  } else if (page === totalPages - 3 && currentPage < totalPages - 4) {
                    return <span key="dots2" className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Directory;
