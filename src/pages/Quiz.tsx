import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Check, X, Award, ArrowLeft } from "lucide-react";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  class_name: string;
};

const Quiz = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchClasses();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || null);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("students")
      .select("class_name")
      .order("class_name");

    if (data) {
      const uniqueClasses = Array.from(new Set(data.map((s) => s.class_name)));
      setClasses(uniqueClasses);
    }
  };

  const startQuiz = async () => {
    if (!selectedClass) return;

    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name, photo_url, class_name")
      .eq("class_name", selectedClass);

    if (data && data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setStudents(shuffled);
      setQuizStarted(true);
      generateOptions(shuffled[0], shuffled);
    } else {
      toast.error("No students found in this class");
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
      await supabase.from("quiz_scores").insert({
        user_id: userId,
        class_name: selectedClass,
        score: finalScore,
        total: students.length,
      });
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
          title: "Remarquable !",
          message: "Vous connaissez parfaitement les étudiants que vous accompagnez à devenir des décideurs éclairés, capables de construire un monde compatible avec les limites planétaires.",
          emoji: "🌟"
        };
      } else if (percentage >= 80) {
        return {
          title: "Très bien !",
          message: "Vous connaissez bien les étudiants que vous accompagnez à devenir des décideurs éclairés de demain.",
          emoji: "✨"
        };
      } else if (percentage >= 60) {
        return {
          title: "Bon début !",
          message: "Continuez à tisser des liens avec vos étudiants. Mieux vous les connaissez, mieux vous les accompagnez à devenir des décideurs éclairés.",
          emoji: "🌱"
        };
      } else {
        return {
          title: "Un point de départ",
          message: "Prenez le temps de mieux connaître vos étudiants pour les accompagner efficacement vers leur rôle de décideurs éclairés.",
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
                  Score : <span className="text-3xl font-bold text-primary">{score}</span> / {students.length}
                </p>
              </div>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={resetQuiz} variant="outline" size="lg">
                Autre classe
              </Button>
              <Button onClick={() => navigate("/directory")} size="lg">
                Retour à l'écosystème
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
              <h2 className="text-3xl font-bold text-foreground">Quiz de l'écosystème</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Testez votre connaissance des décideurs éclairés qui construisent avec vous un monde compatible avec les limites planétaires
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Sélectionnez une classe</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="Choisir une classe..." />
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
                Commencer le quiz
              </Button>
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
          Exit Quiz
        </Button>
        <div className="text-sm font-medium">
          Question {currentIndex + 1} of {students.length} • Score: {score}
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
            <h3 className="text-2xl font-bold">Who is this?</h3>
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
