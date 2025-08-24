// Utilitários para gerenciamento de usuários e roles
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

// Verificar se usuário tem determinada role
export const hasRole = (user, roles) => {
  const userRole = getUserRole(user);
  if (!userRole) return false;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(userRole);
};

// Verificar se usuário é admin
export const isAdmin = (user) => hasRole(user, 'Admin');

// Verificar se usuário é professor
export const isProfessor = (user) => hasRole(user, 'Professor');

// Verificar se usuário é aluno
export const isAluno = (user) => hasRole(user, 'Aluno');

// Verificar se usuário pode criar processos
export const canCreateProcess = (user) => hasRole(user, ['Admin', 'Professor']);

// Verificar se usuário pode gerenciar usuários
export const canManageUsers = (user) => hasRole(user, ['Admin', 'Professor']);

// Formatar data para exibição
export const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch (error) {
    return "-";
  }
};

// Formatar data e hora para exibição
export const formatDateTime = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString('pt-BR');
  } catch (error) {
    return "-";
  }
};

// Verificar se valor é objeto e renderizar adequadamente
export const renderValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    return value.nome || value.name || JSON.stringify(value);
  }
  return value || "-";
};

// Estilos comuns para botões
export const buttonStyles = {
  primary: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  success: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  danger: {
    padding: '12px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  secondary: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  }
};

// Status colors para processos
export const getStatusColor = (status) => {
  const statusText = renderValue(status);
  switch (statusText) {
    case 'Aberto':
      return { bg: '#d4edda', color: '#155724' };
    case 'Em andamento':
      return { bg: '#fff3cd', color: '#856404' };
    case 'Fechado':
    case 'Concluído':
      return { bg: '#f8d7da', color: '#721c24' };
    default:
      return { bg: '#f8f9fa', color: '#6c757d' };
  }
};
