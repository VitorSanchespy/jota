const express = require('express');
const router = express.Router();
const notificationService = require('../services/advancedNotificationService');
const authMiddleware = require('../middleware/authMiddleware');
const permissionsService = require('../services/permissionsService');
const logger = require('../services/loggerService');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Obter notificações não lidas do usuário
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações não lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/unread', async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getUnreadNotifications(userId);
    
    res.json({
      notifications,
      count: notifications.length
    });
  } catch (error) {
    logger.error('Erro ao buscar notificações não lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificação como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const success = await notificationService.markNotificationAsRead(userId, id);
    
    if (success) {
      res.json({ message: 'Notificação marcada como lida' });
    } else {
      res.status(404).json({ error: 'Notificação não encontrada' });
    }
  } catch (error) {
    logger.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marcar todas as notificações como lidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const success = await notificationService.markAllNotificationsAsRead(userId);
    
    if (success) {
      res.json({ message: 'Todas as notificações marcadas como lidas' });
    } else {
      res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
    }
  } catch (error) {
    logger.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificação (apenas Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - templateKey
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário destinatário
 *               templateKey:
 *                 type: string
 *                 description: Chave do template de notificação
 *               variables:
 *                 type: object
 *                 description: Variáveis para o template
 *               emailNotification:
 *                 type: boolean
 *                 description: Se deve enviar por email também
 *     responses:
 *       200:
 *         description: Notificação enviada com sucesso
 *       403:
 *         description: Acesso negado
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/send', 
  permissionsService.authorize('system', 'configure'),
  async (req, res) => {
    try {
      const { userId, templateKey, variables = {}, emailNotification = false } = req.body;
      
      if (!userId || !templateKey) {
        return res.status(400).json({ error: 'userId e templateKey são obrigatórios' });
      }
      
      const success = await notificationService.createNotificationFromTemplate(
        templateKey,
        userId,
        variables,
        emailNotification
      );
      
      if (success) {
        res.json({ message: 'Notificação enviada com sucesso' });
      } else {
        res.status(500).json({ error: 'Erro ao enviar notificação' });
      }
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/templates:
 *   get:
 *     summary: Obter templates de notificação disponíveis
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de templates disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: object
 *                   description: Templates disponíveis
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/templates', 
  permissionsService.authorize('system', 'configure'),
  async (req, res) => {
    try {
      const templates = notificationService.getNotificationTemplates();
      res.json({ templates });
    } catch (error) {
      logger.error('Erro ao buscar templates:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     summary: Obter configurações de notificação do usuário
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações de notificação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emailEnabled:
 *                   type: boolean
 *                 realTimeEnabled:
 *                   type: boolean
 *                 emailTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 realTimeTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await notificationService.getUserNotificationSettings(userId);
    
    res.json(settings || {
      emailEnabled: true,
      realTimeEnabled: true,
      emailTypes: ['APPOINTMENT_REMINDER', 'PROCESS_UPDATE', 'SYSTEM_MAINTENANCE'],
      realTimeTypes: ['NEW_PROCESS', 'PROCESS_UPDATE', 'APPOINTMENT_REMINDER', 'DOCUMENT_UPLOADED']
    });
  } catch (error) {
    logger.error('Erro ao buscar configurações de notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/notifications/settings:
 *   put:
 *     summary: Atualizar configurações de notificação do usuário
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               realTimeEnabled:
 *                 type: boolean
 *               emailTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               realTimeTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Configurações atualizadas
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    
    // Validar configurações
    if (typeof settings.emailEnabled !== 'boolean' || typeof settings.realTimeEnabled !== 'boolean') {
      return res.status(400).json({ error: 'emailEnabled e realTimeEnabled devem ser booleanos' });
    }
    
    // Salvar no Redis (implementar conforme necessário)
    const redisService = require('../services/redisService');
    const cacheKey = `user_notification_settings:${userId}`;
    await redisService.set(cacheKey, settings, 86400); // 24 horas
    
    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar configurações de notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Enviar notificação de teste (apenas Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário destinatário
 *               message:
 *                 type: string
 *                 description: Mensagem de teste
 *     responses:
 *       200:
 *         description: Notificação de teste enviada
 *       403:
 *         description: Acesso negado
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/test',
  permissionsService.authorize('system', 'configure'),
  async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: 'userId e message são obrigatórios' });
      }
      
      const testNotification = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: 'Notificação de Teste',
        message: message,
        icon: 'test',
        priority: 'medium',
        type: 'TEST'
      };
      
      await notificationService.sendRealTimeNotification(userId, testNotification);
      
      res.json({ message: 'Notificação de teste enviada com sucesso' });
    } catch (error) {
      logger.error('Erro ao enviar notificação de teste:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;