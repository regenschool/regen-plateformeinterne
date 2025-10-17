import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeachers, useAddTeacher, useUpdateTeacher, useDeleteTeacher, Teacher } from "@/hooks/useTeachers";
import { Trash2, Plus, Save, X, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * ARCHITECTURE NOTE:
 * - Teacher.user_id est la PRIMARY KEY
 * - L'email est en lecture seule (synchronisé depuis auth.users)
 * - Pour ajouter un enseignant, il faut un user_id existant dans auth.users
 */

export const TeachersManager = () => {
  const { data: teachers = [], isLoading } = useTeachers();
  const addTeacher = useAddTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ full_name: string }>({
    full_name: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ user_id: "", full_name: "" });

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.user_id);
    setEditValues({
      full_name: teacher.full_name,
    });
  };

  const handleSave = async (user_id: string) => {
    if (!editValues.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    try {
      await updateTeacher.mutateAsync({
        user_id,
        updates: editValues,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ full_name: "" });
  };

  const handleAdd = async () => {
    if (!newTeacher.user_id.trim()) {
      toast.error("L'ID utilisateur est obligatoire");
      return;
    }
    if (!newTeacher.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    try {
      await addTeacher.mutateAsync({
        user_id: newTeacher.user_id,
        full_name: newTeacher.full_name,
      });
      setNewTeacher({ user_id: "", full_name: "" });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  const handleDelete = async (user_id: string) => {
    try {
      await deleteTeacher.mutateAsync(user_id);
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div>
              <CardTitle>Enseignants</CardTitle>
              <CardDescription>
                Gérer les enseignants (utilisateurs avec rôle teacher)
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un enseignant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            L'email est automatiquement synchronisé depuis le compte utilisateur. Pour ajouter un enseignant, vous devez fournir l'ID d'un utilisateur existant.
          </AlertDescription>
        </Alert>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newTeacher.full_name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
                    placeholder="Nom complet"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newTeacher.user_id}
                    onChange={(e) => setNewTeacher({ ...newTeacher, user_id: e.target.value })}
                  placeholder="ID utilisateur (UUID)"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAdd}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsAdding(false);
                      setNewTeacher({ user_id: "", full_name: "" });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {teachers.map((teacher) => (
              <TableRow key={teacher.user_id}>
                <TableCell>
                  {editingId === teacher.user_id ? (
                    <Input
                      value={editValues.full_name}
                      onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                    />
                  ) : (
                    <span className="font-medium">{teacher.full_name}</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs font-mono">{teacher.user_id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingId === teacher.user_id ? (
                      <>
                        <Button size="sm" onClick={() => handleSave(teacher.user_id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(teacher)}>
                          Éditer
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer {teacher.full_name} ? Cette action supprimera aussi le rôle teacher de cet utilisateur.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(teacher.user_id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {teachers.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Aucun enseignant enregistré
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
