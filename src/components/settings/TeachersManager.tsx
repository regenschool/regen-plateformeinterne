import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeachers, useAddTeacher, useUpdateTeacher, useDeleteTeacher } from "@/hooks/useTeachers";
import { Trash2, Plus, Save, X, Users } from "lucide-react";
import { toast } from "sonner";
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

export const TeachersManager = () => {
  const { data: teachers = [], isLoading } = useTeachers();
  const addTeacher = useAddTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ full_name: string; email: string; phone: string }>({
    full_name: "",
    email: "",
    phone: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ full_name: "", email: "", phone: "" });

  const handleEdit = (teacher: any) => {
    setEditingId(teacher.id);
    setEditValues({
      full_name: teacher.full_name,
      email: teacher.email || "",
      phone: teacher.phone || "",
    });
  };

  const handleSave = async (id: string) => {
    if (!editValues.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    try {
      await updateTeacher.mutateAsync({
        id,
        updates: editValues,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ full_name: "", email: "", phone: "" });
  };

  const handleAdd = async () => {
    if (!newTeacher.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    try {
      await addTeacher.mutateAsync(newTeacher);
      setNewTeacher({ full_name: "", email: "", phone: "" });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeacher.mutateAsync(id);
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
                Gérer la liste des enseignants de l'établissement
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un enseignant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
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
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    placeholder="0123456789"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAdd}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsAdding(false);
                      setNewTeacher({ full_name: "", email: "", phone: "" });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>
                  {editingId === teacher.id ? (
                    <Input
                      value={editValues.full_name}
                      onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                    />
                  ) : (
                    <span className="font-medium">{teacher.full_name}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <Input
                      type="email"
                      value={editValues.email}
                      onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    />
                  ) : (
                    <span className="text-muted-foreground">{teacher.email || "-"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <Input
                      type="tel"
                      value={editValues.phone}
                      onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                    />
                  ) : (
                    <span className="text-muted-foreground">{teacher.phone || "-"}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingId === teacher.id ? (
                      <>
                        <Button size="sm" onClick={() => handleSave(teacher.id)}>
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
                                Êtes-vous sûr de vouloir supprimer {teacher.full_name} ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(teacher.id)}>
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
                <TableCell colSpan={4} className="text-center text-muted-foreground">
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
