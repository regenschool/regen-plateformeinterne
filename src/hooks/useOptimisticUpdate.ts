import { useState, useCallback } from "react";

type OptimisticUpdateConfig<T> = {
  initialData: T[];
  updateFn: (data: T[]) => Promise<void>;
  onError?: (error: Error) => void;
};

export const useOptimisticUpdate = <T extends { id: string }>({
  initialData,
  updateFn,
  onError,
}: OptimisticUpdateConfig<T>) => {
  const [data, setData] = useState<T[]>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);

  const optimisticUpdate = useCallback(
    async (updatedItem: T) => {
      // Store the previous state for rollback
      const previousData = [...data];
      
      // Optimistically update the UI
      setData((current) =>
        current.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      
      setIsUpdating(true);

      try {
        await updateFn([updatedItem]);
      } catch (error) {
        // Rollback on error
        setData(previousData);
        if (onError) {
          onError(error as Error);
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [data, updateFn, onError]
  );

  const optimisticAdd = useCallback(
    async (newItem: T) => {
      const previousData = [...data];
      
      // Optimistically add to the UI
      setData((current) => [...current, newItem]);
      
      setIsUpdating(true);

      try {
        await updateFn([newItem]);
      } catch (error) {
        // Rollback on error
        setData(previousData);
        if (onError) {
          onError(error as Error);
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [data, updateFn, onError]
  );

  const optimisticDelete = useCallback(
    async (itemId: string) => {
      const previousData = [...data];
      
      // Optimistically remove from the UI
      setData((current) => current.filter((item) => item.id !== itemId));
      
      setIsUpdating(true);

      try {
        await updateFn(data.filter((item) => item.id !== itemId));
      } catch (error) {
        // Rollback on error
        setData(previousData);
        if (onError) {
          onError(error as Error);
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [data, updateFn, onError]
  );

  return {
    data,
    setData,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete,
    isUpdating,
  };
};
