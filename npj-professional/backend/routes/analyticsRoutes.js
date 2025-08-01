const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const authMiddleware = require('../middleware/authMiddleware');
const permissionsService = require('../services/permissionsService');
const logger = require('../services/loggerService');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Obter estatísticas do dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Período para análise
 *     responses:
 *       200:
 *         description: Estatísticas do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processes:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     archived:
 *                       type: integer
 *                     suspended:
 *                       type: integer
 *                 appointments:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     upcoming:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *                     cancelled:
 *                       type: integer
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                 performance:
 *                   type: object
 *                   properties:
 *                     responseTime:
 *                       type: number
 *                     errorRate:
 *                       type: number
 *                     cacheHitRate:
 *                       type: number
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/dashboard',
  permissionsService.authorize('analytics', 'view_own'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const filters = {
        period: req.query.period || '30d'
      };
      
      const stats = await analyticsService.getDashboardStats(userId, userRole, filters);
      
      res.json(stats);
    } catch (error) {
      logger.error('Erro ao obter estatísticas do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     summary: Exportar relatório analítico
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, excel]
 *         description: Formato do relatório
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Período para análise
 *     responses:
 *       200:
 *         description: Relatório exportado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/export',
  permissionsService.authorize('analytics', 'export_own'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const format = req.query.format || 'json';
      const filters = {
        period: req.query.period || '30d'
      };
      
      const report = await analyticsService.generateExportableReport(userId, userRole, format, filters);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(report);
      } else {
        res.json(report);
      }
    } catch (error) {
      logger.error('Erro ao exportar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/analytics/kpis:
 *   get:
 *     summary: Obter KPIs personalizados
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Tipos de KPIs separados por vírgula
 *     responses:
 *       200:
 *         description: KPIs calculados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/kpis',
  permissionsService.authorize('analytics', 'view_own'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const types = req.query.types ? req.query.types.split(',') : [
        'process_resolution_time',
        'appointment_attendance_rate',
        'user_activity_score'
      ];
      
      const kpis = await analyticsService.getCustomKPIs(userId, userRole, types);
      
      res.json(kpis);
    } catch (error) {
      logger.error('Erro ao obter KPIs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/analytics/system:
 *   get:
 *     summary: Obter estatísticas do sistema (apenas Admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 systemHealth:
 *                   type: string
 *                   enum: [excellent, good, fair, poor, unknown]
 *                 performance:
 *                   type: object
 *                   properties:
 *                     responseTime:
 *                       type: number
 *                     errorRate:
 *                       type: number
 *                     cacheHitRate:
 *                       type: number
 *                     dbConnections:
 *                       type: integer
 *                 resources:
 *                   type: object
 *                   properties:
 *                     memoryUsage:
 *                       type: number
 *                     cpuUsage:
 *                       type: number
 *                     diskUsage:
 *                       type: number
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/system',
  permissionsService.authorize('system', 'logs'),
  async (req, res) => {
    try {
      const systemStats = {
        systemHealth: 'good',
        performance: {
          responseTime: Math.random() * 500,
          errorRate: Math.random() * 5,
          cacheHitRate: 75 + Math.random() * 20,
          dbConnections: Math.floor(Math.random() * 10) + 5
        },
        resources: {
          memoryUsage: Math.random() * 80,
          cpuUsage: Math.random() * 60,
          diskUsage: Math.random() * 70
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(systemStats);
    } catch (error) {
      logger.error('Erro ao obter estatísticas do sistema:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Obter tendências temporais
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum: [processes, appointments, users, performance]
 *         description: Métrica para análise de tendência
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Período para análise
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Granularidade dos dados
 *     responses:
 *       200:
 *         description: Dados de tendência
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metric:
 *                   type: string
 *                 period:
 *                   type: string
 *                 granularity:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       value:
 *                         type: number
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/trends',
  permissionsService.authorize('analytics', 'view_own'),
  async (req, res) => {
    try {
      const { metric, period = '30d', granularity = 'day' } = req.query;
      
      if (!metric) {
        return res.status(400).json({ error: 'Parâmetro metric é obrigatório' });
      }
      
      const validMetrics = ['processes', 'appointments', 'users', 'performance'];
      if (!validMetrics.includes(metric)) {
        return res.status(400).json({ error: 'Métrica inválida' });
      }
      
      // Gerar dados de tendência mockados (implementar lógica real conforme necessário)
      const trendData = {
        metric,
        period,
        granularity,
        data: Array.from({ length: 30 }, (_, i) => ({
          timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
          value: Math.floor(Math.random() * 100) + 50
        }))
      };
      
      res.json(trendData);
    } catch (error) {
      logger.error('Erro ao obter tendências:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/analytics/compare:
 *   get:
 *     summary: Comparar períodos
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currentPeriod
 *         required: true
 *         schema:
 *           type: string
 *         description: Período atual (formato YYYY-MM-DD to YYYY-MM-DD)
 *       - in: query
 *         name: previousPeriod
 *         required: true
 *         schema:
 *           type: string
 *         description: Período anterior (formato YYYY-MM-DD to YYYY-MM-DD)
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *         description: Métricas a comparar separadas por vírgula
 *     responses:
 *       200:
 *         description: Comparação entre períodos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current:
 *                   type: object
 *                   description: Dados do período atual
 *                 previous:
 *                   type: object
 *                   description: Dados do período anterior
 *                 comparison:
 *                   type: object
 *                   description: Comparação percentual
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/compare',
  permissionsService.authorize('analytics', 'view_own'),
  async (req, res) => {
    try {
      const { currentPeriod, previousPeriod, metrics = 'processes,appointments' } = req.query;
      
      if (!currentPeriod || !previousPeriod) {
        return res.status(400).json({ error: 'currentPeriod e previousPeriod são obrigatórios' });
      }
      
      const metricsArray = metrics.split(',');
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Implementar lógica de comparação real
      const comparison = {
        current: {
          period: currentPeriod,
          processes: { total: 150, active: 120 },
          appointments: { total: 89, completed: 75 }
        },
        previous: {
          period: previousPeriod,
          processes: { total: 120, active: 95 },
          appointments: { total: 65, completed: 58 }
        },
        comparison: {
          processes: {
            total: { change: 25, percentage: 20.8 },
            active: { change: 25, percentage: 26.3 }
          },
          appointments: {
            total: { change: 24, percentage: 36.9 },
            completed: { change: 17, percentage: 29.3 }
          }
        }
      };
      
      res.json(comparison);
    } catch (error) {
      logger.error('Erro ao comparar períodos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @swagger
 * /api/analytics/cache/clear:
 *   delete:
 *     summary: Limpar cache de analytics (apenas Admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/cache/clear',
  permissionsService.authorize('system', 'configure'),
  async (req, res) => {
    try {
      const redisService = require('../services/redisService');
      
      // Limpar cache específico de analytics
      const pattern = 'dashboard_stats:*';
      const keys = await redisService.redis.keys(pattern);
      
      if (keys.length > 0) {
        await redisService.redis.del(...keys);
      }
      
      logger.audit('ANALYTICS_CACHE_CLEARED', { 
        userId: req.user.id,
        keysCleared: keys.length 
      });
      
      res.json({ 
        message: 'Cache de analytics limpo com sucesso',
        keysCleared: keys.length 
      });
    } catch (error) {
      logger.error('Erro ao limpar cache de analytics:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;