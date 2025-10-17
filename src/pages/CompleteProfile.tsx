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
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    checkProfileComplete();
  }, []);

  const checkProfileComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Ne pas rediriger si pas d'utilisateur, laisser l'utilisateur compléter
      return;
    }

    // Vérifier si le profil est complet
    const { data: profile } = await supabase
      .from("teacher_profiles")
      .select("phone, address")
      .eq("user_id", user.id)
      .single();

    // Si le profil est déjà complet, rediriger
    if (profile?.phone && profile?.address) {
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

      // Marquer le profil comme complet dans les métadonnées
      await supabase.auth.updateUser({
        data: { profile_completed: true }
      });

      toast.success("Profil complété avec succès !");
      navigate("/");
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
        <CardHeader>
          <CardTitle>Finalisez votre profil</CardTitle>
          <CardDescription>
            Veuillez définir votre mot de passe et compléter vos informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Finalisation..." : "Finaliser mon profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
