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
import { UserPlus, Trash2, Shield, GraduationCap, Phone, Mail, Edit2, CheckCircle2 } from "lucide-react";

type UserWithRole = {
  id: string;
  email: string;
  created_at: string;
  roles: string[]; // Peut avoir plusieurs rôles: ['admin', 'teacher', 'moderator']
  teacher_info?: {
    full_name: string;
    phone: string | null;
  };
};

export const UsersManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  
  // Formulaire nouveau utilisateur
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>(["teacher"]);
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");

  // Formulaire édition
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Récupérer tous les utilisateurs via teacher_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("teacher_profiles")
        .select("user_id, email, full_name, created_at");

      if (profilesError) throw profilesError;

      // Récupérer tous les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Récupérer les infos enseignants
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("user_id, full_name, phone");

      if (teachersError) throw teachersError;

      // Combiner les données
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.user_id).map(r => r.role) || [];
        const teacherInfo = teachersData?.find(t => t.user_id === profile.user_id);

        return {
          id: profile.user_id,
          email: profile.email,
          created_at: profile.created_at,
          roles: userRoles,
          teacher_info: teacherInfo ? {
            full_name: teacherInfo.full_name,
            phone: teacherInfo.phone,
          } : undefined,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast.error("Email, mot de passe et nom complet requis");
      return;
    }

    try {
      // 1. Créer l'utilisateur
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserFullName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Utilisateur non créé");

      // 2. Ajouter les rôles
      const roleInserts = newUserRoles.map(role => ({
        user_id: data.user.id,
        role: role as any,
      }));

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert(roleInserts);

      if (roleError) throw roleError;

      // 3. Si enseignant, créer l'entrée teachers
      if (newUserRoles.includes('teacher')) {
        const { error: teacherError } = await supabase
          .from("teachers")
          .insert([{
            user_id: data.user.id,
            full_name: newUserFullName,
            phone: newUserPhone || null,
          }]);

        if (teacherError) throw teacherError;
      }

      toast.success("✅ Utilisateur créé avec succès");
      setShowAddDialog(false);
      resetForm();
      setTimeout(() => fetchUsers(), 1000);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erreur lors de la création");
    }
  };

  const toggleRole = async (userId: string, role: string, currentRoles: string[]) => {
    try {
      const hasRole = currentRoles.includes(role);

      if (hasRole) {
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

  const resetForm = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRoles(["teacher"]);
    setNewUserFullName("");
    setNewUserPhone("");
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
        <div>
          <h3 className="text-lg font-semibold">Gestion des Utilisateurs</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les accès, rôles et informations des utilisateurs
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Créer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouveau Utilisateur</DialogTitle>
              <DialogDescription>
                Créez un compte utilisateur avec les rôles appropriés
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="utilisateur@regen-school.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="fullname">Nom complet *</Label>
                <Input
                  id="fullname"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                  id="phone"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div>
                <Label>Rôles *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(['admin', 'teacher', 'moderator'] as const).map(role => (
                    <Badge
                      key={role}
                      variant={newUserRoles.includes(role) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (newUserRoles.includes(role)) {
                          setNewUserRoles(newUserRoles.filter(r => r !== role));
                        } else {
                          setNewUserRoles([...newUserRoles, role]);
                        }
                      }}
                    >
                      {newUserRoles.includes(role) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={createUser} className="w-full">
                Créer l'utilisateur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
