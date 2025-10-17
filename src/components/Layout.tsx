import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Network, Lightbulb, LogOut, Languages, ClipboardList, User, Settings, Calendar, FlaskConical, ChevronDown, Shield, Activity, Menu, X } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, hasAdminRole, toggleAdmin } = useAdmin();
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
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Regen School</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {isAdmin ? t("nav.adminSpace") : t("nav.teachersSpace")}
                </p>
              </div>
            </div>

            {session && (
              <>
                {/* Desktop navigation */}
                <div className="hidden lg:flex items-center gap-3">
                  {hasAdminRole && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md">
                      <Label 
                        htmlFor="admin-mode" 
                        className="text-xs font-medium text-blue-700 dark:text-blue-400 cursor-pointer whitespace-nowrap select-none"
                      >
                        {isAdmin ? "Admin" : "Enseignant"}
                      </Label>
                      <Switch
                        id="admin-mode"
                        checked={isAdmin}
                        onCheckedChange={toggleAdmin}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  )}

                  <Button
                    variant={isActive("/directory") ? "default" : "ghost"}
                    onClick={() => navigate("/directory", { replace: true })}
                    className="gap-2"
                  >
                    <Network className="w-4 h-4" />
                    <span>{t("nav.directory")}</span>
                  </Button>
                  <Button
                    variant={isActive("/grades") ? "default" : "ghost"}
                    onClick={() => navigate("/grades", { replace: true })}
                    className="gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>{t("nav.grades")}</span>
                  </Button>
                  {!isAdmin && (
                    <Button
                      variant={isActive("/profile") ? "default" : "ghost"}
                      onClick={() => navigate("/profile", { replace: true })}
                      className="gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>{t("nav.profile")}</span>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant={["/profile", "/settings", "/tests", "/year-transition", "/audit", "/quality", "/quiz"].some(path => isActive(path)) ? "default" : "ghost"}
                        className="gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{isAdmin ? t("nav.management") : "Plus"}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card z-50">
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => navigate("/profile", { replace: true })}>
                            <User className="w-4 h-4 mr-2" />
                            {t("nav.profile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/settings", { replace: true })}>
                            <Settings className="w-4 h-4 mr-2" />
                            {t("nav.settings")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/year-transition", { replace: true })}>
                            <Calendar className="w-4 h-4 mr-2" />
                            {t("nav.yearTransition")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/quality", { replace: true })}>
                            <Activity className="w-4 h-4 mr-2" />
                            {t("nav.quality")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/audit", { replace: true })}>
                            <Shield className="w-4 h-4 mr-2" />
                            {t("nav.audit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/tests", { replace: true })}>
                            <FlaskConical className="w-4 h-4 mr-2" />
                            {t("nav.tests")}
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/quiz", { replace: true })}>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {t("nav.quiz")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <span>{t("nav.logout")}</span>
                  </Button>
                </div>

                {/* Mobile menu button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <div className="flex flex-col gap-4 mt-8">
                      {hasAdminRole && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md">
                          <Label 
                            htmlFor="admin-mode-mobile" 
                            className="text-sm font-medium text-blue-700 dark:text-blue-400"
                          >
                            {isAdmin ? "Mode Admin" : "Mode Enseignant"}
                          </Label>
                          <Switch
                            id="admin-mode-mobile"
                            checked={isAdmin}
                            onCheckedChange={toggleAdmin}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      )}

                      <SheetClose asChild>
                        <Button
                          variant={isActive("/directory") ? "default" : "ghost"}
                          onClick={() => navigate("/directory", { replace: true })}
                          className="justify-start gap-3 w-full"
                        >
                          <Network className="w-5 h-5" />
                          {t("nav.directory")}
                        </Button>
                      </SheetClose>


                      <SheetClose asChild>
                        <Button
                          variant={isActive("/grades") ? "default" : "ghost"}
                          onClick={() => navigate("/grades", { replace: true })}
                          className="justify-start gap-3 w-full"
                        >
                          <ClipboardList className="w-5 h-5" />
                          {t("nav.grades")}
                        </Button>
                      </SheetClose>

                      <SheetClose asChild>
                        <Button
                          variant={isActive("/profile") ? "default" : "ghost"}
                          onClick={() => navigate("/profile", { replace: true })}
                          className="justify-start gap-3 w-full"
                        >
                          <User className="w-5 h-5" />
                          {t("nav.profile")}
                        </Button>
                      </SheetClose>

                      <div className="border-t pt-4 mt-2">
                        <p className="text-xs text-muted-foreground mb-2 px-3">
                          {isAdmin ? t("nav.management") : "Plus"}
                        </p>
                        
                        {isAdmin && (
                          <>
                            <SheetClose asChild>
                              <Button
                                variant={isActive("/settings") ? "default" : "ghost"}
                                onClick={() => navigate("/settings", { replace: true })}
                                className="justify-start gap-3 w-full"
                              >
                                <Settings className="w-5 h-5" />
                                {t("nav.settings")}
                              </Button>
                            </SheetClose>

                            <SheetClose asChild>
                              <Button
                                variant={isActive("/year-transition") ? "default" : "ghost"}
                                onClick={() => navigate("/year-transition", { replace: true })}
                                className="justify-start gap-3 w-full"
                              >
                                <Calendar className="w-5 h-5" />
                                {t("nav.yearTransition")}
                              </Button>
                            </SheetClose>

                            <SheetClose asChild>
                              <Button
                                variant={isActive("/quality") ? "default" : "ghost"}
                                onClick={() => navigate("/quality", { replace: true })}
                                className="justify-start gap-3 w-full"
                              >
                                <Activity className="w-5 h-5" />
                                {t("nav.quality")}
                              </Button>
                            </SheetClose>

                            <SheetClose asChild>
                              <Button
                                variant={isActive("/audit") ? "default" : "ghost"}
                                onClick={() => navigate("/audit", { replace: true })}
                                className="justify-start gap-3 w-full"
                              >
                                <Shield className="w-5 h-5" />
                                {t("nav.audit")}
                              </Button>
                            </SheetClose>

                            <SheetClose asChild>
                              <Button
                                variant={isActive("/tests") ? "default" : "ghost"}
                                onClick={() => navigate("/tests", { replace: true })}
                                className="justify-start gap-3 w-full"
                              >
                                <FlaskConical className="w-5 h-5" />
                                {t("nav.tests")}
                              </Button>
                            </SheetClose>
                          </>
                        )}

                        <SheetClose asChild>
                          <Button
                            variant={isActive("/quiz") ? "default" : "ghost"}
                            onClick={() => navigate("/quiz", { replace: true })}
                            className="justify-start gap-3 w-full"
                          >
                            <Lightbulb className="w-5 h-5" />
                            {t("nav.quiz")}
                          </Button>
                        </SheetClose>
                      </div>

                      <div className="border-t pt-4 mt-2 space-y-2">
                        <div className="px-3">
                          <p className="text-xs text-muted-foreground mb-2">Langue</p>
                          <div className="flex gap-2">
                            <Button
                              variant={language === "fr" ? "default" : "outline"}
                              onClick={() => setLanguage("fr")}
                              className="flex-1"
                              size="sm"
                            >
                              🇫🇷 FR
                            </Button>
                            <Button
                              variant={language === "en" ? "default" : "outline"}
                              onClick={() => setLanguage("en")}
                              className="flex-1"
                              size="sm"
                            >
                              🇬🇧 EN
                            </Button>
                          </div>
                        </div>

                        <SheetClose asChild>
                          <Button 
                            variant="ghost" 
                            onClick={handleLogout} 
                            className="justify-start gap-3 w-full text-destructive hover:text-destructive"
                          >
                            <LogOut className="w-5 h-5" />
                            {t("nav.logout")}
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">{children}</main>
      
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
