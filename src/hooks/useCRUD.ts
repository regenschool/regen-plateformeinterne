/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook CRUD générique pour éviter la duplication de code
 * 
 * @template T - Type de l'entité
 * @param table - Nom de la table Supabase
 * @param queryKey - Clé de cache React Query
 * @param options - Options de configuration
 */

export interface CRUDOptions<T> {
  queryKey: QueryKey;
  selectQuery?: string;
  orderBy?: { column: string; ascending?: boolean };
  onAddSuccess?: (data: T) => void;
  onUpdateSuccess?: (data: T) => void;
  onDeleteSuccess?: () => void;
  onError?: (error: any) => void;
  enableRealtime?: boolean;
}

export function useCRUD<T extends { id?: string }>(
  table: string,
  options: CRUDOptions<T>
) {
  const queryClient = useQueryClient();
  const {
    queryKey,
    selectQuery = '*',
    orderBy,
    onAddSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onError,
  } = options;

  // Hook pour récupérer tous les enregistrements
  const useList = (filters?: Record<string, any>) => {
    return useQuery({
      queryKey: filters ? [...queryKey, filters] : queryKey,
      queryFn: async () => {
        let query = (supabase as any).from(table).select(selectQuery);

        // Appliquer les filtres
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              query = query.eq(key, value);
            }
          });
        }

        // Appliquer le tri
        if (orderBy) {
          query = query.order(orderBy.column, {
            ascending: orderBy.ascending ?? true,
          });
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as T[];
      },
      staleTime: 5 * 60 * 1000, // Cache 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collection après 10 minutes
    });
  };

  // Hook pour récupérer un enregistrement spécifique
  const useOne = (id: string) => {
    return useQuery({
      queryKey: [...queryKey, id],
      queryFn: async () => {
        const { data, error } = await (supabase as any)
          .from(table)
          .select(selectQuery)
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as T;
      },
      enabled: !!id,
    });
  };

  // Hook pour ajouter un enregistrement
  const useAdd = () => {
    return useMutation({
      mutationFn: async (newItem: any) => {
        const { data, error } = await (supabase as any)
          .from(table)
          .insert([newItem])
          .select()
          .single();

        if (error) throw error;
        return data as T;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey });
        if (onAddSuccess) {
          onAddSuccess(data);
        } else {
          toast.success('Enregistrement ajouté avec succès');
        }
      },
      onError: (error: any) => {
        if (onError) {
          onError(error);
        } else {
          toast.error(`Erreur lors de l'ajout : ${error.message}`);
        }
      },
    });
  };

  // Hook pour mettre à jour un enregistrement
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
        const { data, error } = await (supabase as any)
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      },
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey });
        if (data.id) {
          queryClient.invalidateQueries({ queryKey: [...queryKey, data.id] });
        }
        if (onUpdateSuccess) {
          onUpdateSuccess(data);
        } else {
          toast.success('Enregistrement mis à jour');
        }
      },
      onError: (error: any) => {
        if (onError) {
          onError(error);
        } else {
          toast.error(`Erreur lors de la mise à jour : ${error.message}`);
        }
      },
    });
  };

  // Hook pour supprimer un enregistrement
  const useDelete = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await (supabase as any).from(table).delete().eq('id', id);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (onDeleteSuccess) {
          onDeleteSuccess();
        } else {
          toast.success('Enregistrement supprimé');
        }
      },
      onError: (error: any) => {
        if (onError) {
          onError(error);
        } else {
          toast.error(`Erreur lors de la suppression : ${error.message}`);
        }
      },
    });
  };

  return {
    useList,
    useOne,
    useAdd,
    useUpdate,
    useDelete,
  };
}
