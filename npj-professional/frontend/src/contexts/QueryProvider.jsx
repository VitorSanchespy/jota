import React from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

// Configuração otimizada do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 1000 * 60 * 5,
      // Manter em cache por 30 minutos
      gcTime: 1000 * 60 * 30,
      // Retry automático em caso de falha
      retry: (failureCount, error) => {
        // Não retry em erros 4xx (exceto 429)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        // Máximo de 3 tentativas
        return failureCount < 3;
      },
      // Intervalo entre retries (exponencial backoff)
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus apenas se dados estão stale
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations apenas uma vez
      retry: 1,
      // Timeout para mutations
      networkTimeout: 10000,
    },
  },
});

// Provider otimizado
export const OptimizedQueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Hook para invalidar queries de forma otimizada
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  const invalidateUserQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const invalidateProcessQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['processos'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const invalidateFileQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['arquivos'] });
  }, [queryClient]);

  const invalidateAll = React.useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateUserQueries,
    invalidateProcessQueries,
    invalidateFileQueries,
    invalidateAll
  };
};

export default queryClient;
