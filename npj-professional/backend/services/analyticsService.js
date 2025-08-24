const redisService = require('./redisService');
const logger = require('./loggerService');
const { Op } = require('sequelize');
const cron = require('node-cron');

class AnalyticsService {
  constructor() {
    this.metricsCache = new Map();
    this.initializeScheduledTasks();
  }

  // Inicializar tarefas agendadas para cache de métricas
  initializeScheduledTasks() {
    // Atualizar métricas a cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      this.updateCachedMetrics();
    });

    // Limpeza de cache a cada hora
    cron.schedule('0 * * * *', () => {
      this.cleanupCache();
    });
  }

  // Obter estatísticas do dashboard para um usuário
  async getDashboardStats(userId, userRole, filters = {}) {
    try {
      const cacheKey = `dashboard_stats:${userId}:${JSON.stringify(filters)}`;
      let stats = await redisService.get(cacheKey);

      if (!stats) {
        stats = await this.calculateDashboardStats(userId, userRole, filters);
        await redisService.set(cacheKey, stats, 600); // 10 minutos
      }

      return stats;
    } catch (error) {
      logger.error('Erro ao obter estatísticas do dashboard:', error);
      return this.getDefaultStats();
    }
  }

  // Calcular estatísticas do dashboard
  async calculateDashboardStats(userId, userRole, filters = {}) {
    const { startDate, endDate } = this.getDateRange(filters.period || '30d');
    
    const [
      processStats,
      appointmentStats,
      userStats,
      performanceStats
    ] = await Promise.all([
      this.getProcessStats(userId, userRole, startDate, endDate),
      this.getAppointmentStats(userId, userRole, startDate, endDate),
      this.getUserStats(userRole, startDate, endDate),
      this.getPerformanceStats(userId, userRole, startDate, endDate)
    ]);

    return {
      processes: processStats,
      appointments: appointmentStats,
      users: userStats,
      performance: performanceStats,
      period: filters.period || '30d',
      lastUpdated: new Date().toISOString()
    };
  }

  // Estatísticas de processos
  async getProcessStats(userId, userRole, startDate, endDate) {
    try {
      const Processo = require('../models/processoModels');
      const { sequelize } = require('../models/indexModels');

      let whereCondition = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };

      // Filtrar por usuário se não for Admin
      if (userRole !== 'Admin') {
        whereCondition.created_by = userId;
      }

      const [totalProcesses, activeProcesses, statusDistribution, monthlyTrend] = await Promise.all([
        Processo.count({ where: whereCondition }),
        Processo.count({ 
          where: { ...whereCondition, status: 'Ativo' }
        }),
        this.getProcessStatusDistribution(whereCondition),
        this.getProcessMonthlyTrend(whereCondition)
      ]);

      return {
        total: totalProcesses,
        active: activeProcesses,
        archived: await Processo.count({ 
          where: { ...whereCondition, status: 'Arquivado' }
        }),
        suspended: await Processo.count({ 
          where: { ...whereCondition, status: 'Suspenso' }
        }),
        statusDistribution,
        monthlyTrend,
        averagePerMonth: monthlyTrend.reduce((acc, curr) => acc + curr.count, 0) / monthlyTrend.length || 0
      };
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de processos:', error);
      return { total: 0, active: 0, archived: 0, suspended: 0, statusDistribution: [], monthlyTrend: [] };
    }
  }

  // Estatísticas de agendamentos
  async getAppointmentStats(userId, userRole, startDate, endDate) {
    try {
      const Agendamento = require('../models/agendamentoModels');

      let whereCondition = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (userRole !== 'Admin') {
        whereCondition.usuario_id = userId;
      }

      const [totalAppointments, upcomingAppointments, completedAppointments, cancelledAppointments] = await Promise.all([
        Agendamento.count({ where: whereCondition }),
        Agendamento.count({ 
          where: { 
            ...whereCondition,
            data_hora: { [Op.gte]: new Date() },
            status: { [Op.ne]: 'Cancelado' }
          }
        }),
        Agendamento.count({ 
          where: { 
            ...whereCondition,
            status: 'Concluído'
          }
        }),
        Agendamento.count({ 
          where: { 
            ...whereCondition,
            status: 'Cancelado'
          }
        })
      ]);

      const weeklyDistribution = await this.getAppointmentWeeklyDistribution(whereCondition);

      return {
        total: totalAppointments,
        upcoming: upcomingAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        weeklyDistribution,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(1) : 0
      };
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de agendamentos:', error);
      return { total: 0, upcoming: 0, completed: 0, cancelled: 0, weeklyDistribution: [], completionRate: 0 };
    }
  }

  // Estatísticas de usuários (apenas para Admin)
  async getUserStats(userRole, startDate, endDate) {
    if (userRole !== 'Admin') {
      return { total: 0, active: 0, byRole: [], recentRegistrations: [] };
    }

    try {
      const User = require('../models/userModels');

      const [totalUsers, activeUsers, usersByRole, recentRegistrations] = await Promise.all([
        User.count(),
        User.count({ where: { ativo: true } }),
        this.getUsersByRole(),
        this.getRecentRegistrations(startDate, endDate)
      ]);

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole,
        recentRegistrations,
        growth: this.calculateUserGrowth(recentRegistrations)
      };
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de usuários:', error);
      return { total: 0, active: 0, byRole: [], recentRegistrations: [] };
    }
  }

  // Estatísticas de performance do sistema
  async getPerformanceStats(userId, userRole, startDate, endDate) {
    try {
      const [responseTime, errorRate, cacheHitRate, dbConnections] = await Promise.all([
        this.getAverageResponseTime(startDate, endDate),
        this.getErrorRate(startDate, endDate),
        this.getCacheHitRate(startDate, endDate),
        this.getDatabaseConnectionsCount()
      ]);

      return {
        responseTime,
        errorRate,
        cacheHitRate,
        dbConnections,
        systemHealth: this.calculateSystemHealth(responseTime, errorRate, cacheHitRate)
      };
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de performance:', error);
      return { responseTime: 0, errorRate: 0, cacheHitRate: 0, dbConnections: 0, systemHealth: 'unknown' };
    }
  }

  // Gerar relatório exportável
  async generateExportableReport(userId, userRole, format = 'json', filters = {}) {
    try {
      const stats = await this.getDashboardStats(userId, userRole, filters);
      
      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          userRole,
          period: filters.period || '30d',
          format
        },
        summary: {
          totalProcesses: stats.processes.total,
          activeProcesses: stats.processes.active,
          totalAppointments: stats.appointments.total,
          upcomingAppointments: stats.appointments.upcoming
        },
        details: stats
      };

      if (format === 'csv') {
        return this.convertToCSV(report);
      } else if (format === 'excel') {
        return this.convertToExcel(report);
      }

      return report;
    } catch (error) {
      logger.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  // Obter KPIs personalizados
  async getCustomKPIs(userId, userRole, kpiTypes = []) {
    try {
      const kpis = {};

      for (const kpiType of kpiTypes) {
        switch (kpiType) {
          case 'process_resolution_time':
            kpis[kpiType] = await this.getAverageProcessResolutionTime(userId, userRole);
            break;
          case 'appointment_attendance_rate':
            kpis[kpiType] = await this.getAppointmentAttendanceRate(userId, userRole);
            break;
          case 'user_activity_score':
            kpis[kpiType] = await this.getUserActivityScore(userId, userRole);
            break;
          case 'system_utilization':
            kpis[kpiType] = await this.getSystemUtilization();
            break;
          default:
            logger.warn(`KPI type not recognized: ${kpiType}`);
        }
      }

      return kpis;
    } catch (error) {
      logger.error('Erro ao obter KPIs personalizados:', error);
      return {};
    }
  }

  // Métodos auxiliares

  getDateRange(period) {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  async getProcessStatusDistribution(whereCondition) {
    try {
      const Processo = require('../models/processoModels');
      const { sequelize } = require('../models/indexModels');

      const distribution = await Processo.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: whereCondition,
        group: ['status'],
        raw: true
      });

      return distribution.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        percentage: 0 // Será calculado no frontend
      }));
    } catch (error) {
      logger.error('Erro ao obter distribuição de status:', error);
      return [];
    }
  }

  async getProcessMonthlyTrend(whereCondition) {
    try {
      const Processo = require('../models/processoModels');
      const { sequelize } = require('../models/indexModels');

      const trend = await Processo.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: whereCondition,
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
        raw: true
      });

      return trend.map(item => ({
        month: item.month,
        count: parseInt(item.count)
      }));
    } catch (error) {
      logger.error('Erro ao obter tendência mensal:', error);
      return [];
    }
  }

  getDefaultStats() {
    return {
      processes: { total: 0, active: 0, archived: 0, suspended: 0, statusDistribution: [], monthlyTrend: [] },
      appointments: { total: 0, upcoming: 0, completed: 0, cancelled: 0, weeklyDistribution: [], completionRate: 0 },
      users: { total: 0, active: 0, byRole: [], recentRegistrations: [] },
      performance: { responseTime: 0, errorRate: 0, cacheHitRate: 0, dbConnections: 0, systemHealth: 'unknown' }
    };
  }

  async updateCachedMetrics() {
    try {
      logger.info('Atualizando métricas em cache...');
      // Implementar atualização de métricas comuns
      await redisService.del('dashboard_stats:*');
      logger.info('Métricas em cache atualizadas');
    } catch (error) {
      logger.error('Erro ao atualizar métricas em cache:', error);
    }
  }

  cleanupCache() {
    this.metricsCache.clear();
    logger.info('Cache de métricas limpo');
  }

  // Calcular saúde do sistema
  calculateSystemHealth(responseTime, errorRate, cacheHitRate) {
    if (responseTime < 200 && errorRate < 1 && cacheHitRate > 80) {
      return 'excellent';
    } else if (responseTime < 500 && errorRate < 5 && cacheHitRate > 60) {
      return 'good';
    } else if (responseTime < 1000 && errorRate < 10 && cacheHitRate > 40) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  // Métodos placeholders para implementação futura
  async getAverageResponseTime(startDate, endDate) { return Math.random() * 500; }
  async getErrorRate(startDate, endDate) { return Math.random() * 5; }
  async getCacheHitRate(startDate, endDate) { return 75 + Math.random() * 20; }
  async getDatabaseConnectionsCount() { return Math.floor(Math.random() * 10) + 5; }
  async getUsersByRole() { return []; }
  async getRecentRegistrations(startDate, endDate) { return []; }
  async getAppointmentWeeklyDistribution(whereCondition) { return []; }
  calculateUserGrowth(registrations) { return 0; }
  async getAverageProcessResolutionTime(userId, userRole) { return 0; }
  async getAppointmentAttendanceRate(userId, userRole) { return 0; }
  async getUserActivityScore(userId, userRole) { return 0; }
  async getSystemUtilization() { return 0; }
  convertToCSV(report) { return ''; }
  convertToExcel(report) { return null; }
}

module.exports = new AnalyticsService();