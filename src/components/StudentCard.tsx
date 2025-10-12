import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Briefcase, GraduationCap, Edit3, Save, X, Trash2, AlertCircle, Check, UserMinus, UserX } from "lucide-react";
import { EditStudentDialog } from "./EditStudentDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeleteEnrollment, useDeleteStudentPermanently } from "@/hooks/useEnrollments";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
};

type StudentCardProps = {
  student: Student;
  enrollmentId?: string;
  schoolYear?: string;
  userId?: string | null;
  initialNote?: string;
  onUpdate: () => void;
  onNoteUpdate?: (studentId: string, note: string) => void;
};

export const StudentCard = ({ 
  student, 
  enrollmentId, 
  schoolYear, 
  userId: propUserId, 
  initialNote = "",
  onUpdate,
  onNoteUpdate 
}: StudentCardProps) => {
  const { t } = useLanguage();
  const deleteEnrollment = useDeleteEnrollment();
  const deleteStudentPermanently = useDeleteStudentPermanently();
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  
  // Inline editing states for academic_background and company
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [academicValue, setAcademicValue] = useState(student.academic_background || "");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyValue, setCompanyValue] = useState(student.company || "");

  // Mettre à jour les notes quand initialNote change
  useEffect(() => {
    setNote(initialNote);
    setSavedNote(initialNote);
  }, [initialNote]);

  // Force recalculation when student data changes
  const displayAge = React.useMemo(
    () => student.birth_date ? calculateAge(student.birth_date) : student.age,
    [student.birth_date, student.age]
  );

  const saveNote = async () => {
    if (!propUserId) {
      toast.error(t("studentCard.loginToSaveNotes"));
      return;
    }

    try {
      const { error } = await supabase
        .from("user_notes")
        .upsert(
          { user_id: propUserId, student_id: student.id, note: note.trim() },
          { onConflict: "user_id,student_id" }
        );

      if (error) throw error;

      setSavedNote(note);
      setIsEditingNote(false);
      onNoteUpdate?.(student.id, note);
      toast.success(t("studentCard.noteSaved"));
    } catch (error: any) {
      toast.error(t("studentCard.failedToSaveNote"));
    }
  };

  const cancelEdit = () => {
    setNote(savedNote);
    setIsEditingNote(false);
  };

  const handleDeleteEnrollment = async () => {
    if (!enrollmentId) {
      toast.error("ID d'inscription manquant");
      return;
    }
    await deleteEnrollment.mutateAsync(enrollmentId);
    onUpdate();
    setShowDeleteDialog(false);
  };

  const handleDeleteStudentPermanently = async () => {
    await deleteStudentPermanently.mutateAsync(student.id);
    onUpdate();
    setShowPermanentDeleteDialog(false);
  };

  const saveAcademicBackground = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ academic_background: academicValue.trim() || null })
        .eq("id", student.id);

      if (error) throw error;

      setIsEditingAcademic(false);
      toast.success("Parcours académique mis à jour");
      onUpdate();
    } catch (error: any) {
      toast.error("Échec de la mise à jour");
      console.error("Failed to update academic background:", error);
    }
  };

  const saveCompany = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ company: companyValue.trim() || null })
        .eq("id", student.id);

      if (error) throw error;

      setIsEditingCompany(false);
      toast.success("Entreprise mise à jour");
      onUpdate();
    } catch (error: any) {
      toast.error("Échec de la mise à jour");
      console.error("Failed to update company:", error);
    }
  };

  const handleAcademicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveAcademicBackground();
    } else if (e.key === "Escape") {
      setAcademicValue(student.academic_background || "");
      setIsEditingAcademic(false);
    }
  };

  const handleCompanyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCompany();
    } else if (e.key === "Escape") {
      setCompanyValue(student.company || "");
      setIsEditingCompany(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative w-full h-40 bg-gradient-to-br from-primary/10 to-accent/10">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={`${student.first_name} ${student.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl font-bold text-primary/30">
                {student.first_name[0]}
                {student.last_name[0]}
              </div>
            </div>
          )}
          <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
            {student.class_name}
          </div>
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            <EditStudentDialog student={student} onStudentUpdated={onUpdate} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7 bg-white/90 hover:bg-destructive/90 hover:text-destructive-foreground border-border/50">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {enrollmentId && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Désinscrire de {schoolYear || "cette année"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowPermanentDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog pour désinscrire de l'année */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Désinscrire de {schoolYear || "cette année"} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    L'étudiant <strong>{student.first_name} {student.last_name}</strong> sera désinscrit de {schoolYear || "cette année scolaire"}.
                    Il restera visible dans les autres années.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteEnrollment} className="bg-orange-600 hover:bg-orange-700">
                    Désinscrire
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Dialog pour suppression définitive */}
            <AlertDialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Suppression définitive</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{student.first_name} {student.last_name}</strong> sera supprimé de <strong>toutes les années scolaires</strong>.
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStudentPermanently} className="bg-destructive hover:bg-destructive/90">
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="text-lg font-bold text-foreground leading-tight">
            {student.first_name} {student.last_name}
          </h3>
          {displayAge && <p className="text-xs text-muted-foreground">{displayAge} {t("studentCard.yearsOld")}</p>}
        </div>

        <div 
          className="flex items-start gap-1.5 text-xs group cursor-pointer hover:bg-accent/30 rounded px-1 -mx-1 py-0.5 transition-colors"
          onClick={() => !isEditingAcademic && setIsEditingAcademic(true)}
        >
          <GraduationCap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          {isEditingAcademic ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                value={academicValue}
                onChange={(e) => setAcademicValue(e.target.value)}
                onKeyDown={handleAcademicKeyDown}
                onBlur={saveAcademicBackground}
                placeholder={t("studentCard.notSpecified")}
                className="h-6 text-xs flex-1"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  saveAcademicBackground();
                }}
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground line-clamp-1 flex-1 group-hover:text-foreground transition-colors">
              {student.academic_background || t("studentCard.notSpecified")}
            </span>
          )}
        </div>

        <div 
          className="flex items-start gap-1.5 text-xs group cursor-pointer hover:bg-accent/30 rounded px-1 -mx-1 py-0.5 transition-colors"
          onClick={() => !isEditingCompany && setIsEditingCompany(true)}
        >
          <Briefcase className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          {isEditingCompany ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                value={companyValue}
                onChange={(e) => setCompanyValue(e.target.value)}
                onKeyDown={handleCompanyKeyDown}
                onBlur={saveCompany}
                placeholder={t("studentCard.notSpecified")}
                className="h-6 text-xs flex-1"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  saveCompany();
                }}
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground line-clamp-1 flex-1 group-hover:text-foreground transition-colors">
              {student.company || t("studentCard.notSpecified")}
            </span>
          )}
        </div>

        {student.special_needs && (
          <div className="flex items-start gap-1.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-1">{student.special_needs}</span>
          </div>
        )}

        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">{t("studentCard.privateNotes")}</label>
            {!isEditingNote && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingNote(true)}
                className="h-8 px-2"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            )}
          </div>

          {isEditingNote ? (
            <div className="space-y-1.5">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("studentCard.addPrivateNotes")}
                className="min-h-[60px] text-xs"
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={saveNote} className="flex-1 h-7 text-xs">
                  <Save className="w-3 h-3 mr-1" />
                  {t("studentCard.save")}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground min-h-[50px] line-clamp-3">
              {savedNote || t("studentCard.noNotes")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
