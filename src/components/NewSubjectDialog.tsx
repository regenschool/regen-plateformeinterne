import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { toast } from "sonner";
import { useSchoolYears, useAcademicPeriods } from "@/hooks/useReferentials";
import { useTeachers, useAddTeacher } from "@/hooks/useTeachers";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle } from "lucide-react";

// Helper pour faire correspondre un libellé de semestre libre (ex: "Semestre 2")
// avec les libellés des périodes académiques (ex: "S2 2025", "Semestre 2", "P2")
const findMatchingPeriodId = (
  desiredLabel: string | undefined,
  periods?: { id: string; label: string; is_active?: boolean }[]
): string | null => {
  if (!desiredLabel || !periods || periods.length === 0) return null;
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const want = norm(desiredLabel);

  // 1) Exact match
  const exact = periods.find(p => norm(p.label) === want);
  if (exact) return exact.id;

  // 2) Includes match
  const incl = periods.find(p => norm(p.label).includes(want));
  if (incl) return incl.id;

  // 3) Heuristics: map "semestre 1" -> contains "1" or "s1"
  if (want.includes('1')) {
    const s1 = periods.find(p => /(^|\b)(s?1|semestre\s*1)($|\b)/i.test(norm(p.label)) || norm(p.label).includes('s1') || norm(p.label).includes(' 1'));
    if (s1) return s1.id;
  }
  if (want.includes('2')) {
    const s2 = periods.find(p => /(^|\b)(s?2|semestre\s*2)($|\b)/i.test(norm(p.label)) || norm(p.label).includes('s2') || norm(p.label).includes(' 2'));
    if (s2) return s2.id;
  }
  if (want.includes('annee') || want.includes('an ') || want.includes('full')) {
    const full = periods.find(p => norm(p.label).includes('annee') || norm(p.label).includes('full'));
    if (full) return full.id;
  }

  return null;
};
type NewSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: string, teacherName: string, schoolYear: string, semester: string, schoolYearId?: string, academicPeriodId?: string) => void;
  defaultSchoolYear?: string;
  defaultSemester?: string;
  className?: string;
};

export const NewSubjectDialog = ({ 
  open, 
  onClose, 
  onSubjectCreated, 
  defaultSchoolYear, 
  defaultSemester,
  className 
}: NewSubjectDialogProps) => {
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  
  // Teacher selection states
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [showNewTeacherForm, setShowNewTeacherForm] = useState(false);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherFullName, setNewTeacherFullName] = useState("");
  const [newTeacherPhone, setNewTeacherPhone] = useState("");
  
  // Subject data states
  const [schoolYearId, setSchoolYearId] = useState("");
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [currentUserTeacherId, setCurrentUserTeacherId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  const { data: schoolYears } = useSchoolYears();
  const { data: academicPeriods } = useAcademicPeriods(schoolYearId);
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers();
  const addTeacherMutation = useAddTeacher();

  // Get current user's teacher info
  useEffect(() => {
    const fetchCurrentTeacher = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacher) {
        setCurrentUserTeacherId(teacher.user_id);
        setCurrentUserName(teacher.full_name);
        if (!isAdmin) {
          setSelectedTeacherId(teacher.user_id);
        }
      }
    };

    if (open) {
      fetchCurrentTeacher();
    }
  }, [open, isAdmin]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAcademicPeriodId("");
      setSubjectName("");
      if (isAdmin) {
        setSelectedTeacherId("");
      }
    }
  }, [open, isAdmin]);

  // Set default school year from props or active year (with fuzzy matching)
  useEffect(() => {
    if (schoolYears && open) {
      const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const sanitize = (s: string) => norm(s).replace(/\s+/g, '').replace(/[\/]/g, '-');

      if (defaultSchoolYear) {
        const exact = schoolYears.find(y => y.label === defaultSchoolYear);
        if (exact) {
          setSchoolYearId(exact.id);
          return;
        }
        // Fuzzy: handle 2024-2025 vs 2024/2025 or extra text
        const wanted = sanitize(defaultSchoolYear);
        const fuzzy = schoolYears.find(y => sanitize(y.label).includes(wanted) || wanted.includes(sanitize(y.label)));
        if (fuzzy) {
          setSchoolYearId(fuzzy.id);
          return;
        }
      }

      if (!schoolYearId) {
        const activeYear = schoolYears.find(y => y.is_active);
        if (activeYear) {
          setSchoolYearId(activeYear.id);
        }
      }
    }
  }, [schoolYears, defaultSchoolYear, open]);

  // Set default academic period from props or active period
  useEffect(() => {
    if (academicPeriods && schoolYearId && open) {
      // Try to match the provided defaultSemester first
      const matchedId = findMatchingPeriodId(defaultSemester, academicPeriods);
      if (matchedId) {
        setAcademicPeriodId(matchedId);
        return;
      }

      // Then try active period
      const activePeriod = academicPeriods.find(p => p.is_active);
      if (activePeriod) {
        setAcademicPeriodId(activePeriod.id);
        return;
      }

      // Fallback to first
      if (academicPeriods.length > 0) {
        setAcademicPeriodId(academicPeriods[0].id);
      }
    }
  }, [academicPeriods, schoolYearId, defaultSemester, open]);

  const handleCreateNewTeacher = async () => {
    if (!newTeacherEmail || !newTeacherFullName) {
      toast.error("Email et nom complet requis");
      return;
    }

    try {
      // Get user ID from email
      const { data: userId } = await supabase.rpc('get_user_id_from_email', {
        _email: newTeacherEmail
      });

      if (!userId) {
        toast.error("Aucun utilisateur trouvé avec cet email. Créez d'abord l'utilisateur dans Gestion des utilisateurs.");
        return;
      }

      await addTeacherMutation.mutateAsync({
        user_id: userId,
        full_name: newTeacherFullName,
        phone: newTeacherPhone || undefined,
      });

      setSelectedTeacherId(userId);
      setShowNewTeacherForm(false);
      setNewTeacherEmail("");
      setNewTeacherFullName("");
      setNewTeacherPhone("");
      toast.success("Enseignant créé avec succès");
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      toast.error("Erreur lors de la création de l'enseignant");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacherId) {
      toast.error("Veuillez sélectionner un enseignant");
      return;
    }

    if (!schoolYearId) {
      toast.error(t("grades.selectSchoolYear"));
      return;
    }

    if (!academicPeriodId) {
      toast.error(t("grades.selectSemester"));
      return;
    }

    if (!subjectName.trim()) {
      toast.error(t("grades.subjectName"));
      return;
    }

    const selectedSchoolYear = schoolYears?.find(sy => sy.id === schoolYearId);
    const selectedPeriod = academicPeriods?.find(ap => ap.id === academicPeriodId);
    const selectedTeacher = teachers?.find(t => t.user_id === selectedTeacherId);

    if (!selectedSchoolYear || !selectedPeriod || !selectedTeacher) {
      toast.error("Données invalides");
      return;
    }

    onSubjectCreated(
      subjectName.trim(), 
      selectedTeacher.full_name, 
      selectedSchoolYear.label, 
      selectedPeriod.label,
      schoolYearId,
      academicPeriodId
    );
    
    // Reset form
    setSubjectName("");
    if (isAdmin) {
      setSelectedTeacherId("");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("grades.createSubject")}</DialogTitle>
          <DialogDescription className="sr-only">Formulaire de création de matière</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teacher Selection - Different for Admin vs Teacher */}
          {isAdmin ? (
            <div className="space-y-2">
              <Label>{t("grades.teacher")} *</Label>
              {!showNewTeacherForm ? (
                <>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un enseignant" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTeachers ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                      ) : (
                        teachers?.map((teacher) => (
                          <SelectItem key={teacher.user_id} value={teacher.user_id}>
                            {teacher.full_name} {teacher.email ? `(${teacher.email})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowNewTeacherForm(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Créer un nouvel enseignant
                  </Button>
                </>
              ) : (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Nouvel enseignant</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewTeacherForm(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-teacher-email" className="text-xs">Email (utilisateur existant) *</Label>
                    <Input
                      id="new-teacher-email"
                      type="email"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'utilisateur doit déjà exister dans le système
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-teacher-name" className="text-xs">Nom complet *</Label>
                    <Input
                      id="new-teacher-name"
                      value={newTeacherFullName}
                      onChange={(e) => setNewTeacherFullName(e.target.value)}
                      placeholder="Prénom Nom"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-teacher-phone" className="text-xs">Téléphone</Label>
                    <Input
                      id="new-teacher-phone"
                      value={newTeacherPhone}
                      onChange={(e) => setNewTeacherPhone(e.target.value)}
                      placeholder="+33..."
                    />
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleCreateNewTeacher}
                    disabled={addTeacherMutation.isPending}
                  >
                    {addTeacherMutation.isPending ? "Création..." : "Créer et sélectionner"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Enseignant</Label>
              <Input
                value={currentUserName}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                La matière sera automatiquement assignée à votre compte
              </p>
            </div>
          )}

          <div>
            <Label>{t("grades.schoolYearLabel")} *</Label>
            <Select value={schoolYearId} onValueChange={setSchoolYearId}>
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSchoolYear")} />
              </SelectTrigger>
              <SelectContent>
                {schoolYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("grades.semesterLabel")} *</Label>
            <Select 
              value={academicPeriodId} 
              onValueChange={setAcademicPeriodId} 
              disabled={!schoolYearId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSemester")} />
              </SelectTrigger>
              <SelectContent>
                {academicPeriods?.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("grades.subjectName")} *</Label>
            <Input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder={t("grades.subjectPlaceholder")}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("grades.subjectHelp")}
            </p>
          </div>

          {className && (
            <div className="space-y-2">
              <Label>Classe</Label>
              <Input
                value={className}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {t("grades.createButton")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("grades.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
