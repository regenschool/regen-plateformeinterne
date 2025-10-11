import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Brain, Check, X, Trophy, ArrowLeft } from "lucide-react";

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
    }, 800);
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
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
          <CardContent className="p-12 text-center space-y-6">
            <Trophy className="w-20 h-20 text-accent mx-auto" />
            <div>
              <h2 className="text-4xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-xl text-muted-foreground">
                You scored {score} out of {students.length}
              </p>
              <p className="text-3xl font-bold text-primary mt-4">{percentage}%</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline">
                Try Another Class
              </Button>
              <Button onClick={() => navigate("/directory")}>
                Back to Directory
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
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <Brain className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-3xl font-bold">Quiz Mode</h2>
              <p className="text-muted-foreground">
                Test your knowledge of student names and faces
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select a class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class..." />
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
                Start Quiz
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  variant={showCorrect ? "default" : showWrong ? "destructive" : "outline"}
                  className={`h-auto py-4 text-lg justify-between ${
                    showCorrect ? "bg-success hover:bg-success" : ""
                  } ${showWrong ? "bg-error hover:bg-error" : ""}`}
                >
                  <span>
                    {option.first_name} {option.last_name}
                  </span>
                  {showCorrect && <Check className="w-5 h-5" />}
                  {showWrong && <X className="w-5 h-5" />}
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
