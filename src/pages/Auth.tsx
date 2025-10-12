import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf, Users, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type UserRole = "teacher" | "admin";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error("Veuillez sélectionner votre profil");
      return;
    }

    setLoading(true);

    try {
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      // Verify user has the selected role
      const roleValue = selectedRole === "admin" ? "admin" : "user";
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", roleValue as any)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Vous n'avez pas accès avec ce profil. Contactez l'administration.");
        setLoading(false);
        return;
      }

      toast.success(t("auth.welcome"));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Regen School</CardTitle>
          <CardDescription>{t("auth.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.welcome")}
            </p>
          </div>

          {!selectedRole ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-center mb-4">
                Sélectionnez votre profil
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedRole("teacher")}
                  className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
                >
                  <GraduationCap className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <p className="font-semibold">Enseignant</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accès classe
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedRole("admin")}
                  className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
                >
                  <Users className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <p className="font-semibold">Direction</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accès complet
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-2">
                {selectedRole === "teacher" ? (
                  <GraduationCap className="w-5 h-5 text-primary" />
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
                <span className="text-sm font-medium">
                  {selectedRole === "teacher" ? "Enseignant" : "Équipe de direction"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRole(null)}
                  className="ml-auto h-6 text-xs"
                >
                  Changer
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@regen-school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : "Se connecter"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
