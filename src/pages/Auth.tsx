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
import { z } from "zod";

type UserRole = "teacher" | "admin";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const credentialsSchema = z.object({
    email: z.string().trim().email({ message: "Email invalide" }),
    password: z.string().min(6, { message: "6 caractères minimum" }).max(128),
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailSchema = z.string().trim().email({ message: "Email invalide" });
    const parsed = emailSchema.safeParse(email);
    
    if (!parsed.success) {
      toast.error("Email invalide");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast.success("Email de réinitialisation envoyé. Vérifiez votre boîte mail.");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error("Veuillez sélectionner votre profil");
      return;
    }

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Champs invalides");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre boîte mail puis connectez-vous.");
        setIsSignup(false);
        return;
      }

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Verify user has the selected role via secure function
      const roleValue = selectedRole === "admin" ? "admin" : "teacher";
      const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: roleValue as any,
      });

      if (roleError) throw roleError;

      if (!hasRole) {
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
            <h1 className="text-xl font-semibold">
              {isForgotPassword ? "Réinitialiser le mot de passe" : (isSignup ? "Créer un compte" : "Connexion")}
            </h1>
            <CardDescription>{t("auth.subtitle")}</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.welcome")}
            </p>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@regen-school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : "Envoyer l'email"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary underline"
                  onClick={() => setIsForgotPassword(false)}
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          ) : !selectedRole ? (
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
                {loading ? "..." : (isSignup ? "Créer le compte" : "Se connecter")}
              </Button>
              <div className="text-center space-y-2">
                <button
                  type="button"
                  className="text-sm text-primary underline block mx-auto"
                  onClick={() => setIsSignup(!isSignup)}
                >
                  {isSignup ? "J'ai déjà un compte" : "Créer un compte"}
                </button>
                {!isSignup && (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline block mx-auto"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
