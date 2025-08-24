const logger = require('./loggerService');
const redisService = require('./redisService');
const notificationService = require('./advancedNotificationService');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ChatService {
  constructor() {
    this.activeConnections = new Map(); // socketId -> userInfo
    this.roomMembers = new Map(); // roomId -> Set<userId>
    this.socketIo = null;
  }

  // Configurar Socket.IO
  setSocketIo(io) {
    this.socketIo = io;
    this.setupSocketHandlers();
  }

  // Configurar manipuladores de eventos do Socket.IO
  setupSocketHandlers() {
    if (!this.socketIo) return;

    this.socketIo.on('connection', (socket) => {
      // Registrar conexão
      this.activeConnections.set(socket.id, {
        userId: socket.userId,
        userRole: socket.userRole,
        connectedAt: new Date()
      });

      // Entrar em salas de chat
      socket.on('join_chat_room', (roomId) => {
        this.joinChatRoom(socket, roomId);
      });

      // Sair de salas de chat
      socket.on('leave_chat_room', (roomId) => {
        this.leaveChatRoom(socket, roomId);
      });

      // Enviar mensagem
      socket.on('send_message', (data) => {
        this.handleSendMessage(socket, data);
      });

      // Marcar mensagem como lida
      socket.on('mark_message_read', (messageId) => {
        this.markMessageAsRead(socket.userId, messageId);
      });

      // Digitando...
      socket.on('typing_start', (roomId) => {
        this.handleTypingStart(socket, roomId);
      });

      socket.on('typing_stop', (roomId) => {
        this.handleTypingStop(socket, roomId);
      });

      // Desconexão
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // Entrar em uma sala de chat
  async joinChatRoom(socket, roomId) {
    try {
      // Verificar se o usuário tem permissão para entrar na sala
      const hasAccess = await this.checkRoomAccess(socket.userId, roomId);
      if (!hasAccess) {
        socket.emit('chat_error', { message: 'Acesso negado à sala de chat' });
        return;
      }

      socket.join(roomId);

      // Adicionar aos membros da sala
      if (!this.roomMembers.has(roomId)) {
        this.roomMembers.set(roomId, new Set());
      }
      this.roomMembers.get(roomId).add(socket.userId);

      // Buscar mensagens recentes da sala
      const recentMessages = await this.getRoomMessages(roomId, 50);
      socket.emit('room_messages', { roomId, messages: recentMessages });

      // Notificar outros membros
      socket.to(roomId).emit('user_joined_room', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

      logger.info(`Usuário ${socket.userId} entrou na sala de chat ${roomId}`);
    } catch (error) {
      logger.error('Erro ao entrar na sala de chat:', error);
      socket.emit('chat_error', { message: 'Erro ao entrar na sala' });
    }
  }

  // Sair de uma sala de chat
  leaveChatRoom(socket, roomId) {
    try {
      socket.leave(roomId);

      // Remover dos membros da sala
      if (this.roomMembers.has(roomId)) {
        this.roomMembers.get(roomId).delete(socket.userId);
        
        // Limpar sala vazia
        if (this.roomMembers.get(roomId).size === 0) {
          this.roomMembers.delete(roomId);
        }
      }

      // Notificar outros membros
      socket.to(roomId).emit('user_left_room', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

      logger.info(`Usuário ${socket.userId} saiu da sala de chat ${roomId}`);
    } catch (error) {
      logger.error('Erro ao sair da sala de chat:', error);
    }
  }

  // Manipular envio de mensagem
  async handleSendMessage(socket, data) {
    try {
      const { roomId, message, type = 'text', attachments = [] } = data;

      // Validar dados
      if (!roomId || !message) {
        socket.emit('chat_error', { message: 'Dados inválidos' });
        return;
      }

      // Verificar se o usuário está na sala
      if (!this.roomMembers.has(roomId) || !this.roomMembers.get(roomId).has(socket.userId)) {
        socket.emit('chat_error', { message: 'Você não está nesta sala' });
        return;
      }

      // Criar mensagem
      const messageData = {
        id: uuidv4(),
        roomId,
        senderId: socket.userId,
        message: this.sanitizeMessage(message),
        type,
        attachments: attachments.map(att => this.sanitizeAttachment(att)),
        timestamp: new Date().toISOString(),
        edited: false,
        readBy: [socket.userId] // Marcar como lida pelo remetente
      };

      // Salvar mensagem
      await this.saveMessage(messageData);

      // Enviar para todos na sala
      this.socketIo.to(roomId).emit('new_message', messageData);

      // Enviar notificações para usuários offline
      await this.sendOfflineNotifications(roomId, messageData);

      logger.info(`Mensagem enviada na sala ${roomId} por usuário ${socket.userId}`);
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      socket.emit('chat_error', { message: 'Erro ao enviar mensagem' });
    }
  }

  // Manipular início de digitação
  handleTypingStart(socket, roomId) {
    socket.to(roomId).emit('user_typing', {
      userId: socket.userId,
      roomId,
      isTyping: true
    });
  }

  // Manipular fim de digitação
  handleTypingStop(socket, roomId) {
    socket.to(roomId).emit('user_typing', {
      userId: socket.userId,
      roomId,
      isTyping: false
    });
  }

  // Manipular desconexão
  handleDisconnect(socket) {
    try {
      // Remover de todas as salas
      for (const [roomId, members] of this.roomMembers) {
        if (members.has(socket.userId)) {
          members.delete(socket.userId);
          socket.to(roomId).emit('user_left_room', {
            userId: socket.userId,
            timestamp: new Date().toISOString()
          });

          // Limpar sala vazia
          if (members.size === 0) {
            this.roomMembers.delete(roomId);
          }
        }
      }

      // Remover conexão ativa
      this.activeConnections.delete(socket.id);

      logger.info(`Usuário ${socket.userId} desconectado do chat`);
    } catch (error) {
      logger.error('Erro ao desconectar usuário:', error);
    }
  }

  // Verificar acesso à sala
  async checkRoomAccess(userId, roomId) {
    try {
      // Verificar se é uma sala de processo
      if (roomId.startsWith('process_')) {
        const processId = roomId.replace('process_', '');
        return await this.checkProcessAccess(userId, processId);
      }

      // Verificar se é uma sala de usuário (chat privado)
      if (roomId.startsWith('user_')) {
        const targetUserId = roomId.replace('user_', '');
        return await this.checkUserChatAccess(userId, targetUserId);
      }

      // Verificar se é uma sala geral
      if (roomId === 'general') {
        return true; // Todos os usuários autenticados podem acessar
      }

      // Sala personalizada - verificar no Redis
      return await this.checkCustomRoomAccess(userId, roomId);
    } catch (error) {
      logger.error('Erro ao verificar acesso à sala:', error);
      return false;
    }
  }

  // Verificar acesso a processo
  async checkProcessAccess(userId, processId) {
    try {
      const Processo = require('../models/processoModels');
      const UsuarioProcesso = require('../models/usuariosProcessoModels');
      const User = require('../models/userModels');

      const user = await User.findByPk(userId);
      if (!user) return false;

      // Admin tem acesso a tudo
      if (user.role === 'Admin') return true;

      // Verificar se é criador do processo
      const processo = await Processo.findByPk(processId);
      if (processo && processo.created_by === userId) return true;

      // Verificar se está associado ao processo
      const associacao = await UsuarioProcesso.findOne({
        where: { usuario_id: userId, processo_id: processId }
      });

      return !!associacao;
    } catch (error) {
      logger.error('Erro ao verificar acesso ao processo:', error);
      return false;
    }
  }

  // Verificar acesso a chat privado
  async checkUserChatAccess(userId, targetUserId) {
    try {
      // Usuários autenticados podem conversar entre si
      const User = require('../models/userModels');
      const targetUser = await User.findByPk(targetUserId);
      return !!targetUser && targetUser.ativo;
    } catch (error) {
      logger.error('Erro ao verificar acesso ao chat de usuário:', error);
      return false;
    }
  }

  // Verificar acesso a sala personalizada
  async checkCustomRoomAccess(userId, roomId) {
    try {
      const roomKey = `chat_room:${roomId}`;
      const roomData = await redisService.get(roomKey);

      if (!roomData) return false;

      return roomData.members.includes(userId) || roomData.admins.includes(userId);
    } catch (error) {
      logger.error('Erro ao verificar acesso à sala personalizada:', error);
      return false;
    }
  }

  // Salvar mensagem
  async saveMessage(messageData) {
    try {
      // Salvar no Redis com TTL de 30 dias
      const messageKey = `chat_message:${messageData.id}`;
      await redisService.set(messageKey, messageData, 30 * 24 * 60 * 60);

      // Adicionar à lista de mensagens da sala
      const roomMessagesKey = `chat_room_messages:${messageData.roomId}`;
      const roomMessages = await redisService.get(roomMessagesKey) || [];
      
      roomMessages.unshift(messageData.id);
      
      // Manter apenas as últimas 1000 mensagens
      if (roomMessages.length > 1000) {
        const removedMessages = roomMessages.splice(1000);
        
        // Remover mensagens antigas do cache
        for (const messageId of removedMessages) {
          await redisService.del(`chat_message:${messageId}`);
        }
      }

      await redisService.set(roomMessagesKey, roomMessages, 30 * 24 * 60 * 60);

      // Log da mensagem
      logger.audit('CHAT_MESSAGE_SENT', {
        messageId: messageData.id,
        roomId: messageData.roomId,
        senderId: messageData.senderId,
        type: messageData.type,
        hasAttachments: messageData.attachments.length > 0
      });
    } catch (error) {
      logger.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  // Obter mensagens da sala
  async getRoomMessages(roomId, limit = 50) {
    try {
      const roomMessagesKey = `chat_room_messages:${roomId}`;
      const messageIds = await redisService.get(roomMessagesKey) || [];

      const messages = [];
      const idsToFetch = messageIds.slice(0, limit);

      for (const messageId of idsToFetch) {
        const messageKey = `chat_message:${messageId}`;
        const message = await redisService.get(messageKey);
        if (message) {
          messages.push(message);
        }
      }

      return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      logger.error('Erro ao obter mensagens da sala:', error);
      return [];
    }
  }

  // Marcar mensagem como lida
  async markMessageAsRead(userId, messageId) {
    try {
      const messageKey = `chat_message:${messageId}`;
      const message = await redisService.get(messageKey);

      if (message && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await redisService.set(messageKey, message, 30 * 24 * 60 * 60);

        // Notificar sobre leitura
        this.socketIo.to(message.roomId).emit('message_read', {
          messageId,
          readBy: userId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Erro ao marcar mensagem como lida:', error);
    }
  }

  // Enviar notificações para usuários offline
  async sendOfflineNotifications(roomId, messageData) {
    try {
      const roomMembers = this.roomMembers.get(roomId) || new Set();
      const onlineUsers = new Set();

      // Identificar usuários online
      for (const [socketId, connection] of this.activeConnections) {
        if (roomMembers.has(connection.userId)) {
          onlineUsers.add(connection.userId);
        }
      }

      // Obter membros da sala que estão offline
      const offlineUsers = [...roomMembers].filter(userId => !onlineUsers.has(userId));

      // Enviar notificações para usuários offline
      for (const userId of offlineUsers) {
        if (userId !== messageData.senderId) {
          await notificationService.createNotificationFromTemplate(
            'CHAT_MESSAGE',
            userId,
            {
              senderName: await this.getUserName(messageData.senderId),
              roomName: await this.getRoomName(roomId),
              messagePreview: messageData.message.substring(0, 50)
            },
            true // Enviar por email também
          );
        }
      }
    } catch (error) {
      logger.error('Erro ao enviar notificações offline:', error);
    }
  }

  // Criar sala de chat personalizada
  async createChatRoom(roomData, creatorId) {
    try {
      const roomId = roomData.id || `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const room = {
        id: roomId,
        name: roomData.name,
        description: roomData.description || '',
        type: roomData.type || 'custom', // 'custom', 'process', 'private'
        admins: [creatorId],
        members: roomData.members || [creatorId],
        settings: {
          allowFileUpload: roomData.allowFileUpload || true,
          maxMembers: roomData.maxMembers || 100,
          isPrivate: roomData.isPrivate || false
        },
        createdAt: new Date().toISOString(),
        createdBy: creatorId
      };

      const roomKey = `chat_room:${roomId}`;
      await redisService.set(roomKey, room, 30 * 24 * 60 * 60);

      // Indexar sala
      const roomsIndex = await redisService.get('chat_rooms_index') || [];
      roomsIndex.push(roomId);
      await redisService.set('chat_rooms_index', roomsIndex, 30 * 24 * 60 * 60);

      logger.audit('CHAT_ROOM_CREATED', { roomId, creatorId, roomData });
      return room;
    } catch (error) {
      logger.error('Erro ao criar sala de chat:', error);
      throw error;
    }
  }

  // Obter salas do usuário
  async getUserRooms(userId) {
    try {
      const roomsIndex = await redisService.get('chat_rooms_index') || [];
      const userRooms = [];

      for (const roomId of roomsIndex) {
        const roomKey = `chat_room:${roomId}`;
        const room = await redisService.get(roomKey);

        if (room && (room.members.includes(userId) || room.admins.includes(userId))) {
          // Adicionar informações sobre mensagens não lidas
          const unreadCount = await this.getUnreadMessagesCount(userId, roomId);
          userRooms.push({
            ...room,
            unreadCount,
            lastActivity: await this.getLastRoomActivity(roomId)
          });
        }
      }

      return userRooms.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    } catch (error) {
      logger.error('Erro ao obter salas do usuário:', error);
      return [];
    }
  }

  // Métodos auxiliares
  sanitizeMessage(message) {
    // Remover HTML/scripts maliciosos
    return message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                 .replace(/<[^>]*>/g, '')
                 .trim();
  }

  sanitizeAttachment(attachment) {
    return {
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      url: attachment.url
    };
  }

  async getUserName(userId) {
    try {
      const User = require('../models/userModels');
      const user = await User.findByPk(userId, { attributes: ['nome'] });
      return user?.nome || 'Usuário Desconhecido';
    } catch (error) {
      return 'Usuário Desconhecido';
    }
  }

  async getRoomName(roomId) {
    if (roomId === 'general') return 'Sala Geral';
    if (roomId.startsWith('process_')) return `Processo ${roomId.replace('process_', '')}`;
    if (roomId.startsWith('user_')) return 'Chat Privado';

    try {
      const roomKey = `chat_room:${roomId}`;
      const room = await redisService.get(roomKey);
      return room?.name || 'Sala de Chat';
    } catch (error) {
      return 'Sala de Chat';
    }
  }

  async getUnreadMessagesCount(userId, roomId) {
    // Implementar contagem de mensagens não lidas
    return 0;
  }

  async getLastRoomActivity(roomId) {
    try {
      const roomMessagesKey = `chat_room_messages:${roomId}`;
      const messageIds = await redisService.get(roomMessagesKey) || [];
      
      if (messageIds.length === 0) return new Date().toISOString();

      const lastMessageKey = `chat_message:${messageIds[0]}`;
      const lastMessage = await redisService.get(lastMessageKey);
      
      return lastMessage?.timestamp || new Date().toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }
}

module.exports = new ChatService();