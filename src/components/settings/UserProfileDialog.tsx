import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Calendar, Shield, GraduationCap, CheckCircle2 } from "lucide-react";

interface UserProfileDialogProps {
  userId: string | null;
  userEmail: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UserProfileDialog({ userId, userEmail, onClose, onUpdate }: UserProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    created_at: "",
    roles: [] as string[],
  });

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Récupérer le profil
      const { data: profileData, error: profileError } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Récupérer les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      setProfile({
        full_name: profileData?.full_name || "",
        email: profileData?.email || userEmail || "",
        phone: profileData?.phone || "",
        address: profileData?.address || "",
        created_at: profileData?.created_at || new Date().toISOString(),
        roles: rolesData?.map(r => r.role) || [],
      });
    } catch (error: any) {
      console.error("Erreur chargement profil:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("teacher_profiles")
        .upsert({
          user_id: userId,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success("Profil mis à jour avec succès");
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Erreur mise à jour profil:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = async (role: string) => {
    if (!userId) return;

    const hasRole = profile.roles.includes(role);

    if (hasRole && profile.roles.length === 1) {
      toast.error("Impossible de retirer le dernier rôle");
      return;
    }

    try {
      if (hasRole) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);

        if (error) throw error;

        setProfile(prev => ({
          ...prev,
          roles: prev.roles.filter(r => r !== role),
        }));

        toast.success(`Rôle ${role} retiré`);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });

        if (error) throw error;

        setProfile(prev => ({
          ...prev,
          roles: [...prev.roles, role],
        }));

        toast.success(`Rôle ${role} ajouté`);
      }

      onUpdate();
    } catch (error: any) {
      console.error("Erreur modification rôle:", error);
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Profil utilisateur
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Chargement...</div>
        ) : (
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Créé le {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="full_name">Nom complet *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="123 Rue de l'École, 75001 Paris"
                  />
                </div>
              </div>
            </div>

            {/* Gestion des rôles */}
            <div>
              <Label className="mb-2 block">Rôles</Label>
              <div className="flex flex-wrap gap-2">
                {(['admin', 'teacher', 'moderator'] as const).map(role => {
                  const hasRole = profile.roles.includes(role);
                  const Icon = role === 'admin' ? Shield : GraduationCap;
                  
                  return (
                    <Badge
                      key={role}
                      variant={hasRole ? "default" : "outline"}
                      className="cursor-pointer gap-1 capitalize"
                      onClick={() => toggleRole(role)}
                    >
                      <Icon className="w-3 h-3" />
                      {hasRole && <CheckCircle2 className="w-3 h-3" />}
                      {role}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cliquez sur un rôle pour l'ajouter ou le retirer
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
