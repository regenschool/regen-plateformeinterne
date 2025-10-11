import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Briefcase, GraduationCap, Edit3, Save, X, Trash2, AlertCircle } from "lucide-react";
import { EditStudentDialog } from "./EditStudentDialog";
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

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
  special_needs: string | null;
};

type StudentCardProps = {
  student: Student;
  onUpdate: () => void;
};

export const StudentCard = ({ student, onUpdate }: StudentCardProps) => {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNote();
    }
  }, [userId, student.id]);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || null);
  };

  const fetchNote = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("user_notes")
      .select("note")
      .eq("user_id", userId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (data?.note) {
      setNote(data.note);
      setSavedNote(data.note);
    }
  };

  const saveNote = async () => {
    if (!userId) {
      toast.error("Please log in to save notes");
      return;
    }

    try {
      const { error } = await supabase.from("user_notes").upsert({
        user_id: userId,
        student_id: student.id,
        note: note,
      });

      if (error) throw error;

      setSavedNote(note);
      setIsEditingNote(false);
      toast.success("Note saved");
    } catch (error: any) {
      toast.error("Failed to save note");
    }
  };

  const cancelEdit = () => {
    setNote(savedNote);
    setIsEditingNote(false);
  };

  const deleteStudent = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      toast.success("Étudiant supprimé");
      onUpdate();
    } catch (error: any) {
      toast.error("Échec de la suppression");
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive" className="h-7 w-7">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {student.first_name} {student.last_name} ?
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteStudent}>Supprimer</AlertDialogAction>
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
          {student.age && <p className="text-xs text-muted-foreground">{student.age} ans</p>}
        </div>

        {student.academic_background && (
          <div className="flex items-start gap-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-1">{student.academic_background}</span>
          </div>
        )}

        <div className="flex items-start gap-1.5 text-xs">
          <Briefcase className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground line-clamp-1">
            {student.company || "Non renseigné"}
          </span>
        </div>

        {student.special_needs && (
          <div className="flex items-start gap-1.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-1">{student.special_needs}</span>
          </div>
        )}

        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Notes privées</label>
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
                placeholder="Ajoutez vos notes privées..."
                className="min-h-[60px] text-xs"
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={saveNote} className="flex-1 h-7 text-xs">
                  <Save className="w-3 h-3 mr-1" />
                  Sauver
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground min-h-[50px] line-clamp-3">
              {savedNote || "Pas de notes. Cliquez pour ajouter."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
