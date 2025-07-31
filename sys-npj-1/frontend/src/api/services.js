import { apiRequest, uploadFile } from './apiRequest.js';

// ===== AUTH SERVICES =====
export const authService = {
  // POST /auth/login
  login: async (email, senha) => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, senha }
    });
  },

  // POST /auth/registrar
  register: async (nome, email, senha, role_id = 2) => {
    return await apiRequest('/auth/registrar', {
      method: 'POST',
      body: { nome, email, senha, role_id }
    });
  },

  // POST /auth/esqueci-senha
  forgotPassword: async (email) => {
    return await apiRequest('/auth/esqueci-senha', {
      method: 'POST',
      body: { email }
    });
  },

  // POST /auth/redefinir-senha
  resetPassword: async (token, novaSenha) => {
    return await apiRequest('/auth/redefinir-senha', {
      method: 'POST',
      body: { novaSenha },
      token
    });
  },

  // GET /auth/perfil
  getProfile: async (token) => {
    return await apiRequest('/auth/perfil', {
      method: 'GET',
      token
    });
  },

  // POST /auth/refresh
  refreshToken: async (refreshToken) => {
    return await apiRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken }
    });
  },
};

// ===== USER SERVICES =====
export const userService = {
  // GET /api/usuarios/pagina
  listUsers: async (token, search = '', page = 1) => {
    return await apiRequest(`/api/usuarios/pagina?search=${search}&page=${page}`, {
      method: 'GET',
      token
    });
  },

  // GET /api/usuarios/vincular
  getUsersForAssignment: async (token, search = '', page = 1) => {
    return await apiRequest(`/api/usuarios/vincular?search=${search}&page=${page}`, {
      method: 'GET',
      token
    });
  },

  // GET /api/usuarios/role/:roleName
  getUsersByRole: async (token, roleName) => {
    return await apiRequest(`/api/usuarios/role/${roleName}`, {
      method: 'GET',
      token
    });
  },

  // GET /api/usuarios/:id
  getUserById: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: 'GET',
      token
    });
  },

  // POST /api/usuarios
  createUser: async (token, userData) => {
    return await apiRequest('/api/usuarios', {
      method: 'POST',
      token,
      body: userData
    });
  },

  // PUT /api/usuarios/:id
  updateUser: async (token, id, userData) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: 'PUT',
      token,
      body: userData
    });
  },

  // PUT /api/usuarios/:id/senha
  updatePassword: async (token, id, senha) => {
    return await apiRequest(`/api/usuarios/${id}/senha`, {
      method: 'PUT',
      token,
      body: { senha }
    });
  },

  // DELETE /api/usuarios/:id
  softDeleteUser: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: 'DELETE',
      token
    });
  },

  // PUT /api/usuarios/:id/reativar
  reactivateUser: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}/reativar`, {
      method: 'PUT',
      token
    });
  },

  // GET /api/usuarios (para admin)
  getAllUsers: async (token, search = '', page = 1) => {
    const queryParams = new URLSearchParams({ search, page }).toString();
    return await apiRequest(`/api/usuarios?${queryParams}`, {
      method: 'GET',
      token
    });
  },

  // GET /api/usuarios/alunos (para professor)
  getStudents: async (token, search = '', page = 1) => {
    const queryParams = new URLSearchParams({ search, page }).toString();
    return await apiRequest(`/api/usuarios/alunos?${queryParams}`, {
      method: 'GET',
      token
    });
  },

  // Alias para compatibilidade
  deleteUser: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: 'DELETE',
      token
    });
  }
};

// ===== PROCESS SERVICES =====
export const processService = {
  // POST /api/processos/novo
  createProcess: async (token, processData) => {
  return await apiRequest('/api/processos/novo', {
    method: 'POST',
    token,
    body: processData
  });
},

  // GET /api/processos
  listProcesses: async (token) => {
    return await apiRequest('/api/processos', {
      method: 'GET',
      token
    });
  },

  // GET /api/processos - alias para compatibilidade
  getAllProcesses: async (token) => {
    return await apiRequest('/api/processos', {
      method: 'GET',
      token
    });
  },

  // GET /api/processos/buscar
  searchProcesses: async (token, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await apiRequest(`/api/processos/buscar?${queryParams}`, {
      method: 'GET',
      token
    });
  },

  // GET /api/processos/meus-processos
  getMyProcesses: async (token) => {
    return await apiRequest('/api/processos/meus-processos', {
      method: 'GET',
      token
    });
  },

  // PATCH /api/processos/:processo_id
  updateProcess: async (token, processoId, updateData) => {
    return await apiRequest(`/api/processos/${processoId}`, {
      method: 'PATCH',
      token,
      body: updateData
    });
  },

  // GET /api/processos/:processo_id/usuarios
  getProcessUsers: async (token, processoId, pagina = 1, porPagina = 10) => {
    return await apiRequest(`/api/processos/${processoId}/usuarios?pagina=${pagina}&porPagina=${porPagina}`, {
      method: 'GET',
      token
    });
  },

  // POST /api/processos/vincular-usuario
  assignUserToProcess: async (token, processo_id, usuario_id, role) => {
    return await apiRequest('/api/processos/vincular-usuario', {
      method: 'POST',
      token,
      body: { processo_id, usuario_id, role }
    });
  },

  // DELETE /api/processos/remover-usuario
  removeUserFromProcess: async (token, processo_id, usuario_id) => {
    return await apiRequest('/api/processos/remover-usuario', {
      method: 'DELETE',
      token,
      body: { processo_id, usuario_id }
    });
  },

  // POST /api/processos/:processo_id/atualizacoes
  addProcessUpdate: async (token, processoId, updateData) => {
    return await apiRequest(`/api/processos/${processoId}/atualizacoes`, {
      method: 'POST',
      token,
      body: updateData
    });
  },

  // DELETE /api/processos/:processo_id/atualizacoes/:atualizacao_id
  removeProcessUpdate: async (token, processoId, atualizacaoId) => {
    return await apiRequest(`/api/processos/${processoId}/atualizacoes/${atualizacaoId}`, {
      method: 'DELETE',
      token
    });
  }
};

// ===== AUXILIARY TABLES SERVICES =====
export const auxTablesService = {
  // GET /api/aux/materia-assunto
  getMateriaAssunto: async (token) => {
    return await apiRequest('/api/aux/materia-assunto', {
      method: 'GET',
      token
    });
  },

  // POST /api/aux/materia-assunto
  createMateriaAssunto: async (token, nome) => {
    return await apiRequest('/api/aux/materia-assunto', {
      method: 'POST',
      token,
      body: { nome }
    });
  },

  // GET /api/aux/fase
  getFase: async (token) => {
    return await apiRequest('/api/aux/fase', {
      method: 'GET',
      token
    });
  },

  // POST /api/aux/fase
  createFase: async (token, nome) => {
    return await apiRequest('/api/aux/fase', {
      method: 'POST',
      token,
      body: { nome }
    });
  },

  // GET /api/aux/diligencia
  getDiligencia: async (token) => {
    return await apiRequest('/api/aux/diligencia', {
      method: 'GET',
      token
    });
  },

  // POST /api/aux/diligencia
  createDiligencia: async (token, nome) => {
    return await apiRequest('/api/aux/diligencia', {
      method: 'POST',
      token,
      body: { nome }
    });
  },

  // GET /api/aux/local-tramitacao
  getLocalTramitacao: async (token) => {
    return await apiRequest('/api/aux/local-tramitacao', {
      method: 'GET',
      token
    });
  },

  // POST /api/aux/local-tramitacao
  createLocalTramitacao: async (token, nome) => {
    return await apiRequest('/api/aux/local-tramitacao', {
      method: 'POST',
      token,
      body: { nome }
    });
  }
};

// ===== FILE SERVICES =====
export const fileService = {
  // POST /api/arquivos/upload
  uploadFile: async (formData, token) => {
    return await uploadFile(formData, token);
  },

  // GET /api/arquivos/processo/:processo_id
  getProcessFiles: async (token, processoId) => {
    return await apiRequest(`/api/arquivos/processo/${processoId}`, {
      method: 'GET',
      token
    });
  },

  // GET /api/arquivos/usuario/:usuario_id
  getUserFiles: async (token, usuarioId) => {
    return await apiRequest(`/api/arquivos/usuario/${usuarioId}`, {
      method: 'GET',
      token
    });
  },

  // POST /api/arquivos/anexar
  attachFileToProcess: async (token, processo_id, arquivo_id) => {
    return await apiRequest('/api/arquivos/anexar', {
      method: 'POST',
      token,
      body: { processo_id, arquivo_id }
    });
  },

  // DELETE /api/arquivos/:id
  deleteFile: async (fileId, token) => {
    return await apiRequest(`/api/arquivos/${fileId}`, {
      method: 'DELETE',
      token
    });
  },

  // PUT /api/arquivos/desvincular/:id
  unlinkFileFromProcess: async (fileId, token) => {
    return await apiRequest(`/api/arquivos/desvincular/${fileId}`, {
      method: 'PUT',
      token
    });
  }
};

// ===== PROCESS UPDATES SERVICES =====
export const processUpdatesService = {
  // GET /api/atualizacoes/:processo_id
  getProcessUpdates: async (token, processoId) => {
    return await apiRequest(`/api/atualizacoes/${processoId}`, {
      method: 'GET',
      token
    });
  },

  // POST /api/atualizacoes
  createProcessUpdate: async (token, updateData) => {
    return await apiRequest('/api/atualizacoes', {
      method: 'POST',
      token,
      body: updateData
    });
  }
};
