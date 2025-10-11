import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Check, X, ArrowLeft, Share2, Copy, Link as LinkIcon, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  class_name: string;
};

type PublicLink = {
  id: string;
  class_name: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  access_count: number;
};

const Quiz = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [options, setOptions] = useState<Student[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [expirationDays, setExpirationDays] = useState<string>("7");

  useEffect(() => {
    fetchClasses();
    getCurrentUser();
  }, []);
  
  // Real-time subscription for students changes
  useRealtimeSubscription({
    table: "students",
    onChange: useCallback(() => {
      if (selectedClass && quizStarted) {
        // Refetch students if quiz is active
        fetchClasses();
      }
    }, [selectedClass, quizStarted]),
  });

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || null);
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("class_name")
        .order("class_name");

      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }

      if (data) {
        const uniqueClasses = Array.from(new Set(data.map((s) => s.class_name)));
        setClasses(uniqueClasses);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des classes");
    }
  };

  const startQuiz = async () => {
    if (!selectedClass) {
      toast.error("Veuillez sélectionner une classe");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, photo_url, class_name")
        .eq("class_name", selectedClass);

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setStudents(shuffled);
        setQuizStarted(true);
        generateOptions(shuffled[0], shuffled);
      } else {
        toast.error("Aucun étudiant trouvé dans cette classe");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des étudiants");
    }
  };

  const generateOptions = (correctStudent: Student, allStudents: Student[]) => {
    const incorrect = allStudents
      .filter((s) => s.id !== correctStudent.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 1);

    const opts = [...incorrect, correctStudent].sort(() => Math.random() - 0.5);
    setOptions(opts);
  };

  const handleAnswer = (studentId: string) => {
    const correct = studentId === students[currentIndex].id;
    setSelectedAnswer(studentId);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentIndex < students.length - 1) {
        setCurrentIndex(currentIndex + 1);
        generateOptions(students[currentIndex + 1], students);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        finishQuiz(correct);
      }
    }, 400);
  };

  const finishQuiz = async (lastCorrect: boolean) => {
    const finalScore = lastCorrect ? score + 1 : score;
    setQuizCompleted(true);

    if (userId) {
      try {
        const { error } = await supabase.from("quiz_scores").insert({
          user_id: userId,
          class_name: selectedClass,
          score: finalScore,
          total: students.length,
        });

        if (error) {
          console.error("Error saving quiz score:", error);
          toast.error("Erreur lors de la sauvegarde du score");
        }
      } catch (error) {
        console.error("Error saving quiz score:", error);
      }
    }
  };

  const fetchPublicLinks = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("public_quiz_links")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPublicLinks(data || []);
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Erreur lors du chargement des liens");
    }
  };

  const createPublicLink = async () => {
    if (!selectedClass || !userId) return;

    try {
      const expiresAt = expirationDays 
        ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("public_quiz_links")
        .insert({
          created_by: userId,
          class_name: selectedClass,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Lien public créé avec succès !");
      fetchPublicLinks();
      
      // Copy link to clipboard
      const link = `${window.location.origin}/quiz/${data.id}`;
      await navigator.clipboard.writeText(link);
      toast.success("Lien copié dans le presse-papiers !");
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error("Erreur lors de la création du lien");
    }
  };

  const copyLink = async (linkId: string) => {
    const link = `${window.location.origin}/quiz/${linkId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien copié dans le presse-papiers !");
    } catch (error) {
      toast.error("Erreur lors de la copie du lien");
    }
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("public_quiz_links")
        .update({ is_active: !currentStatus })
        .eq("id", linkId);

      if (error) throw error;

      toast.success(currentStatus ? "Lien désactivé" : "Lien activé");
      fetchPublicLinks();
    } catch (error) {
      console.error("Error toggling link:", error);
      toast.error("Erreur lors de la modification du lien");
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("public_quiz_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;

      toast.success("Lien supprimé");
      fetchPublicLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Erreur lors de la suppression du lien");
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setSelectedClass("");
  };

  if (quizCompleted) {
    const percentage = Math.round((score / students.length) * 100);
    const getMessage = () => {
      if (percentage === 100) {
        return {
          title: t("quiz.results.perfect.title"),
          message: t("quiz.results.perfect.message"),
          emoji: "🌟"
        };
      } else if (percentage >= 80) {
        return {
          title: t("quiz.results.good.title"),
          message: t("quiz.results.good.message"),
          emoji: "✨"
        };
      } else if (percentage >= 60) {
        return {
          title: t("quiz.results.decent.title"),
          message: t("quiz.results.decent.message"),
          emoji: "🌱"
        };
      } else {
        return {
          title: t("quiz.results.low.title"),
          message: t("quiz.results.low.message"),
          emoji: "🎯"
        };
      }
    };

    const result = getMessage();

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-xl">
          <CardContent className="p-12 text-center space-y-8">
            <div className="text-7xl mb-2">{result.emoji}</div>
            <div>
              <h2 className="text-4xl font-bold mb-4 text-foreground">{result.title}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto mb-6">
                {result.message}
              </p>
              <div className="inline-block bg-primary/10 px-8 py-4 rounded-full border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  {t("quiz.results.scoreLabel")} <span className="text-3xl font-bold text-primary">{score}</span> / {students.length}
                </p>
              </div>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={resetQuiz} variant="outline" size="lg">
                {t("quiz.results.anotherClass")}
              </Button>
              <Button onClick={() => navigate("/directory")} size="lg">
                {t("quiz.results.backToEcosystem")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-primary mx-auto opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 blur-xl"></div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground">{t("quiz.title")}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("quiz.subtitle")}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">{t("quiz.selectClass")}</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder={t("quiz.chooseClass")} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={startQuiz} disabled={!selectedClass} className="flex-1" size="lg">
                  {t("quiz.startQuiz")}
                </Button>
                <Dialog open={showLinksDialog} onOpenChange={(open) => {
                  setShowLinksDialog(open);
                  if (open) fetchPublicLinks();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" disabled={!selectedClass}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Liens publics
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Gérer les liens publics - {selectedClass}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold">Créer un nouveau lien</h3>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Label htmlFor="expiration">Expiration (jours)</Label>
                            <Input
                              id="expiration"
                              type="number"
                              min="1"
                              value={expirationDays}
                              onChange={(e) => setExpirationDays(e.target.value)}
                              placeholder="7"
                            />
                          </div>
                          <Button onClick={createPublicLink}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Créer le lien
                          </Button>
                        </div>
                      </div>

                      {publicLinks.length > 0 ? (
                        <div className="space-y-3">
                          <h3 className="font-semibold">Liens existants</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Classe</TableHead>
                                <TableHead>Accès</TableHead>
                                <TableHead>Expire le</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {publicLinks.map((link) => (
                                <TableRow key={link.id}>
                                  <TableCell className="font-medium">{link.class_name}</TableCell>
                                  <TableCell>{link.access_count}</TableCell>
                                  <TableCell>
                                    {link.expires_at 
                                      ? new Date(link.expires_at).toLocaleDateString()
                                      : "Jamais"}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      link.is_active 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                    }`}>
                                      {link.is_active ? "Actif" : "Inactif"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyLink(link.id)}
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleLinkStatus(link.id, link.is_active)}
                                      >
                                        {link.is_active ? "Désactiver" : "Activer"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteLink(link.id)}
                                      >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Aucun lien public créé pour cette classe
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStudent = students[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={resetQuiz}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("quiz.exitQuiz")}
        </Button>
        <div className="text-sm font-medium">
          {t("quiz.questionOf")} {currentIndex + 1} {t("quiz.of")} {students.length} • {t("quiz.score")}: {score}
        </div>
      </div>

      <Card>
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden bg-muted border-4 border-primary/20">
              {currentStudent.photo_url ? (
                <img
                  src={currentStudent.photo_url}
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-primary">
                  {currentStudent.first_name[0]}
                  {currentStudent.last_name[0]}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold">{t("quiz.whoIsThis")}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {options.map((option) => {
              const isCorrect = option.id === currentStudent.id;
              const isSelected = selectedAnswer === option.id;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <Button
                  key={option.id}
                  onClick={() => !showFeedback && handleAnswer(option.id)}
                  disabled={showFeedback}
                  variant="outline"
                  className={`h-auto py-6 text-xl justify-between transition-all duration-300 border-primary/20 ${
                    showCorrect ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 scale-105 shadow-lg" : ""
                  } ${showWrong ? "bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-600 opacity-50" : ""} ${
                    !showFeedback ? "hover:scale-102 hover:shadow-md hover:border-primary/40" : ""
                  }`}
                >
                  <span className={`font-semibold ${showCorrect ? "text-emerald-700 dark:text-emerald-400" : ""} ${showWrong ? "text-rose-700 dark:text-rose-400" : ""}`}>
                    {option.first_name} {option.last_name}
                  </span>
                  {showCorrect && <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-200" />}
                  {showWrong && <X className="w-6 h-6 text-rose-600 dark:text-rose-400 animate-in zoom-in duration-200" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;
