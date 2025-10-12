import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useSchoolYears, useAcademicPeriods } from "@/hooks/useReferentials";

type NewSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: string, teacherName: string, schoolYear: string, semester: string, schoolYearId?: string, academicPeriodId?: string) => void;
  defaultSchoolYear?: string;
  defaultSemester?: string;
};

export const NewSubjectDialog = ({ open, onClose, onSubjectCreated, defaultSchoolYear, defaultSemester }: NewSubjectDialogProps) => {
  const { t } = useLanguage();
  const [teacherName, setTeacherName] = useState("");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const { data: schoolYears } = useSchoolYears();
  const { data: academicPeriods } = useAcademicPeriods(schoolYearId);

  useEffect(() => {
    if (schoolYears?.length && !schoolYearId) {
      const activeYear = schoolYears.find(sy => sy.is_active);
      if (activeYear) setSchoolYearId(activeYear.id);
    }
  }, [schoolYears, schoolYearId]);

  useEffect(() => {
    if (academicPeriods?.length && !academicPeriodId) {
      const activePeriod = academicPeriods.find(ap => ap.is_active);
      if (activePeriod) setAcademicPeriodId(activePeriod.id);
    }
  }, [academicPeriods, academicPeriodId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherName.trim()) {
      toast.error(t("grades.teacherFullName"));
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

    onSubjectCreated(
      subjectName.trim(), 
      teacherName.trim(), 
      selectedSchoolYear?.label || '', 
      selectedPeriod?.label || '',
      schoolYearId,
      academicPeriodId
    );
    
    // Reset form
    setTeacherName("");
    setSubjectName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("grades.createSubject")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("grades.teacherFullName")} *</Label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder={t("grades.teacherPlaceholder")}
              required
            />
          </div>

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
            <Select value={academicPeriodId} onValueChange={setAcademicPeriodId} disabled={!schoolYearId}>
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
