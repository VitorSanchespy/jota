export function hasRole(user, roles) {
  if (!user) return false;

  // Prioriza o role_id se disponível
  if (user.role_id) {
    const roleMap = { 1: 'admin', 2: 'aluno', 3: 'professor' };
    const userRole = roleMap[user.role_id];
    if (Array.isArray(roles)) {
      return roles.map(r => String(r).toLowerCase()).includes(userRole);
    }
    return userRole === String(roles).toLowerCase();
  }

  // Fallback para o campo 'role' (string)
  if (!user.role) return false;
  const userRoleString = String(user.role).toLowerCase();
  if (Array.isArray(roles)) {
    return roles.map(r => String(r).toLowerCase()).includes(userRoleString);
  }
  return userRoleString === String(roles).toLowerCase();
}