import { useState } from "react";
import { useLevels } from "@/hooks/useReferentials";
import { useLevelMutations } from "@/hooks/useReferentialMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const LevelsManager = () => {
  const { data: levels, isLoading } = useLevels(false);
  const { add, update, remove } = useLevelMutations();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setIsActive(true);
    setIsAdding(false);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Le nom du niveau est obligatoire");
      return;
    }

    add.mutate(
      { name: name.trim(), is_active: isActive },
      {
        onSuccess: () => resetForm(),
      }
    );
  };

  const handleEdit = (level: any) => {
    setEditingId(level.id);
    setName(level.name);
    setIsActive(level.is_active);
  };

  const handleUpdate = () => {
    if (!editingId || !name.trim()) return;

    update.mutate(
      {
        id: editingId,
        data: { name: name.trim(), is_active: isActive },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          resetForm();
        },
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un niveau
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <h3 className="font-semibold">Nouveau niveau</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom du niveau *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MBA, Doctorat..."
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Niveau actif</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={add.isPending}>
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
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {levels?.map((level) => {
            const isEditing = editingId === level.id;
            
            return (
              <TableRow key={level.id}>
                {isEditing ? (
                  <>
                    <TableCell>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nom du niveau"
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
                          disabled={update.isPending}
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
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={level.is_active}
                        onCheckedChange={(checked) => {
                          update.mutate({
                            id: level.id,
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
                          onClick={() => handleEdit(level)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove.mutate(level.id)}
                          disabled={remove.isPending}
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
