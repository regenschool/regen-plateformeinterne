import { useState } from "react";
import { useClassesReferential, useLevels } from "@/hooks/useReferentials";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  const { data: levels, isLoading: levelsLoading } = useLevels(true);
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("classes")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes_referential"] });
      toast.success("Classes supprimées");
      setSelectedIds(new Set());
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
    
    if (name.length > 5) {
      toast.error("Le nom de la classe ne peut pas dépasser 5 caractères");
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
    
    if (name.length > 5) {
      toast.error("Le nom de la classe ne peut pas dépasser 5 caractères");
      return;
    }

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

  const toggleSelectAll = () => {
    if (selectedIds.size === classes?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(classes?.map(c => c.id) || []));
    }
  };

  const toggleSelectClass = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast.error("Aucune classe sélectionnée");
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} classe(s) ?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  if (isLoading || levelsLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer ({selectedIds.size})
            </Button>
          )}
        </div>
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
                maxLength={5}
              />
            </div>
            <div>
              <Label>Niveau</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.name}>
                      {level.name}
                    </SelectItem>
                  ))}
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
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.size === classes?.length && classes?.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Niveau</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes?.map((classItem) => {
            const isEditing = editingId === classItem.id;
            
            return (
              <TableRow key={classItem.id}>
                {isEditing ? (
                  <>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(classItem.id)}
                        onCheckedChange={() => toggleSelectClass(classItem.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="B1, M2..."
                        maxLength={5}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={level || ""} onValueChange={setLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Niveau" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-popover">
                          {levels?.map((level) => (
                            <SelectItem key={level.id} value={level.name}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={capacity || ""}
                        onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="30"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUpdate}
                          disabled={updateMutation.isPending}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(classItem.id)}
                        onCheckedChange={() => toggleSelectClass(classItem.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.level || "-"}</TableCell>
                    <TableCell>{classItem.capacity || "-"}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={classItem.is_active}
                        onCheckedChange={(checked) => {
                          updateMutation.mutate({
                            id: classItem.id,
                            data: { is_active: checked }
                          });
                        }}
                      />
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
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
