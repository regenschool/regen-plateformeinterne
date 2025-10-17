import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, GraduationCap, Phone, Mail, Edit2, CheckCircle2, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { ImportUsersDialog } from "./ImportUsersDialog";
import InviteUserDialog from "./InviteUserDialog";

type UserWithRole = {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  status: 'active' | 'pending';
  teacher_info?: {
    full_name: string;
    phone: string | null;
  };
};

export const UsersManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  // Formulaire édition
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // 1) Profils enseignants
      const { data: profiles, error: profilesError } = await supabase
        .from("teacher_profiles")
        .select("user_id, email, full_name, created_at, phone, address");
      if (profilesError) throw profilesError;

      // 2) Rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      // 3) Informations enseignants
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("user_id, full_name, phone, email, created_at");
      if (teachersError && teachersError.code !== 'PGRST116') throw teachersError;

      // Construire la liste d'IDs unique
      const ids = new Set<string>();
      (profiles || []).forEach(p => ids.add(p.user_id));
      (rolesData || []).forEach(r => ids.add(r.user_id));
      (teachersData || []).forEach(t => ids.add(t.user_id));

      // Pour chaque user_id, récupérer l'email depuis auth.users
      const usersWithRoles: UserWithRole[] = [];
      
      for (const id of Array.from(ids)) {
        const profile = profiles?.find(p => p.user_id === id);
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === id)
          .map(r => r.role);
        const teacher = teachersData?.find(t => t.user_id === id);

        // Récupérer l'email depuis auth.users via RPC
        const { data: emailData } = await supabase.rpc('get_user_email', { 
          _user_id: id 
        });

        const email = emailData || profile?.email || teacher?.email || "";
        const createdAt = profile?.created_at || teacher?.created_at || new Date().toISOString();
        const fullName = teacher?.full_name || profile?.full_name || email.split("@")[0] || "";

        // Déterminer le statut : actif si le profil est complété (phone ou address renseignés)
        const hasCompletedProfile = !!(profile?.phone || profile?.address);
        const status: 'active' | 'pending' = hasCompletedProfile ? 'active' : 'pending';

        usersWithRoles.push({
          id,
          email,
          created_at: createdAt,
          roles: userRoles,
          status,
          teacher_info: {
            full_name: fullName,
            phone: teacher?.phone || null,
          },
        });
      }

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, role: string, currentRoles: string[]) => {
    try {
      const hasRole = currentRoles.includes(role);

      if (hasRole) {
        // Empêcher de retirer le dernier rôle
        if (currentRoles.length === 1) {
          toast.error("Impossible de retirer le dernier rôle. L'utilisateur doit avoir au moins un rôle.");
          return;
        }

        // Retirer le rôle
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);

        if (error) throw error;

        // Si on retire 'teacher', supprimer aussi de teachers
        if (role === 'teacher') {
          await supabase.from("teachers").delete().eq("user_id", userId);
        }

        toast.success(`Rôle ${role} retiré`);
      } else {
        // Ajouter le rôle
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: role as any }]);

        if (error) throw error;

        // Si on ajoute 'teacher', créer l'entrée teachers si nécessaire
        if (role === 'teacher') {
          const user = users.find(u => u.id === userId);
          const { error: teacherError } = await supabase
            .from("teachers")
            .insert([{
              user_id: userId,
              full_name: user?.teacher_info?.full_name || user?.email.split('@')[0] || 'Nouveau',
              phone: null,
            }]);

          if (teacherError && teacherError.code !== '23505') {
            throw teacherError;
          }
        }

        toast.success(`Rôle ${role} ajouté`);
      }

      fetchUsers();
    } catch (error: any) {
      console.error("Error toggling role:", error);
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  const updateTeacherInfo = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          full_name: editFullName,
          phone: editPhone || null,
        })
        .eq("user_id", editingUser.id);

      if (error) throw error;

      toast.success("✅ Informations mises à jour");
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { userId },
      });

      if (error) throw error;

      toast.success("Lien de réinitialisation copié dans le presse-papiers");
      navigator.clipboard.writeText(data.resetLink);
    } catch (error: any) {
      console.error("Erreur reset password:", error);
      toast.error(error.message || "Erreur lors de la réinitialisation");
    }
  };

  const handleInviteUser = async (email: string, fullName: string, role: string) => {
    try {
      const { error } = await supabase.functions.invoke("invite-user", {
        body: { email, fullName, role },
      });

      if (error) throw error;

      toast.success("Invitation envoyée avec succès !");
      await fetchUsers();
    } catch (error: any) {
      console.error("Erreur invitation:", error);
      toast.error(error.message || "Erreur lors de l'invitation");
    }
  };

  const handleResendInvitation = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { userId },
      });

      if (error) throw error;

      // Utiliser l'email pour notifier via Resend
      const { error: emailError } = await supabase.functions.invoke("resend-invitation", {
        body: { 
          email: userEmail,
          resetLink: data.resetLink 
        },
      });

      if (emailError) throw emailError;

      toast.success("Invitation renvoyée avec succès !");
    } catch (error: any) {
      console.error("Erreur renvoi invitation:", error);
      toast.error(error.message || "Erreur lors du renvoi de l'invitation");
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { icon: any; label: string; variant: "default" | "secondary" | "outline" }> = {
      admin: { icon: Shield, label: "Admin", variant: "default" },
      teacher: { icon: GraduationCap, label: "Enseignant", variant: "secondary" },
      moderator: { icon: Shield, label: "Modérateur", variant: "outline" },
    };

    const config = variants[role] || { icon: Shield, label: role, variant: "outline" as const };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ImportUsersDialog onImportComplete={fetchUsers} />
          <InviteUserDialog onInvite={handleInviteUser} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Rôles</TableHead>
                  <TableHead>Informations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.teacher_info?.full_name || user.email}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(['admin', 'teacher', 'moderator'] as const).map(role => {
                          const hasRole = user.roles.includes(role);
                          return (
                            <Badge
                              key={role}
                              variant={hasRole ? "default" : "outline"}
                              className="cursor-pointer opacity-100 hover:opacity-80 transition-opacity"
                              onClick={() => toggleRole(user.id, role, user.roles)}
                            >
                              {hasRole && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {role}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.status === 'active' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.teacher_info ? (
                        <div className="text-sm space-y-1">
                          {user.teacher_info.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {user.teacher_info.phone}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Créé le {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {user.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(user.id, user.email)}
                            title="Renvoyer l'invitation"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                          title="Réinitialiser le mot de passe"
                        >
                          Réinitialiser MDP
                        </Button>
                        {user.teacher_info && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setEditFullName(user.teacher_info?.full_name || '');
                              setEditPhone(user.teacher_info?.phone || '');
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog édition enseignant */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les informations enseignant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <Button onClick={updateTeacherInfo} className="w-full">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
