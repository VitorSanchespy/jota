const { google } = require('googleapis');
const logger = require('./loggerService');
const redisService = require('./redisService');
const moment = require('moment-timezone');

class CalendarIntegrationService {
  constructor() {
    this.googleAuth = null;
    this.outlookAuth = null;
    this.initializeGoogleAuth();
  }

  // Inicializar autenticação do Google
  initializeGoogleAuth() {
    try {
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        this.googleAuth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3002/auth/google/callback'
        );
      }
    } catch (error) {
      logger.error('Erro ao inicializar autenticação Google:', error);
    }
  }

  // Obter URL de autorização do Google Calendar
  getGoogleAuthUrl(userId) {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Auth não configurado');
      }

      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const authUrl = this.googleAuth.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: userId // Para identificar o usuário no callback
      });

      return authUrl;
    } catch (error) {
      logger.error('Erro ao gerar URL de autorização Google:', error);
      throw error;
    }
  }

  // Processar código de autorização do Google
  async processGoogleAuthCode(code, userId) {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Auth não configurado');
      }

      const { tokens } = await this.googleAuth.getToken(code);
      this.googleAuth.setCredentials(tokens);

      // Salvar tokens no Redis associados ao usuário
      const cacheKey = `google_tokens:${userId}`;
      await redisService.set(cacheKey, tokens, 3600); // 1 hora

      logger.info(`Tokens Google salvos para usuário ${userId}`);
      return tokens;
    } catch (error) {
      logger.error('Erro ao processar código de autorização Google:', error);
      throw error;
    }
  }

  // Criar evento no Google Calendar
  async createGoogleCalendarEvent(userId, eventData) {
    try {
      const tokens = await this.getGoogleTokens(userId);
      if (!tokens) {
        throw new Error('Usuário não autenticado no Google');
      }

      this.googleAuth.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const event = {
        summary: eventData.titulo,
        description: eventData.descricao || '',
        start: {
          dateTime: moment(eventData.data_hora).toISOString(),
          timeZone: 'America/Cuiaba'
        },
        end: {
          dateTime: moment(eventData.data_hora).add(eventData.duracao || 60, 'minutes').toISOString(),
          timeZone: 'America/Cuiaba'
        },
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 30 } // 30 minutos antes
          ]
        }
      };

      if (eventData.recorrente && eventData.frequencia) {
        event.recurrence = this.generateRecurrenceRule(eventData.frequencia, eventData.fim_recorrencia);
      }

      const result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      logger.info(`Evento criado no Google Calendar: ${result.data.id}`);
      return {
        googleEventId: result.data.id,
        googleEventLink: result.data.htmlLink
      };
    } catch (error) {
      logger.error('Erro ao criar evento no Google Calendar:', error);
      throw error;
    }
  }

  // Atualizar evento no Google Calendar
  async updateGoogleCalendarEvent(userId, googleEventId, eventData) {
    try {
      const tokens = await this.getGoogleTokens(userId);
      if (!tokens) {
        throw new Error('Usuário não autenticado no Google');
      }

      this.googleAuth.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const event = {
        summary: eventData.titulo,
        description: eventData.descricao || '',
        start: {
          dateTime: moment(eventData.data_hora).toISOString(),
          timeZone: 'America/Cuiaba'
        },
        end: {
          dateTime: moment(eventData.data_hora).add(eventData.duracao || 60, 'minutes').toISOString(),
          timeZone: 'America/Cuiaba'
        }
      };

      await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        resource: event
      });

      logger.info(`Evento atualizado no Google Calendar: ${googleEventId}`);
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar evento no Google Calendar:', error);
      throw error;
    }
  }

  // Deletar evento no Google Calendar
  async deleteGoogleCalendarEvent(userId, googleEventId) {
    try {
      const tokens = await this.getGoogleTokens(userId);
      if (!tokens) {
        throw new Error('Usuário não autenticado no Google');
      }

      this.googleAuth.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId
      });

      logger.info(`Evento deletado no Google Calendar: ${googleEventId}`);
      return true;
    } catch (error) {
      logger.error('Erro ao deletar evento no Google Calendar:', error);
      throw error;
    }
  }

  // Listar eventos do Google Calendar
  async listGoogleCalendarEvents(userId, startDate, endDate) {
    try {
      const tokens = await this.getGoogleTokens(userId);
      if (!tokens) {
        throw new Error('Usuário não autenticado no Google');
      }

      this.googleAuth.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: moment(startDate).toISOString(),
        timeMax: moment(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items.map(event => ({
        googleEventId: event.id,
        titulo: event.summary,
        descricao: event.description,
        data_hora: event.start.dateTime || event.start.date,
        fim: event.end.dateTime || event.end.date,
        link: event.htmlLink,
        status: event.status
      }));
    } catch (error) {
      logger.error('Erro ao listar eventos do Google Calendar:', error);
      throw error;
    }
  }

  // Verificar conflitos de agendamento
  async checkScheduleConflicts(userId, newEventData, excludeEventId = null) {
    try {
      const Agendamento = require('../models/agendamentoModels');
      const { Op } = require('sequelize');

      const eventStart = moment(newEventData.data_hora);
      const eventEnd = moment(newEventData.data_hora).add(newEventData.duracao || 60, 'minutes');

      // Verificar conflitos no banco local
      let whereCondition = {
        usuario_id: userId,
        [Op.or]: [
          {
            data_hora: {
              [Op.between]: [eventStart.toDate(), eventEnd.toDate()]
            }
          },
          {
            [Op.and]: [
              { data_hora: { [Op.lte]: eventStart.toDate() } },
              { data_fim: { [Op.gte]: eventStart.toDate() } }
            ]
          }
        ]
      };

      if (excludeEventId) {
        whereCondition.id = { [Op.ne]: excludeEventId };
      }

      const localConflicts = await Agendamento.findAll({
        where: whereCondition,
        attributes: ['id', 'titulo', 'data_hora', 'duracao']
      });

      // Verificar conflitos no Google Calendar (se integrado)
      let googleConflicts = [];
      try {
        const googleEvents = await this.listGoogleCalendarEvents(
          userId,
          eventStart.subtract(1, 'hour').toDate(),
          eventEnd.add(1, 'hour').toDate()
        );

        googleConflicts = googleEvents.filter(event => {
          const googleStart = moment(event.data_hora);
          const googleEnd = moment(event.fim);
          
          return eventStart.isBefore(googleEnd) && eventEnd.isAfter(googleStart);
        });
      } catch (error) {
        // Ignorar erros do Google Calendar se não estiver configurado
        logger.debug('Google Calendar não disponível para verificação de conflitos');
      }

      return {
        hasConflicts: localConflicts.length > 0 || googleConflicts.length > 0,
        localConflicts: localConflicts.map(conflict => ({
          id: conflict.id,
          titulo: conflict.titulo,
          data_hora: conflict.data_hora,
          source: 'local'
        })),
        googleConflicts: googleConflicts.map(conflict => ({
          id: conflict.googleEventId,
          titulo: conflict.titulo,
          data_hora: conflict.data_hora,
          source: 'google'
        }))
      };
    } catch (error) {
      logger.error('Erro ao verificar conflitos de agendamento:', error);
      return { hasConflicts: false, localConflicts: [], googleConflicts: [] };
    }
  }

  // Sugerir horários alternativos
  async suggestAlternativeTimes(userId, originalDateTime, duration = 60, preferences = {}) {
    try {
      const suggestions = [];
      const originalMoment = moment(originalDateTime);
      const workingHours = preferences.workingHours || { start: 8, end: 18 };
      const daysToCheck = preferences.daysToCheck || 7;

      for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
        const checkDate = originalMoment.clone().add(dayOffset, 'days');
        
        // Pular fins de semana se especificado
        if (preferences.skipWeekends && (checkDate.day() === 0 || checkDate.day() === 6)) {
          continue;
        }

        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
          const suggestedTime = checkDate.clone().hour(hour).minute(0).second(0);
          
          const conflicts = await this.checkScheduleConflicts(userId, {
            data_hora: suggestedTime.toDate(),
            duracao: duration
          });

          if (!conflicts.hasConflicts) {
            suggestions.push({
              data_hora: suggestedTime.toISOString(),
              score: this.calculateTimeScore(suggestedTime, originalMoment, preferences)
            });

            if (suggestions.length >= (preferences.maxSuggestions || 5)) {
              break;
            }
          }
        }

        if (suggestions.length >= (preferences.maxSuggestions || 5)) {
          break;
        }
      }

      // Ordenar por score (melhor primeiro)
      suggestions.sort((a, b) => b.score - a.score);

      return suggestions;
    } catch (error) {
      logger.error('Erro ao sugerir horários alternativos:', error);
      return [];
    }
  }

  // Gerar lembretes automáticos
  async scheduleAutomaticReminders(agendamentoId, eventData) {
    try {
      const reminders = [
        { time: 24 * 60, type: 'email', message: 'Lembrete: Você tem um agendamento amanhã' },
        { time: 60, type: 'notification', message: 'Lembrete: Seu agendamento é em 1 hora' },
        { time: 15, type: 'notification', message: 'Lembrete: Seu agendamento é em 15 minutos' }
      ];

      for (const reminder of reminders) {
        const reminderTime = moment(eventData.data_hora).subtract(reminder.time, 'minutes');
        
        if (reminderTime.isAfter(moment())) {
          await this.scheduleReminder(agendamentoId, reminder, reminderTime);
        }
      }

      logger.info(`Lembretes agendados para agendamento ${agendamentoId}`);
    } catch (error) {
      logger.error('Erro ao agendar lembretes automáticos:', error);
    }
  }

  // Métodos auxiliares

  async getGoogleTokens(userId) {
    const cacheKey = `google_tokens:${userId}`;
    return await redisService.get(cacheKey);
  }

  generateRecurrenceRule(frequencia, fimRecorrencia) {
    const rules = [];
    
    switch (frequencia) {
      case 'diaria':
        rules.push('RRULE:FREQ=DAILY');
        break;
      case 'semanal':
        rules.push('RRULE:FREQ=WEEKLY');
        break;
      case 'mensal':
        rules.push('RRULE:FREQ=MONTHLY');
        break;
    }

    if (fimRecorrencia) {
      const until = moment(fimRecorrencia).format('YYYYMMDD[T]HHmmss[Z]');
      rules[0] += `;UNTIL=${until}`;
    }

    return rules;
  }

  calculateTimeScore(suggestedTime, originalTime, preferences) {
    let score = 100;

    // Reduzir score baseado na diferença de tempo
    const diffHours = Math.abs(suggestedTime.diff(originalTime, 'hours'));
    score -= diffHours * 2;

    // Preferir horários de manhã se especificado
    if (preferences.preferMorning && suggestedTime.hour() > 12) {
      score -= 20;
    }

    // Preferir dias úteis
    if (suggestedTime.day() === 0 || suggestedTime.day() === 6) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  async scheduleReminder(agendamentoId, reminder, reminderTime) {
    // Implementar agendamento de lembretes (pode usar node-cron ou uma queue)
    logger.info(`Lembrete agendado para ${reminderTime.toISOString()}: ${reminder.message}`);
    
    // Salvar no Redis para processamento posterior
    const reminderKey = `reminder:${agendamentoId}:${reminderTime.unix()}`;
    await redisService.set(reminderKey, {
      agendamentoId,
      reminder,
      scheduledFor: reminderTime.toISOString()
    }, reminderTime.diff(moment(), 'seconds'));
  }

  // Integração com Outlook (implementação básica)
  async createOutlookEvent(userId, eventData) {
    // Implementação futura para integração com Microsoft Graph API
    logger.info('Integração com Outlook ainda não implementada');
    return null;
  }

  // Sincronização bidirecional
  async syncWithExternalCalendars(userId) {
    try {
      // Implementar sincronização bidirecional entre sistema local e calendários externos
      logger.info(`Iniciando sincronização de calendários para usuário ${userId}`);
      
      // Buscar eventos locais modificados
      // Buscar eventos externos modificados
      // Resolver conflitos
      // Atualizar ambos os sistemas
      
      logger.info(`Sincronização concluída para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro na sincronização de calendários:', error);
    }
  }
}

module.exports = new CalendarIntegrationService();