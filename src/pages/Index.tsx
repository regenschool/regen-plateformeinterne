import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Users, Brain, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/directory");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-12">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                {t("index.title")}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                {t("index.subtitle")}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">{t("index.directoryTitle")}</h3>
              <p className="text-muted-foreground">
                {t("index.directoryDesc")}
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold">{t("index.quizTitle")}</h3>
              <p className="text-muted-foreground">
                {t("index.quizDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="text-lg px-8 py-6 gap-2 group"
            >
              {t("index.getStarted")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("index.signupLogin")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
