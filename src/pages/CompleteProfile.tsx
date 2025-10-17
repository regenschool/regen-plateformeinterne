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
          toast.error("Erreur lors de l'activation du lien d'invitation");
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
