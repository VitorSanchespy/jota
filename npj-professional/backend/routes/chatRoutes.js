const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const authMiddleware = require('../middleware/authMiddleware');
const permissionsService = require('../services/permissionsService');
const logger = require('../services/loggerService');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: Obter salas de chat do usuário
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de salas de chat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [custom, process, private, general]
 *                       unreadCount:
 *                         type: integer
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/rooms', async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await chatService.getUserRooms(userId);
    
    res.json({ rooms });
  } catch (error) {
    logger.error('Erro ao obter salas de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: Criar nova sala de chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da sala
 *               description:
 *                 type: string
 *                 description: Descrição da sala
 *               members:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs dos membros iniciais
 *               isPrivate:
 *                 type: boolean
 *                 description: Se a sala é privada
 *               allowFileUpload:
 *                 type: boolean
 *                 description: Se permite upload de arquivos
 *               maxMembers:
 *                 type: integer
 *                 description: Número máximo de membros
 *     responses:
 *       201:
 *         description: Sala criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/rooms', async (req, res) => {
  try {
    const userId = req.user.id;
    const roomData = req.body;
    
    if (!roomData.name) {
      return res.status(400).json({ error: 'Nome da sala é obrigatório' });
    }
    
    const room = await chatService.createChatRoom(roomData, userId);
    
    res.status(201).json({ room });
  } catch (error) {
    logger.error('Erro ao criar sala de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Obter mensagens de uma sala
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensagens
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: ID da mensagem para buscar mensagens anteriores
 *     responses:
 *       200:
 *         description: Lista de mensagens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       senderId:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       edited:
 *                         type: boolean
 *                       readBy:
 *                         type: array
 *                         items:
 *                           type: integer
 *       403:
 *         description: Acesso negado à sala
 *       404:
 *         description: Sala não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    // Verificar acesso à sala
    const hasAccess = await chatService.checkRoomAccess(userId, roomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado à sala de chat' });
    }
    
    const messages = await chatService.getRoomMessages(roomId, limit);
    
    res.json({ messages });
  } catch (error) {
    logger.error('Erro ao obter mensagens da sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/messages/{messageId}/read:
 *   patch:
 *     summary: Marcar mensagem como lida
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da mensagem
 *     responses:
 *       200:
 *         description: Mensagem marcada como lida
 *       404:
 *         description: Mensagem não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    await chatService.markMessageAsRead(userId, messageId);
    
    res.json({ message: 'Mensagem marcada como lida' });
  } catch (error) {
    logger.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/members:
 *   get:
 *     summary: Obter membros de uma sala
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     responses:
 *       200:
 *         description: Lista de membros da sala
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       online:
 *                         type: boolean
 *                 admins:
 *                   type: array
 *                   items:
 *                     type: integer
 *       403:
 *         description: Acesso negado à sala
 *       404:
 *         description: Sala não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/rooms/:roomId/members', async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    // Verificar acesso à sala
    const hasAccess = await chatService.checkRoomAccess(userId, roomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado à sala de chat' });
    }
    
    const redisService = require('../services/redisService');
    const roomKey = `chat_room:${roomId}`;
    const roomData = await redisService.get(roomKey);
    
    if (!roomData) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    // Buscar informações dos membros
    const User = require('../models/userModels');
    const members = await User.findAll({
      where: { id: roomData.members },
      attributes: ['id', 'nome', 'email', 'role']
    });
    
    // Verificar quais estão online
    const onlineUsers = new Set();
    for (const [socketId, connection] of chatService.activeConnections) {
      onlineUsers.add(connection.userId);
    }
    
    const membersWithStatus = members.map(member => ({
      ...member.toJSON(),
      online: onlineUsers.has(member.id)
    }));
    
    res.json({
      members: membersWithStatus,
      admins: roomData.admins || []
    });
  } catch (error) {
    logger.error('Erro ao obter membros da sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/members:
 *   post:
 *     summary: Adicionar membro à sala
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário a ser adicionado
 *     responses:
 *       200:
 *         description: Membro adicionado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Sala não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/rooms/:roomId/members', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId: newMemberId } = req.body;
    const userId = req.user.id;
    
    if (!newMemberId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    
    // Verificar se é admin da sala ou admin do sistema
    const redisService = require('../services/redisService');
    const roomKey = `chat_room:${roomId}`;
    const roomData = await redisService.get(roomKey);
    
    if (!roomData) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    const isRoomAdmin = roomData.admins.includes(userId);
    const isSystemAdmin = req.user.role === 'Admin';
    
    if (!isRoomAdmin && !isSystemAdmin) {
      return res.status(403).json({ error: 'Apenas admins podem adicionar membros' });
    }
    
    // Verificar se o usuário já é membro
    if (roomData.members.includes(newMemberId)) {
      return res.status(400).json({ error: 'Usuário já é membro da sala' });
    }
    
    // Adicionar membro
    roomData.members.push(newMemberId);
    roomData.updatedAt = new Date().toISOString();
    roomData.updatedBy = userId;
    
    await redisService.set(roomKey, roomData, 30 * 24 * 60 * 60);
    
    logger.audit('CHAT_MEMBER_ADDED', { roomId, newMemberId, addedBy: userId });
    
    res.json({ message: 'Membro adicionado com sucesso' });
  } catch (error) {
    logger.error('Erro ao adicionar membro à sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/members/{memberId}:
 *   delete:
 *     summary: Remover membro da sala
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do membro a ser removido
 *     responses:
 *       200:
 *         description: Membro removido com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Sala ou membro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/rooms/:roomId/members/:memberId', async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const userId = req.user.id;
    const memberIdInt = parseInt(memberId);
    
    // Verificar se é admin da sala, admin do sistema, ou removendo a si mesmo
    const redisService = require('../services/redisService');
    const roomKey = `chat_room:${roomId}`;
    const roomData = await redisService.get(roomKey);
    
    if (!roomData) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    const isRoomAdmin = roomData.admins.includes(userId);
    const isSystemAdmin = req.user.role === 'Admin';
    const isSelfRemoval = userId === memberIdInt;
    
    if (!isRoomAdmin && !isSystemAdmin && !isSelfRemoval) {
      return res.status(403).json({ error: 'Sem permissão para remover este membro' });
    }
    
    // Verificar se o usuário é membro
    if (!roomData.members.includes(memberIdInt)) {
      return res.status(404).json({ error: 'Usuário não é membro da sala' });
    }
    
    // Remover membro
    roomData.members = roomData.members.filter(id => id !== memberIdInt);
    roomData.updatedAt = new Date().toISOString();
    roomData.updatedBy = userId;
    
    await redisService.set(roomKey, roomData, 30 * 24 * 60 * 60);
    
    logger.audit('CHAT_MEMBER_REMOVED', { roomId, removedMemberId: memberIdInt, removedBy: userId });
    
    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao remover membro da sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/online-users:
 *   get:
 *     summary: Obter usuários online
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários online
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 onlineUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       connectedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/online-users', async (req, res) => {
  try {
    const onlineUsers = Array.from(chatService.activeConnections.values()).map(connection => ({
      userId: connection.userId,
      connectedAt: connection.connectedAt
    }));
    
    // Remover duplicatas (mesmo usuário com múltiplas conexões)
    const uniqueUsers = onlineUsers.reduce((acc, user) => {
      if (!acc.find(u => u.userId === user.userId)) {
        acc.push(user);
      }
      return acc;
    }, []);
    
    res.json({
      onlineUsers: uniqueUsers,
      count: uniqueUsers.length
    });
  } catch (error) {
    logger.error('Erro ao obter usuários online:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/chat/search:
 *   get:
 *     summary: Buscar mensagens
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: ID da sala para filtrar busca
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       messageId:
 *                         type: string
 *                       roomId:
 *                         type: string
 *                       roomName:
 *                         type: string
 *                       senderId:
 *                         type: integer
 *                       senderName:
 *                         type: string
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/search', async (req, res) => {
  try {
    const { query, roomId, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query deve ter pelo menos 2 caracteres' });
    }
    
    // Implementar busca real (placeholder por enquanto)
    const results = [];
    
    res.json({
      results,
      count: results.length,
      query: query.trim()
    });
  } catch (error) {
    logger.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;