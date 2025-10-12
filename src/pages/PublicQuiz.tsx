import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Check, X } from "lucide-react";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  class_name: string;
};

const PublicQuiz = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [options, setOptions] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    if (linkId) {
      validateLink();
    }
  }, [linkId]);

  const validateLink = async () => {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from("public_quiz_links")
        .select("*")
        .eq("id", linkId)
        .eq("is_active", true)
        .maybeSingle();

      if (linkError) throw linkError;

      if (!linkData) {
        toast.error("Ce lien de quiz n'existe pas ou a expiré");
        setLinkValid(false);
        setLoading(false);
        return;
      }

      // Check expiration
      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        toast.error("Ce lien de quiz a expiré");
        setLinkValid(false);
        setLoading(false);
        return;
      }

      setLinkValid(true);
      
      // Increment access count
      await supabase
        .from("public_quiz_links")
        .update({ access_count: linkData.access_count + 1 })
        .eq("id", linkId);

      // Fetch all available classes
      await fetchClasses();
      
      setLoading(false);
    } catch (error) {
      console.error("Error validating link:", error);
      toast.error("Erreur lors de la validation du lien");
      setLinkValid(false);
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("class_name")
        .order("class_name");

      if (error) throw error;

      if (data) {
        const uniqueClasses = Array.from(new Set(data.map((s) => s.class_name)));
        setClasses(uniqueClasses);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
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

      if (error) throw error;

      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setStudents(shuffled);
        setQuizStarted(true);
        generateOptions(shuffled[0], shuffled);
      } else {
        toast.error("Aucun étudiant trouvé dans cette classe");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
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
        setQuizCompleted(true);
      }
    }, 400);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md border-destructive/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground">Lien invalide</h2>
            <p className="text-muted-foreground">
              Ce lien de quiz n'existe pas ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / students.length) * 100);
    const getMessage = () => {
      if (percentage === 100) {
        return {
          title: "Parfait !",
          message: "Vous avez reconnu tous les élèves ! Incroyable ! 🎉",
          emoji: "🌟"
        };
      } else if (percentage >= 80) {
        return {
          title: "Très bien !",
          message: "Excellent travail ! Vous connaissez bien cette classe.",
          emoji: "✨"
        };
      } else if (percentage >= 60) {
        return {
          title: "Pas mal !",
          message: "C'est un bon début. Continuez à pratiquer !",
          emoji: "🌱"
        };
      } else {
        return {
          title: "Continuez !",
          message: "Avec de la pratique, vous allez vous améliorer !",
          emoji: "🎯"
        };
      }
    };

    const result = getMessage();

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-xl">
          <CardContent className="p-12 text-center space-y-8">
            <div className="text-7xl mb-2">{result.emoji}</div>
            <div>
              <h2 className="text-4xl font-bold mb-4 text-foreground">{result.title}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto mb-6">
                {result.message}
              </p>
              <div className="inline-block bg-primary/10 px-8 py-4 rounded-full border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Score: <span className="text-3xl font-bold text-primary">{score}</span> / {students.length}
                </p>
              </div>
            </div>
            <Button onClick={resetQuiz} variant="outline" size="lg">
              Recommencer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-2xl border-primary/20 shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-primary mx-auto opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 blur-xl"></div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground">Quiz d'Entraînement</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Testez vos connaissances et apprenez à reconnaître les élèves
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Choisissez votre classe</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="Sélectionner une classe" />
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
              <Button onClick={startQuiz} disabled={!selectedClass} className="w-full" size="lg">
                Commencer le Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStudent = students[currentIndex];

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-3xl w-full">
        <div className="mb-6 flex items-center justify-center">
          <div className="text-sm font-medium">
            Question {currentIndex + 1} sur {students.length} • Score: {score}
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
              <h3 className="text-2xl font-bold">Qui est-ce ?</h3>
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
    </div>
  );
};

export default PublicQuiz;
