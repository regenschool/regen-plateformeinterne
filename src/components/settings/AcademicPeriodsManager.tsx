import { useState } from "react";
import { useSchoolYears, useAcademicPeriods } from "@/hooks/useReferentials";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, CalendarIcon, Trash2, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const AcademicPeriodsManager = () => {
  const { data: schoolYears } = useSchoolYears();
  const { data: periods, isLoading } = useAcademicPeriods(undefined, false);
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [schoolYearId, setSchoolYearId] = useState("");
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isActive, setIsActive] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await (supabase as any)
        .from("academic_periods")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_periods"] });
      toast.success("Période ajoutée");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("academic_periods")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_periods"] });
      toast.success("Période mise à jour");
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("academic_periods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_periods"] });
      toast.success("Période supprimée");
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });

  const resetForm = () => {
    setSchoolYearId("");
    setLabel("");
    setStartDate(undefined);
    setEndDate(undefined);
    setIsActive(false);
    setIsAdding(false);
  };

  const handleAdd = () => {
    if (!schoolYearId || !label || !startDate || !endDate) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    addMutation.mutate({
      school_year_id: schoolYearId,
      label,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      is_active: isActive,
    });
  };

  const handleEdit = (period: any) => {
    setEditingId(period.id);
    setSchoolYearId(period.school_year_id);
    setLabel(period.label);
    setStartDate(new Date(period.start_date));
    setEndDate(new Date(period.end_date));
    setIsActive(period.is_active);
  };

  const handleUpdate = () => {
    if (!editingId || !schoolYearId || !label || !startDate || !endDate) return;

    updateMutation.mutate({
      id: editingId,
      data: {
        school_year_id: schoolYearId,
        label,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        is_active: isActive,
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  const getSchoolYearLabel = (id: string) => {
    return schoolYears?.find(y => y.id === id)?.label || id;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un semestre
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <h3 className="font-semibold">Nouvelle période académique</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Année scolaire *</Label>
              <Select value={schoolYearId} onValueChange={setSchoolYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears?.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Libellé *</Label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semestre 1">Semestre 1</SelectItem>
                  <SelectItem value="Semestre 2">Semestre 2</SelectItem>
                  <SelectItem value="Année complète">Année complète</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date de fin *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Période active</Label>
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
            <TableHead>Année scolaire</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Date début</TableHead>
            <TableHead>Date fin</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods?.map((period) => {
            const isEditing = editingId === period.id;
            
            return (
              <TableRow key={period.id}>
                {isEditing ? (
                  <>
                    <TableCell>
                      <Select value={schoolYearId} onValueChange={setSchoolYearId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-popover">
                          {schoolYears?.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={label} onValueChange={setLabel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-popover">
                          <SelectItem value="Semestre 1">Semestre 1</SelectItem>
                          <SelectItem value="Semestre 2">Semestre 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
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
                    <TableCell>{getSchoolYearLabel(period.school_year_id)}</TableCell>
                    <TableCell className="font-medium">{period.label}</TableCell>
                    <TableCell>{format(new Date(period.start_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{format(new Date(period.end_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={period.is_active}
                        onCheckedChange={(checked) => {
                          updateMutation.mutate({
                            id: period.id,
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
                          onClick={() => handleEdit(period)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(period.id)}
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
