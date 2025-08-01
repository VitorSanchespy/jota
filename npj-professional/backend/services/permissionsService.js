const logger = require('./loggerService');
const redisService = require('./redisService');
const { Op } = require('sequelize');

class PermissionsService {
  constructor() {
    this.permissions = new Map();
    this.roleHierarchy = new Map();
    this.initializePermissions();
  }

  // Inicializar sistema de permissões
  initializePermissions() {
    // Definir hierarquia de papéis
    this.roleHierarchy.set('Admin', ['Professor', 'Aluno']);
    this.roleHierarchy.set('Professor', ['Aluno']);
    this.roleHierarchy.set('Aluno', []);

    // Definir permissões por módulo
    this.permissions.set('processes', {
      'Admin': ['create', 'read', 'update', 'delete', 'assign', 'archive', 'export'],
      'Professor': ['create', 'read', 'update', 'assign', 'export'],
      'Aluno': ['read']
    });

    this.permissions.set('users', {
      'Admin': ['create', 'read', 'update', 'delete', 'activate', 'deactivate'],
      'Professor': ['read'],
      'Aluno': ['read_own']
    });

    this.permissions.set('appointments', {
      'Admin': ['create', 'read', 'update', 'delete', 'reschedule'],
      'Professor': ['create', 'read', 'update', 'delete', 'reschedule'],
      'Aluno': ['create', 'read_own', 'update_own', 'delete_own']
    });

    this.permissions.set('files', {
      'Admin': ['upload', 'download', 'delete', 'version'],
      'Professor': ['upload', 'download', 'delete', 'version'],
      'Aluno': ['upload', 'download']
    });

    this.permissions.set('analytics', {
      'Admin': ['view_all', 'export', 'configure'],
      'Professor': ['view_own', 'export_own'],
      'Aluno': ['view_basic']
    });

    this.permissions.set('system', {
      'Admin': ['configure', 'backup', 'logs', 'maintenance'],
      'Professor': [],
      'Aluno': []
    });
  }

  // Verificar permissão
  hasPermission(userRole, module, action, resourceOwnerId = null, userId = null) {
    try {
      // Verificar se o módulo existe
      if (!this.permissions.has(module)) {
        logger.warn(`Módulo não encontrado: ${module}`);
        return false;
      }

      const modulePermissions = this.permissions.get(module);
      const userPermissions = modulePermissions[userRole] || [];

      // Verificar permissão direta
      if (userPermissions.includes(action)) {
        return true;
      }

      // Verificar permissões contextuais (próprio recurso)
      if (action.endsWith('_own') && userId === resourceOwnerId) {
        const baseAction = action.replace('_own', '');
        return userPermissions.includes(baseAction) || userPermissions.includes(action);
      }

      // Verificar hierarquia de papéis
      return this.hasPermissionByHierarchy(userRole, module, action);
    } catch (error) {
      logger.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  // Verificar permissão por hierarquia
  hasPermissionByHierarchy(userRole, module, action) {
    const subordinateRoles = this.roleHierarchy.get(userRole) || [];
    const modulePermissions = this.permissions.get(module);

    for (const role of subordinateRoles) {
      const rolePermissions = modulePermissions[role] || [];
      if (rolePermissions.includes(action)) {
        return true;
      }
    }

    return false;
  }

  // Obter todas as permissões de um usuário
  getUserPermissions(userRole) {
    const allPermissions = {};

    for (const [module, permissions] of this.permissions) {
      allPermissions[module] = permissions[userRole] || [];
      
      // Adicionar permissões herdadas
      const subordinateRoles = this.roleHierarchy.get(userRole) || [];
      for (const role of subordinateRoles) {
        const inheritedPermissions = permissions[role] || [];
        allPermissions[module] = [...new Set([...allPermissions[module], ...inheritedPermissions])];
      }
    }

    return allPermissions;
  }

  // Middleware de autorização
  authorize(module, action) {
    return (req, res, next) => {
      try {
        const userRole = req.user?.role;
        const userId = req.user?.id;
        const resourceOwnerId = req.params?.userId || req.body?.userId || req.query?.userId;

        if (!userRole) {
          return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        if (!this.hasPermission(userRole, module, action, resourceOwnerId, userId)) {
          logger.security('Acesso negado', {
            userId,
            userRole,
            module,
            action,
            resourceOwnerId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          return res.status(403).json({ 
            error: 'Acesso negado',
            details: `Permissão necessária: ${module}.${action}`
          });
        }

        // Log da ação autorizada
        this.logAuthorizedAction(userId, userRole, module, action, req);
        next();
      } catch (error) {
        logger.error('Erro no middleware de autorização:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    };
  }

  // Registrar ação autorizada
  logAuthorizedAction(userId, userRole, module, action, req) {
    logger.audit('ACTION_AUTHORIZED', {
      userId,
      userRole,
      module,
      action,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: this.sanitizeLogData(req.body),
      params: req.params,
      query: req.query
    });
  }

  // Sanitizar dados para log (remover senhas, tokens, etc.)
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'senha', 'token', 'authorization', 'auth'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  // Criar grupo de usuários personalizado
  async createUserGroup(groupData) {
    try {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const group = {
        id: groupId,
        name: groupData.name,
        description: groupData.description || '',
        permissions: groupData.permissions || {},
        members: [],
        createdAt: new Date().toISOString(),
        createdBy: groupData.createdBy
      };

      // Salvar no Redis
      const cacheKey = `user_group:${groupId}`;
      await redisService.set(cacheKey, group, 86400); // 24 horas

      // Indexar grupo para busca
      const groupsIndex = await redisService.get('user_groups_index') || [];
      groupsIndex.push(groupId);
      await redisService.set('user_groups_index', groupsIndex, 86400);

      logger.audit('USER_GROUP_CREATED', { groupId, groupData });
      return group;
    } catch (error) {
      logger.error('Erro ao criar grupo de usuários:', error);
      throw error;
    }
  }

  // Adicionar usuário a grupo
  async addUserToGroup(groupId, userId, addedBy) {
    try {
      const cacheKey = `user_group:${groupId}`;
      const group = await redisService.get(cacheKey);

      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      if (!group.members.includes(userId)) {
        group.members.push(userId);
        group.updatedAt = new Date().toISOString();
        group.updatedBy = addedBy;

        await redisService.set(cacheKey, group, 86400);

        // Atualizar cache de permissões do usuário
        await this.updateUserPermissionsCache(userId);

        logger.audit('USER_ADDED_TO_GROUP', { groupId, userId, addedBy });
      }

      return group;
    } catch (error) {
      logger.error('Erro ao adicionar usuário ao grupo:', error);
      throw error;
    }
  }

  // Remover usuário de grupo
  async removeUserFromGroup(groupId, userId, removedBy) {
    try {
      const cacheKey = `user_group:${groupId}`;
      const group = await redisService.get(cacheKey);

      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      group.members = group.members.filter(id => id !== userId);
      group.updatedAt = new Date().toISOString();
      group.updatedBy = removedBy;

      await redisService.set(cacheKey, group, 86400);

      // Atualizar cache de permissões do usuário
      await this.updateUserPermissionsCache(userId);

      logger.audit('USER_REMOVED_FROM_GROUP', { groupId, userId, removedBy });
      return group;
    } catch (error) {
      logger.error('Erro ao remover usuário do grupo:', error);
      throw error;
    }
  }

  // Obter grupos de um usuário
  async getUserGroups(userId) {
    try {
      const groupsIndex = await redisService.get('user_groups_index') || [];
      const userGroups = [];

      for (const groupId of groupsIndex) {
        const cacheKey = `user_group:${groupId}`;
        const group = await redisService.get(cacheKey);

        if (group && group.members.includes(userId)) {
          userGroups.push(group);
        }
      }

      return userGroups;
    } catch (error) {
      logger.error('Erro ao obter grupos do usuário:', error);
      return [];
    }
  }

  // Atualizar cache de permissões do usuário
  async updateUserPermissionsCache(userId) {
    try {
      const User = require('../models/userModels');
      const user = await User.findByPk(userId, { attributes: ['role'] });

      if (!user) return;

      // Obter permissões base por papel
      const basePermissions = this.getUserPermissions(user.role);

      // Obter permissões adicionais de grupos
      const userGroups = await this.getUserGroups(userId);
      const groupPermissions = {};

      for (const group of userGroups) {
        for (const [module, actions] of Object.entries(group.permissions || {})) {
          if (!groupPermissions[module]) {
            groupPermissions[module] = [];
          }
          groupPermissions[module] = [...new Set([...groupPermissions[module], ...actions])];
        }
      }

      // Combinar permissões
      const combinedPermissions = { ...basePermissions };
      for (const [module, actions] of Object.entries(groupPermissions)) {
        combinedPermissions[module] = [...new Set([...(combinedPermissions[module] || []), ...actions])];
      }

      // Salvar no cache
      const cacheKey = `user_permissions:${userId}`;
      await redisService.set(cacheKey, combinedPermissions, 3600); // 1 hora

      return combinedPermissions;
    } catch (error) {
      logger.error('Erro ao atualizar cache de permissões:', error);
    }
  }

  // Obter permissões efetivas do usuário (incluindo grupos)
  async getEffectiveUserPermissions(userId) {
    try {
      const cacheKey = `user_permissions:${userId}`;
      let permissions = await redisService.get(cacheKey);

      if (!permissions) {
        permissions = await this.updateUserPermissionsCache(userId);
      }

      return permissions || {};
    } catch (error) {
      logger.error('Erro ao obter permissões efetivas:', error);
      return {};
    }
  }

  // Listar todos os grupos
  async listAllGroups() {
    try {
      const groupsIndex = await redisService.get('user_groups_index') || [];
      const groups = [];

      for (const groupId of groupsIndex) {
        const cacheKey = `user_group:${groupId}`;
        const group = await redisService.get(cacheKey);

        if (group) {
          groups.push(group);
        }
      }

      return groups;
    } catch (error) {
      logger.error('Erro ao listar grupos:', error);
      return [];
    }
  }

  // Validar estrutura de permissões
  validatePermissions(permissions) {
    const errors = [];

    for (const [module, actions] of Object.entries(permissions)) {
      if (!this.permissions.has(module)) {
        errors.push(`Módulo inválido: ${module}`);
        continue;
      }

      const validActions = new Set();
      const modulePermissions = this.permissions.get(module);
      
      // Coletar todas as ações válidas do módulo
      for (const roleActions of Object.values(modulePermissions)) {
        roleActions.forEach(action => validActions.add(action));
      }

      for (const action of actions) {
        if (!validActions.has(action)) {
          errors.push(`Ação inválida '${action}' para módulo '${module}'`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Middleware para verificar propriedade de recurso
  checkResourceOwnership(resourceModel, resourceIdParam = 'id', ownerField = 'created_by') {
    return async (req, res, next) => {
      try {
        const resourceId = req.params[resourceIdParam];
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Admin sempre tem acesso
        if (userRole === 'Admin') {
          return next();
        }

        const Model = require(`../models/${resourceModel}`);
        const resource = await Model.findByPk(resourceId, { 
          attributes: ['id', ownerField] 
        });

        if (!resource) {
          return res.status(404).json({ error: 'Recurso não encontrado' });
        }

        if (resource[ownerField] !== userId) {
          logger.security('Tentativa de acesso a recurso não autorizado', {
            userId,
            userRole,
            resourceId,
            resourceModel,
            ownerId: resource[ownerField]
          });

          return res.status(403).json({ error: 'Acesso negado: você não é o proprietário deste recurso' });
        }

        req.resource = resource;
        next();
      } catch (error) {
        logger.error('Erro ao verificar propriedade do recurso:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    };
  }
}

module.exports = new PermissionsService();