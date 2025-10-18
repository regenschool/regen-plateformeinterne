import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutes - Optimisé pour production multi-utilisateurs
      gcTime: 10 * 60 * 1000, // 10 minutes - Garbage collection après 10 min
      refetchOnWindowFocus: false, // Pas de refetch automatique au focus
      retry: 1, // Réessaie 1 fois en cas d'erreur
      refetchOnMount: false, // Ne pas refetch si les données sont fraîches
    },
    mutations: {
      retry: 0, // Pas de retry pour les mutations
      onError: (error) => {
        // Log centralisé des erreurs de mutation pour monitoring
        console.error('[Mutation Error]', error);
      },
    },
  },
});
