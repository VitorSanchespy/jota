const nodemailer = require('nodemailer');
const redisService = require('./redisService');
const logger = require('./loggerService');
const { Op } = require('sequelize');

class NotificationService {
  constructor() {
    this.emailTransporter = this.createEmailTransporter();
    this.socketIo = null; // Será definido quando o Socket.IO for inicializado
  }

  // Configurar o transporter de email
  createEmailTransporter() {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Definir instância do Socket.IO
  setSocketIo(io) {
    this.socketIo = io;
  }

  // Enviar notificação em tempo real via WebSocket
  async sendRealTimeNotification(userId, notification) {
    try {
      if (this.socketIo) {
        this.socketIo.to(`user_${userId}`).emit('notification', notification);
        logger.info(`Notificação em tempo real enviada para usuário ${userId}`);
      }

      // Salvar no cache Redis para recuperação posterior
      const cacheKey = `notifications:${userId}`;
      const cachedNotifications = await redisService.get(cacheKey) || [];
      cachedNotifications.unshift({
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Manter apenas as últimas 50 notificações
      if (cachedNotifications.length > 50) {
        cachedNotifications.splice(50);
      }

      await redisService.set(cacheKey, cachedNotifications, 86400); // 24 horas

      return true;
    } catch (error) {
      logger.error('Erro ao enviar notificação em tempo real:', error);
      return false;
    }
  }

  // Enviar notificação por email
  async sendEmailNotification(userEmail, subject, htmlContent, textContent = null) {
    try {
      if (!process.env.SMTP_USER) {
        logger.warn('Configuração SMTP não encontrada, email não enviado');
        return false;
      }

      const mailOptions = {
        from: `"NPJ UFMT" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email enviado com sucesso para ${userEmail}`, { messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Erro ao enviar email:', error);
      return false;
    }
  }

  // Obter notificações não lidas de um usuário
  async getUnreadNotifications(userId) {
    try {
      const cacheKey = `notifications:${userId}`;
      const notifications = await redisService.get(cacheKey) || [];
      return notifications.filter(n => !n.read);
    } catch (error) {
      logger.error('Erro ao buscar notificações não lidas:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  async markNotificationAsRead(userId, notificationId) {
    try {
      const cacheKey = `notifications:${userId}`;
      const notifications = await redisService.get(cacheKey) || [];
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        await redisService.set(cacheKey, notifications, 86400);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  // Marcar todas as notificações como lidas
  async markAllNotificationsAsRead(userId) {
    try {
      const cacheKey = `notifications:${userId}`;
      const notifications = await redisService.get(cacheKey) || [];
      
      notifications.forEach(n => n.read = true);
      await redisService.set(cacheKey, notifications, 86400);
      
      return true;
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }

  // Templates de notificação
  getNotificationTemplates() {
    return {
      NEW_PROCESS: {
        title: 'Novo Processo Criado',
        message: 'Um novo processo foi criado: {processNumber}',
        icon: 'process',
        priority: 'medium'
      },
      PROCESS_UPDATE: {
        title: 'Processo Atualizado',
        message: 'O processo {processNumber} foi atualizado',
        icon: 'update',
        priority: 'medium'
      },
      APPOINTMENT_REMINDER: {
        title: 'Lembrete de Agendamento',
        message: 'Você tem um agendamento em {time}',
        icon: 'calendar',
        priority: 'high'
      },
      APPOINTMENT_CREATED: {
        title: 'Agendamento Criado',
        message: 'Novo agendamento criado para {date}',
        icon: 'calendar',
        priority: 'medium'
      },
      DOCUMENT_UPLOADED: {
        title: 'Documento Enviado',
        message: 'Novo documento adicionado ao processo {processNumber}',
        icon: 'document',
        priority: 'low'
      },
      SYSTEM_MAINTENANCE: {
        title: 'Manutenção do Sistema',
        message: 'O sistema entrará em manutenção em {time}',
        icon: 'maintenance',
        priority: 'high'
      },
      USER_CREATED: {
        title: 'Novo Usuário',
        message: 'Um novo usuário foi criado: {userName}',
        icon: 'user',
        priority: 'low'
      }
    };
  }

  // Criar notificação usando template
  async createNotificationFromTemplate(templateKey, userId, variables = {}, emailNotification = false) {
    const templates = this.getNotificationTemplates();
    const template = templates[templateKey];
    
    if (!template) {
      logger.error(`Template de notificação não encontrado: ${templateKey}`);
      return false;
    }

    // Substituir variáveis no template
    let message = template.message;
    Object.keys(variables).forEach(key => {
      message = message.replace(`{${key}}`, variables[key]);
    });

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      message: message,
      icon: template.icon,
      priority: template.priority,
      type: templateKey,
      variables: variables
    };

    // Enviar notificação em tempo real
    await this.sendRealTimeNotification(userId, notification);

    // Enviar por email se solicitado e configurações permitirem
    if (emailNotification) {
      // Buscar configurações de notificação do usuário
      const userSettings = await this.getUserNotificationSettings(userId);
      if (userSettings?.emailEnabled && userSettings?.emailTypes?.includes(templateKey)) {
        const userEmail = await this.getUserEmail(userId);
        if (userEmail) {
          const emailHtml = this.generateEmailHtml(notification);
          await this.sendEmailNotification(userEmail, notification.title, emailHtml);
        }
      }
    }

    logger.audit('NOTIFICATION_SENT', { userId, templateKey, notification });
    return true;
  }

  // Buscar configurações de notificação do usuário
  async getUserNotificationSettings(userId) {
    try {
      const cacheKey = `user_notification_settings:${userId}`;
      let settings = await redisService.get(cacheKey);
      
      if (!settings) {
        // Buscar do banco de dados (implementar conforme necessário)
        settings = {
          emailEnabled: true,
          realTimeEnabled: true,
          emailTypes: ['APPOINTMENT_REMINDER', 'PROCESS_UPDATE', 'SYSTEM_MAINTENANCE'],
          realTimeTypes: ['NEW_PROCESS', 'PROCESS_UPDATE', 'APPOINTMENT_REMINDER', 'DOCUMENT_UPLOADED']
        };
        await redisService.set(cacheKey, settings, 3600); // 1 hora
      }
      
      return settings;
    } catch (error) {
      logger.error('Erro ao buscar configurações de notificação:', error);
      return null;
    }
  }

  // Buscar email do usuário
  async getUserEmail(userId) {
    try {
      const cachedUser = await redisService.getCachedUser(userId);
      if (cachedUser?.email) {
        return cachedUser.email;
      }
      
      // Buscar do banco se não estiver em cache
      const User = require('../models/userModels');
      const user = await User.findByPk(userId, { attributes: ['email'] });
      return user?.email || null;
    } catch (error) {
      logger.error('Erro ao buscar email do usuário:', error);
      return null;
    }
  }

  // Gerar HTML para email
  generateEmailHtml(notification) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
              .priority-high { border-left: 4px solid #dc3545; }
              .priority-medium { border-left: 4px solid #ffc107; }
              .priority-low { border-left: 4px solid #28a745; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🏛️ NPJ UFMT</h1>
              </div>
              <div class="content priority-${notification.priority}">
                  <h2>${notification.title}</h2>
                  <p>${notification.message}</p>
                  <p><small>Enviado em: ${new Date().toLocaleString('pt-BR')}</small></p>
              </div>
              <div class="footer">
                  <p>Este é um email automático do Sistema NPJ UFMT. Não responda este email.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // Limpeza de notificações antigas
  async cleanupOldNotifications() {
    try {
      // Implementar limpeza de notificações antigas do Redis
      logger.info('Limpeza de notificações antigas iniciada');
      
      const pattern = 'notifications:*';
      const keys = await redisService.redis.keys(pattern);
      
      for (const key of keys) {
        const notifications = await redisService.get(key) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 dias atrás
        
        const filteredNotifications = notifications.filter(n => 
          new Date(n.timestamp) > cutoffDate
        );
        
        if (filteredNotifications.length !== notifications.length) {
          await redisService.set(key, filteredNotifications, 86400);
        }
      }
      
      logger.info('Limpeza de notificações antigas concluída');
    } catch (error) {
      logger.error('Erro na limpeza de notificações antigas:', error);
    }
  }
}

module.exports = new NotificationService();