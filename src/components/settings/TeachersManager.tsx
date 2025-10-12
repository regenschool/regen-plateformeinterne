import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeachers, useAddTeacher, useUpdateTeacher, useDeleteTeacher } from "@/hooks/useTeachers";
import { Trash2, Plus, Save, X, Edit } from "lucide-react";
import { toast } from "sonner";

export const TeachersManager = () => {
  const { data: teachers = [], isLoading } = useTeachers();
  const addTeacher = useAddTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ full_name: string; email: string; phone: string }>({
    full_name: "",
    email: "",
    phone: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ full_name: "", email: "", phone: "" });

  const handleEdit = (teacher: any) => {
    setEditingId(teacher.id);
    setEditingData({
      full_name: teacher.full_name,
      email: teacher.email || "",
      phone: teacher.phone || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({ full_name: "", email: "", phone: "" });
  };

  const handleSave = async (teacherId: string) => {
    if (!editingData.full_name.trim()) {
      toast.error("Le nom complet est obligatoire");
      return;
    }

    await updateTeacher.mutateAsync({
      id: teacherId,
      updates: {
        full_name: editingData.full_name.trim(),
        email: editingData.email.trim() || null,
        phone: editingData.phone.trim() || null,
      },
    });
    
    setEditingId(null);
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.full_name.trim()) {
      toast.error("Le nom complet est obligatoire");
      return;
    }

    await addTeacher.mutateAsync({
      full_name: newTeacher.full_name.trim(),
      email: newTeacher.email.trim() || null,
      phone: newTeacher.phone.trim() || null,
    });

    setNewTeacher({ full_name: "", email: "", phone: "" });
    setIsAdding(false);
  };

  const handleDelete = async (teacherId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet enseignant ?")) {
      await deleteTeacher.mutateAsync(teacherId);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Enseignants</CardTitle>
        <CardDescription>
          Gérer la liste des enseignants de l'établissement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {teachers.length} enseignant{teachers.length > 1 ? "s" : ""} enregistré{teachers.length > 1 ? "s" : ""}
          </p>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un enseignant
            </Button>
          )}
        </div>

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
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="email@example.com"
                    type="email"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleAddTeacher}
                      className="h-8 w-8"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsAdding(false);
                        setNewTeacher({ full_name: "", email: "", phone: "" });
                      }}
                      className="h-8 w-8"
                    >
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
                      value={editingData.full_name}
                      onChange={(e) =>
                        setEditingData({ ...editingData, full_name: e.target.value })
                      }
                      className="h-8"
                    />
                  ) : (
                    teacher.full_name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <Input
                      value={editingData.email}
                      onChange={(e) =>
                        setEditingData({ ...editingData, email: e.target.value })
                      }
                      type="email"
                      className="h-8"
                    />
                  ) : (
                    teacher.email || "-"
                  )}
                </TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <Input
                      value={editingData.phone}
                      onChange={(e) =>
                        setEditingData({ ...editingData, phone: e.target.value })
                      }
                      className="h-8"
                    />
                  ) : (
                    teacher.phone || "-"
                  )}
                </TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSave(teacher.id)}
                        className="h-8 w-8"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(teacher)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(teacher.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
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
