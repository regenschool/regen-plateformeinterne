import { useState, useEffect } from "react";
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

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      toast.error("Veuillez d'abord sélectionner votre profil");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // Force top-level navigation (Google interdit l'auth dans un iframe)
      if (data?.url) {
        try {
          if (window.top && window.top !== window) {
            (window.top as Window).location.assign(data.url);
          } else {
            window.location.assign(data.url);
          }
        } catch (_) {
          const popup = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (!popup) {
            toast.error("Autorisez l'ouverture de pop-ups pour continuer la connexion Google.");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion Google");
    }
  };

  // Vérifier le rôle après redirection OAuth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const isLocalE2E = window.location.hostname === 'localhost' && new URL(window.location.href).searchParams.get('e2e') === '1';
        if (isLocalE2E) {
          toast.success(t("auth.welcome"));
          navigate("/");
          return;
        }
        // Différer la vérification du rôle
        setTimeout(async () => {
          try {
            // Vérifier d'abord si l'utilisateur a un rôle admin
            const { data: hasAdminRole, error: adminError } = await supabase.rpc("has_role", {
              _user_id: session.user.id,
              _role: "admin",
            });

            if (adminError) throw adminError;

            if (hasAdminRole) {
              toast.success(t("auth.welcome"));
              navigate("/");
              return;
            }

            // Sinon vérifier le rôle teacher
            const { data: hasTeacherRole, error: teacherError } = await supabase.rpc("has_role", {
              _user_id: session.user.id,
              _role: "teacher",
            });

            if (teacherError) throw teacherError;

            if (hasTeacherRole) {
              toast.success(t("auth.welcome"));
              navigate("/");
              return;
            }

            // Aucun rôle trouvé
            await supabase.auth.signOut();
            toast.error("Vous n'avez pas accès avec ce profil. Contactez l'administration.");
          } catch (error) {
            console.error("Erreur vérification rôle:", error);
            await supabase.auth.signOut();
            toast.error("Erreur lors de la vérification du rôle");
          }
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, t]);


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

        // E2E local bypass for role check (only on localhost with ?e2e=1)
        const isLocalE2E = window.location.hostname === 'localhost' && new URL(window.location.href).searchParams.get('e2e') === '1';
        if (isLocalE2E) {
          toast.success(t("auth.welcome"));
          navigate("/");
          return;
        }

      // Verify user has the selected role via secure function
      const roleValue = selectedRole === "admin" ? "admin" : "teacher";
      const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: roleValue,
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
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuer avec Google
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
