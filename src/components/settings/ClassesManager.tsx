import { useState } from "react";
import { useClassesReferential } from "@/hooks/useReferentials";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const ClassesManager = () => {
  const { data: classes, isLoading } = useClassesReferential(false);
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [capacity, setCapacity] = useState<number | undefined>();
  const [isActive, setIsActive] = useState(true);

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await (supabase as any)
        .from("classes")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes_referential"] });
      toast.success("Classe ajoutée");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("classes")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes_referential"] });
      toast.success("Classe mise à jour");
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes_referential"] });
      toast.success("Classe supprimée");
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setLevel("");
    setCapacity(undefined);
    setIsActive(true);
    setIsAdding(false);
  };

  const handleAdd = () => {
    if (!name) {
      toast.error("Le nom de la classe est obligatoire");
      return;
    }

    addMutation.mutate({
      name,
      level: level || null,
      capacity: capacity || null,
      is_active: isActive,
    });
  };

  const handleEdit = (classItem: any) => {
    setEditingId(classItem.id);
    setName(classItem.name);
    setLevel(classItem.level || "");
    setCapacity(classItem.capacity);
    setIsActive(classItem.is_active);
  };

  const handleUpdate = () => {
    if (!editingId || !name) return;

    updateMutation.mutate({
      id: editingId,
      data: {
        name,
        level: level || null,
        capacity: capacity || null,
        is_active: isActive,
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une classe
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <h3 className="font-semibold">Nouvelle classe</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nom de la classe *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="B3, M1..."
              />
            </div>
            <div>
              <Label>Niveau</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacité</Label>
              <Input
                type="number"
                value={capacity || ""}
                onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Classe active</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              <Check className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Niveau</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes?.map((classItem) => (
            <TableRow key={classItem.id}>
              <TableCell className="font-medium">{classItem.name}</TableCell>
              <TableCell>{classItem.level || "-"}</TableCell>
              <TableCell>{classItem.capacity || "-"}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    classItem.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {classItem.is_active ? "Oui" : "Non"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(classItem)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(classItem.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
