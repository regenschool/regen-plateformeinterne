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

type NewSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: string, teacherName: string, schoolYear: string, semester: string) => void;
  defaultSchoolYear?: string;
  defaultSemester?: string;
};

const currentYear = new Date().getFullYear();
const schoolYears = [
  `${currentYear - 1}-${currentYear}`,
  `${currentYear}-${currentYear + 1}`,
  `${currentYear + 1}-${currentYear + 2}`,
];

export const NewSubjectDialog = ({ open, onClose, onSubjectCreated, defaultSchoolYear, defaultSemester }: NewSubjectDialogProps) => {
  const { t } = useLanguage();
  const [teacherName, setTeacherName] = useState("");
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear || schoolYears[1]);
  const [semester, setSemester] = useState(defaultSemester || "");
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    if (defaultSchoolYear) setSchoolYear(defaultSchoolYear);
    if (defaultSemester) setSemester(defaultSemester);
  }, [defaultSchoolYear, defaultSemester]);

  const semesters = [
    { value: "Semestre 1", label: t("grades.semester1") },
    { value: "Semestre 2", label: t("grades.semester2") },
    { value: "Année complète", label: t("grades.fullYear") },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherName.trim()) {
      toast.error(t("grades.teacherFullName"));
      return;
    }

    if (!schoolYear) {
      toast.error(t("grades.selectSchoolYear"));
      return;
    }

    if (!semester) {
      toast.error(t("grades.selectSemester"));
      return;
    }

    if (!subjectName.trim()) {
      toast.error(t("grades.subjectName"));
      return;
    }

    onSubjectCreated(subjectName.trim(), teacherName.trim(), schoolYear, semester);
    
    // Reset form
    setTeacherName("");
    setSchoolYear(defaultSchoolYear || schoolYears[1]);
    setSemester(defaultSemester || "");
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
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSchoolYear")} />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("grades.semesterLabel")} *</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder={t("grades.selectSemester")} />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem.value} value={sem.value}>
                    {sem.label}
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
