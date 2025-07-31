import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/apiRequest';
import { useAuthContext } from '../contexts/AuthContext';

// Helper para verificar role
export const getUserRole = (user) => {
  if (!user) return null;
  
  if (typeof user.role === 'string') {
    return user.role;
  }
  
  if (user.role && typeof user.role === 'object') {
    return user.role.nome || user.role.name || null;
  }
  
  if (user.role_id === 1) return 'Admin';
  if (user.role_id === 2) return 'Aluno';
  if (user.role_id === 3) return 'Professor';
  
  return null;
};

// ===== HOOKS PARA PROCESSOS =====

export function useProcessos(search = "", showMyProcesses = false) {
  const { token, user } = useAuthContext();
  
  return useQuery({
    queryKey: ['processos', user?.id, getUserRole(user), search, showMyProcesses],
    queryFn: async () => {
      const userRole = getUserRole(user);
      if (!token || !userRole) throw new Error('Token ou usuário não disponível');
      
      let data = [];
      
      if (userRole === "Aluno") {
        data = await apiRequest("/api/processos/meus-processos", { token });
      } else if (userRole === "Professor") {
        if (search.trim()) {
          data = await apiRequest("/api/processos", { token });
        } else if (showMyProcesses) {
          data = await apiRequest("/api/processos/meus-processos", { token });
        } else {
          const allProcesses = await apiRequest("/api/processos", { token });
          data = allProcesses
            .sort((a, b) => new Date(b.updatedAt || b.criado_em) - new Date(a.updatedAt || a.criado_em))
            .slice(0, 4);
        }
      } else if (userRole === "Admin") {
        if (showMyProcesses) {
          data = await apiRequest("/api/processos/meus-processos", { token });
        } else {
          data = await apiRequest("/api/processos", { token });
        }
      }

      // Filtrar por termo de busca se fornecido
      if (search.trim()) {
        data = data.filter(proc => 
          proc.numero_processo?.toLowerCase().includes(search.toLowerCase()) ||
          proc.numero?.toLowerCase().includes(search.toLowerCase())
        );
      }

      return data;
    },
    enabled: !!(token && user),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (substituiu cacheTime)
  });
}

// ===== HOOKS GEOGRAFIA =====

export function useEstados() {
  const { token } = useAuthContext();
  
  return useQuery({
    queryKey: ['estados'],
    queryFn: async () => {
      const data = await apiRequest('/api/estados', { token });
      return data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 60, // 1 hora - dados geográficos não mudam
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

export function useCidades(estadoId) {
  const { token } = useAuthContext();
  
  return useQuery({
    queryKey: ['cidades', estadoId],
    queryFn: async () => {
      if (!estadoId) return [];
      const data = await apiRequest(`/api/cidades/${estadoId}`, { token });
      return data;
    },
    enabled: !!(token && estadoId),
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

// ===== HOOKS PARA DASHBOARD =====

export function useDashboardData() {
  const { token, user } = useAuthContext();
  
  console.log('🔍 useDashboardData: Estado atual', {
    hasToken: !!token,
    hasUser: !!user,
    userRole: getUserRole(user),
    userId: user?.id,
    userName: user?.nome,
    timestamp: new Date().toLocaleTimeString()
  });
  
  return useQuery({
    queryKey: ['dashboard', user?.id, getUserRole(user)],
    queryFn: async () => {
      const userRole = getUserRole(user);  
      console.log('🚀 useDashboardData: Iniciando busca...', { userRole, token: !!token });
      
      if (!token || !userRole) {
        const errorMsg = `Token ou usuário não disponível - token: ${!!token}, userRole: ${userRole}`;
        console.error('❌ useDashboardData:', errorMsg);
        throw new Error(errorMsg);
      }
      
      try {
        const [
          processosResponse,
          usuariosCount,
          processosRecentes,
          processosStats,
          atualizacoes
        ] = await Promise.all([
          apiRequest("/api/processos", { token }),
          userRole === "Admin" 
            ? apiRequest("/api/usuarios/count", { token }).catch(() => ({ total: 0, porTipo: {} }))
            : Promise.resolve({ total: 0, porTipo: {} }),
          apiRequest("/api/processos/recentes", { token }).catch(() => []),
          (userRole === "Admin" || userRole === "Professor")
            ? apiRequest("/api/processos/stats", { token }).catch(() => ({ total: 0, porStatus: {}, ativos: 0 }))
            : Promise.resolve({ total: 0, porStatus: {}, ativos: 0 }),
          apiRequest("/api/atualizacoes?limite=5", { token }).catch(() => [])
        ]);

        console.log('✅ useDashboardData: Dados recebidos', {
          processos: processosResponse?.length || 0,
          processosRecentes: processosRecentes?.length || 0,
          usuariosCount: usuariosCount?.total || 0,
          atualizacoes: atualizacoes?.length || 0,
          processosStats
        });

        // Processar dados baseado no papel do usuário
        let dashboardData = {
          processos: processosResponse || [],
          processosRecentes: processosRecentes || [],
          usuarios: [],
          atualizacoes: atualizacoes || []
        };

        // Usar dados das estatísticas se disponível, caso contrário calcular
        const statusCounts = processosStats?.porStatus || dashboardData.processos.reduce((acc, proc) => {
          const status = proc.status || 'Indefinido';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        dashboardData.statusCounts = statusCounts;
        dashboardData.totalProcessos = processosStats?.total || dashboardData.processos.length;
        
        // Dados estruturados para o componente Admin
        dashboardData.processosPorStatus = {
          em_andamento: statusCounts.em_andamento || 0,
          aguardando: statusCounts.aguardando || 0,
          finalizado: statusCounts.finalizado || 0,
          arquivado: statusCounts.arquivado || 0
        };
        
        dashboardData.processosAtivos = processosStats?.ativos || dashboardData.processos.filter(p => p.status !== 'arquivado').length;

        if (userRole === "Admin") {
          dashboardData.totalUsuarios = usuariosCount.total || 0;
          dashboardData.usuariosAtivos = usuariosCount.total || 0; // Por enquanto igual ao total
          dashboardData.usuariosPorTipo = usuariosCount.porTipo || {};
        }

        return dashboardData;
      } catch (error) {
        console.error('Erro na busca do dashboard:', error);
        // Retornar dados vazios em caso de erro
        return {
          processos: [],
          processosRecentes: [],
          usuarios: [],
          atualizacoes: [],
          statusCounts: {},
          totalProcessos: 0,
          totalUsuarios: 0,
          processosAtivos: 0,
          usuariosAtivos: 0,
          usuariosPorTipo: {},
          processosPorStatus: {
            em_andamento: 0,
            aguardando: 0,
            finalizado: 0,
            arquivado: 0
          }
        };
      }
    },
    enabled: !!(token && user && getUserRole(user)),
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: (failureCount, error) => {
      // Não retry se for erro de autenticação
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ===== HOOKS PARA USUÁRIOS =====

export function useUsuarios(search = "") {
  const { token, user } = useAuthContext();
  
  return useQuery({
    queryKey: ['usuarios', getUserRole(user), search],
    queryFn: async () => {
      const userRole = getUserRole(user);
      if (!token || !userRole) throw new Error('Token ou usuário não disponível');
      
      // Admin pode ver todos, Professor pode ver alunos
      let endpoint = "/api/usuarios";
      if (userRole === "Professor") {
        endpoint = "/api/usuarios/alunos";
      }
      
      let data = await apiRequest(endpoint, { token });
      
      // Filtrar por termo de busca se fornecido
      if (search.trim()) {
        data = data.filter(usuario => 
          usuario.nome?.toLowerCase().includes(search.toLowerCase()) ||
          usuario.email?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      return data;
    },
    enabled: !!(token && user),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
}

export function useUsuario(id) {
  const { token } = useAuthContext();
  
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      if (!id) return null;
      const data = await apiRequest(`/api/usuarios/${id}`, { token });
      return data;
    },
    enabled: !!(token && id),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}

// ===== MUTATION HOOKS =====

export function useCreateUsuario() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData) => {
      return await apiRequest('/api/usuarios', {
        method: 'POST',
        token,
        body: userData
      });
    },
    onSuccess: () => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useUpdateUsuario() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...userData }) => {
      return await apiRequest(`/api/usuarios/${id}`, {
        method: 'PUT',
        token,
        body: userData
      });
    },
    onSuccess: (data, variables) => {
      // Invalidar cache específico do usuário e lista geral
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useDeleteUsuario() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      return await apiRequest(`/api/usuarios/${id}`, {
        method: 'DELETE',
        token
      });
    },
    onSuccess: () => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useCreateProcesso() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (processoData) => {
      return await apiRequest('/api/processos', {
        method: 'POST',
        token,
        body: processoData
      });
    },
    onSuccess: () => {
      // Invalidar cache de processos
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useUpdateProcesso() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...processoData }) => {
      return await apiRequest(`/api/processos/${id}`, {
        method: 'PUT',
        token,
        body: processoData
      });
    },
    onSuccess: (data, variables) => {
      // Invalidar cache específico do processo e lista geral
      queryClient.invalidateQueries({ queryKey: ['processo', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

// ===== HOOK GENÉRICO (para compatibilidade) =====

export default function useApi() {
  // Retorna funções úteis para componentes legados
  return {
    getUserRole,
    // Adicionar outras funções conforme necessário
  };
}