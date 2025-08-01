import { QueryClient } from '@tanstack/react-query';

// Configuração do QueryClient com cache otimizado
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 1000 * 60 * 5, // 5 minutos
      // Manter dados em cache por 10 minutos após não usar
      gcTime: 1000 * 60 * 10, // 10 minutos (antigas versões usavam cacheTime)
      // Revalidar quando a janela ganha foco (comportamento que você queria)
      refetchOnWindowFocus: true,
      // Revalidar ao reconectar à internet
      refetchOnReconnect: true,
      // Retry automático em caso de erro
      retry: (failureCount, error) => {
        // Não retry em erros 401 (não autorizado)
        if (error?.message?.includes('401')) return false;
        // Máximo 2 tentativas para outros erros
        return failureCount < 2;
      },
      // Interval de retry
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Mostrar erros de mutation por padrão
      throwOnError: true,
    },
  },
});
