import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Network, Lightbulb, LogOut, Languages, ClipboardList, User, Users, TestTube } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [devMode, setDevMode] = useState(() => {
    return localStorage.getItem("dev-admin-mode") === "true";
  });
  const { t, language, setLanguage } = useLanguage();

  const toggleDevMode = (checked: boolean) => {
    setDevMode(checked);
    localStorage.setItem("dev-admin-mode", String(checked));
    window.dispatchEvent(new Event("dev-mode-change"));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

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
                <p className="text-xs text-muted-foreground">{t("nav.teachersSpace")}</p>
              </div>
            </div>

            {session && (
              <div className="flex items-center gap-3">
                {/* DEV MODE TOGGLE */}
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <TestTube className="w-4 h-4 text-yellow-600" />
                  <Label htmlFor="dev-mode" className="text-xs text-yellow-700 cursor-pointer whitespace-nowrap">
                    {devMode ? "Admin" : "Prof"}
                  </Label>
                  <Switch
                    id="dev-mode"
                    checked={devMode}
                    onCheckedChange={toggleDevMode}
                  />
                </div>

                <div className="h-6 w-px bg-border" />

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
                {(isAdmin || devMode) && (
                  <Button
                    variant={isActive("/users") ? "default" : "ghost"}
                    onClick={() => navigate("/users", { replace: true })}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Utilisateurs</span>
                  </Button>
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
