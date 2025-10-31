import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    handleAuthCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Vérifier si on a un hash dans l'URL (lien d'invitation)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Si on a un token d'invitation, l'échanger contre une session
      if (accessToken && type === 'invite') {
        console.log("Traitement du lien d'invitation...");
        
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken!,
        });

        if (error) {
          console.error("Erreur lors de l'établissement de la session:", error);
          
          // Détecter si c'est un token expiré
          if (error.message?.includes('expired') || error.message?.includes('invalid') || error.status === 400) {
            setTokenExpired(true);
            // Extraire l'email du token si possible
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              if (payload.email) {
                setUserEmail(payload.email);
              }
            } catch (e) {
              console.log("Impossible d'extraire l'email du token");
            }
            toast.error("Ce lien d'invitation a expiré (valide 24h)");
          } else {
            toast.error("Erreur lors de l'activation du lien d'invitation");
          }
          return;
        }

        console.log("Session établie avec succès:", data.user?.email);
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Maintenant vérifier le profil
      await checkProfileComplete();
    } catch (error: any) {
      console.error("Erreur handleAuthCallback:", error);
      toast.error("Erreur lors de l'initialisation");
    }
  };

  const checkProfileComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Pas encore connecté, c'est normal pour un nouvel utilisateur
      console.log("Aucun utilisateur authentifié détecté");
      return;
    }

    console.log("Utilisateur détecté:", user.email);
    setUserEmail(user.email || "");
    setUserName(user.user_metadata?.full_name || "");

    // Vérifier si le profil est complet
    const { data: profile } = await supabase
      .from("teacher_profiles")
      .select("phone, address")
      .eq("user_id", user.id)
      .single();

    // Si le profil est déjà complet ET l'email confirmé, rediriger
    if (profile?.phone && profile?.address && user.email_confirmed_at) {
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Non authentifié");

      // Mettre à jour le mot de passe
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (passwordError) throw passwordError;

      // Mettre à jour le profil enseignant (upsert pour créer si n'existe pas)
      const { error: profileError } = await supabase
        .from("teacher_profiles")
        .upsert({
          user_id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!.split("@")[0],
          phone: formData.phone,
          address: formData.address,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Marquer le profil comme complet et confirmer l'email
      await supabase.auth.updateUser({
        data: { profile_completed: true },
        email: user.email!, // Cela confirme l'email
      });

      toast.success("Compte créé avec succès ! Bienvenue 🎉");
      
      // Petite pause pour que l'utilisateur voie le message
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      console.error("Erreur complétion profil:", error);
      toast.error(error.message || "Erreur lors de la complétion du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!userEmail) {
      toast.error("Impossible de renvoyer l'invitation : email manquant");
      return;
    }

    setResendingInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('resend-invitation', {
        body: { email: userEmail },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) throw error;

      toast.success("Nouvelle invitation envoyée ! Consultez votre boîte mail 📧");
      setTokenExpired(false);
    } catch (error: any) {
      console.error("Erreur renvoi invitation:", error);
      toast.error("Erreur lors du renvoi de l'invitation. Contactez votre administrateur.");
    } finally {
      setResendingInvite(false);
    }
  };

  // Affichage spécial si le token a expiré
  if (tokenExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <div className="text-center">
              <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Lien expiré</CardTitle>
            </div>
            <CardDescription className="text-center">
              Ce lien d'invitation n'est plus valide. Les liens expirent automatiquement après 24 heures pour des raisons de sécurité.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📧 Email : <strong>{userEmail}</strong>
                </p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">💡 Que faire ?</h3>
              <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
                <li>Cliquez sur le bouton ci-dessous pour recevoir un nouveau lien</li>
                <li>Consultez votre boîte mail (vérifiez les spams)</li>
                <li>Utilisez le nouveau lien dans les 24 heures</li>
              </ol>
            </div>

            <Button 
              onClick={handleResendInvitation} 
              className="w-full" 
              size="lg"
              disabled={resendingInvite}
            >
              {resendingInvite ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Renvoyer l'invitation
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Si le problème persiste, contactez votre administrateur
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Créez votre compte</CardTitle>
          </div>
          <CardDescription className="text-center">
            {userEmail ? (
              <>Bienvenue <strong>{userName || userEmail}</strong> ! Définissez votre mot de passe pour activer votre compte.</>
            ) : (
              <>Complétez les informations ci-dessous pour créer votre compte Regen School.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {userEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  📧 Email de connexion : <strong>{userEmail}</strong>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <span>Mot de passe</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
              />
              <p className="text-xs text-muted-foreground">
                Choisissez un mot de passe sécurisé pour protéger votre compte
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <span>Confirmer le mot de passe</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                placeholder="Répétez votre mot de passe"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3 text-muted-foreground">
                Informations complémentaires (optionnel)
              </p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Votre adresse complète"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Vous pourrez compléter vos informations plus tard dans votre profil
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
