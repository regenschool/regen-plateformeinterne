import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Network, Lightbulb, LogOut, Languages, ClipboardList, User, Settings, Calendar } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const { isAdmin, toggleAdmin } = useAdmin();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Regen School</h1>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "Espace Administrateur" : t("nav.teachersSpace")}
                </p>
              </div>
            </div>

            {session && (
              <div className="flex items-center gap-3">
                {/* DEV MODE TOGGLE - Design subtil */}
                <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md transition-all">
                  <Label 
                    htmlFor="dev-mode" 
                    className="text-xs font-medium text-blue-700 dark:text-blue-400 cursor-pointer whitespace-nowrap select-none"
                  >
                    {isAdmin ? "Admin" : "Enseignant"}
                  </Label>
                  <Switch
                    id="dev-mode"
                    checked={isAdmin}
                    onCheckedChange={toggleAdmin}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="h-5 w-px bg-border/50" />

                <Button
                  variant={isActive("/directory") ? "default" : "ghost"}
                  onClick={() => navigate("/directory", { replace: true })}
                  className="gap-2"
                >
                  <Network className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nav.ecosystem")}</span>
                </Button>
                <Button
                  variant={isActive("/quiz") ? "default" : "ghost"}
                  onClick={() => navigate("/quiz", { replace: true })}
                  className="gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nav.quiz")}</span>
                </Button>
                <Button
                  variant={isActive("/grades") ? "default" : "ghost"}
                  onClick={() => navigate("/grades", { replace: true })}
                  className="gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nav.grades")}</span>
                </Button>
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  onClick={() => navigate("/profile", { replace: true })}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profil</span>
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant={isActive("/year-transition") ? "default" : "ghost"}
                      onClick={() => navigate("/year-transition", { replace: true })}
                      className="gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Passage d'année</span>
                    </Button>
                    <Button
                      variant={isActive("/settings") ? "default" : "ghost"}
                      onClick={() => navigate("/settings", { replace: true })}
                      className="gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Paramètres</span>
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Languages className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card z-50">
                    <DropdownMenuItem 
                      onClick={() => setLanguage("en")}
                      className={language === "en" ? "bg-primary/10" : ""}
                    >
                      🇬🇧 English
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLanguage("fr")}
                      className={language === "fr" ? "bg-primary/10" : ""}
                    >
                      🇫🇷 Français
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nav.logout")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-muted-foreground text-center italic">
            "{t("footer.quote")}"
          </p>
        </div>
      </footer>
    </div>
  );
};
