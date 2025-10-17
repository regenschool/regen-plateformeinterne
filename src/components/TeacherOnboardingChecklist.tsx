import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type OnboardingItem = {
  id: string;
  item_name: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  category_id: string | null;
  document_category?: {
    name: string;
  };
};

export function TeacherOnboardingChecklist() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["teacher-onboarding-checklist"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("onboarding_checklist")
        .select(`
          *,
          document_category:document_categories(name)
        `)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as OnboardingItem[];
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("onboarding_checklist")
        .update({
          is_completed: !is_completed,
          completed_at: !is_completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-onboarding-checklist"] });
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mon parcours d'intégration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mon parcours d'intégration</CardTitle>
            <CardDescription>
              Suivez votre progression dans les étapes d'intégration
            </CardDescription>
          </div>
          <Badge variant={progress === 100 ? "default" : "secondary"} className="text-base px-4 py-2">
            {completed}/{total}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune tâche d'intégration pour le moment
          </p>
        ) : (
          <div className="space-y-2 pt-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  toggleCompletionMutation.mutate({
                    id: item.id,
                    is_completed: item.is_completed,
                  })
                }
                className="w-full flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div className="mt-0.5">
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium text-sm ${
                      item.is_completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.item_name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                  )}
                  {item.document_category && (
                    <div className="flex items-center gap-1 mt-2">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Lié à : {item.document_category.name}
                      </span>
                    </div>
                  )}
                  {item.completed_at && (
                    <p className="text-xs text-green-600 mt-1">
                      Complété le {new Date(item.completed_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
