import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';

export function useCacheManager() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const invalidateAll = () => {
    console.log('🗑️ Invalidando todo o cache');
    queryClient.invalidateQueries();
  };

  const invalidateDashboard = () => {
    console.log('🗑️ Invalidando cache do dashboard');
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const invalidateProcessos = () => {
    console.log('🗑️ Invalidando cache de processos');
    queryClient.invalidateQueries({ queryKey: ['processos'] });
  };

  const refreshDashboard = async () => {
    console.log('🔄 Forçando refresh do dashboard');
    return await queryClient.refetchQueries({ queryKey: ['dashboard'] });
  };

  const refreshProcessos = async () => {
    console.log('🔄 Forçando refresh de processos');
    return await queryClient.refetchQueries({ queryKey: ['processos'] });
  };

  const clearCache = () => {
    console.log('🧹 Limpando todo o cache');
    queryClient.clear();
  };

  const getCacheStatus = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      dashboard: queries.filter(q => q.queryKey[0] === 'dashboard'),
      processos: queries.filter(q => q.queryKey[0] === 'processos'),
      byStatus: queries.reduce((acc, query) => {
        acc[query.state.status] = (acc[query.state.status] || 0) + 1;
        return acc;
      }, {})
    };
  };

  return {
    invalidateAll,
    invalidateDashboard,
    invalidateProcessos,
    refreshDashboard,
    refreshProcessos,
    clearCache,
    getCacheStatus
  };
}
