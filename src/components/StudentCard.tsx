import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Briefcase, GraduationCap, Edit3, Save, X } from "lucide-react";
import { EditStudentDialog } from "./EditStudentDialog";

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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative w-full h-56 bg-gradient-to-br from-primary/10 to-accent/10">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={`${student.first_name} ${student.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl font-bold text-primary/30">
                {student.first_name[0]}
                {student.last_name[0]}
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {student.class_name}
          </div>
          <div className="absolute top-2 left-2">
            <EditStudentDialog student={student} onStudentUpdated={onUpdate} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {student.first_name} {student.last_name}
          </h3>
          {student.age && <p className="text-sm text-muted-foreground">{student.age} years old</p>}
        </div>

        {student.academic_background && (
          <div className="flex items-start gap-2 text-sm">
            <GraduationCap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{student.academic_background}</span>
          </div>
        )}

        {student.company && (
          <div className="flex items-start gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{student.company}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Private Notes</label>
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
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add your private notes..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveNote} className="flex-1">
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground min-h-[60px]">
              {savedNote || "No notes yet. Click edit to add."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
