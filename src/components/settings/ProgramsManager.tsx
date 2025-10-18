import { useState } from 'react';
import { usePrograms, useProgramMutations } from '@/hooks/useReferentials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { LoadingSkeletons } from '@/components/LoadingSkeletons';
import { toast } from 'sonner';

export const ProgramsManager = () => {
  const { data: programs, isLoading } = usePrograms();
  const { add, update, remove } = useProgramMutations();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error('Le nom du programme est requis');
      return;
    }

    await add.mutateAsync({ 
      name: name.trim(), 
      description: description.trim() || undefined,
      is_active: isActive 
    });
    resetForm();
  };

  const handleEdit = (program: any) => {
    setEditingId(program.id);
    setName(program.name);
    setDescription(program.description || '');
    setIsActive(program.is_active);
    setIsAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim()) {
      toast.error('Le nom du programme est requis');
      return;
    }

    await update.mutateAsync({
      id: editingId,
      name: name.trim(),
      description: description.trim() || undefined,
      is_active: isActive,
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      await remove.mutateAsync(id);
    }
  };

  const handleToggleActive = async (program: any) => {
    await update.mutateAsync({
      id: program.id,
      is_active: !program.is_active,
    });
  };

  if (isLoading) {
    return <LoadingSkeletons />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestion des Programmes</h3>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding || editingId !== null}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un programme
        </Button>
      </div>

      {(isAdding || editingId) && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du programme *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Master Commerce International"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du programme..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <label className="text-sm font-medium">Programme actif</label>
          </div>

          <div className="flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleAdd}>
              <Save className="w-4 h-4 mr-2" />
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs?.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="font-medium">{program.name}</TableCell>
              <TableCell className="text-muted-foreground max-w-md truncate">
                {program.description || '—'}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={program.is_active}
                  onCheckedChange={() => handleToggleActive(program)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(program)}
                    disabled={isAdding || (editingId !== null && editingId !== program.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                    disabled={isAdding || editingId !== null}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!programs?.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Aucun programme enregistré
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
