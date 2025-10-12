import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - Les données restent "fraîches" pendant 5 min
      gcTime: 10 * 60 * 1000, // 10 minutes - Garbage collection après 10 min
      refetchOnWindowFocus: false, // Pas de refetch automatique au focus
      retry: 1, // Réessaie 1 fois en cas d'erreur
    },
    mutations: {
      retry: 0, // Pas de retry pour les mutations
    },
  },
});
