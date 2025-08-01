const express = require('express');
const router = express.Router();
const agendamentoControllers = require('../controllers/agendamentoControllers');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Middleware de autenticação obrigatório para todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Agendamento:
 *       type: object
 *       required:
 *         - titulo
 *         - data_evento
 *         - tipo_evento
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do agendamento
 *         titulo:
 *           type: string
 *           description: Título do evento
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do evento
 *         data_evento:
 *           type: string
 *           format: date-time
 *           description: Data e hora do evento
 *         tipo_evento:
 *           type: string
 *           enum: [audiencia, prazo, reuniao, diligencia, outro]
 *           description: Tipo do evento
 *         processo_id:
 *           type: integer
 *           description: ID do processo relacionado
 *         local:
 *           type: string
 *           description: Local do evento
 *         lembrete_1_dia:
 *           type: boolean
 *           description: Enviar lembrete 1 dia antes
 *         lembrete_2_dias:
 *           type: boolean
 *           description: Enviar lembrete 2 dias antes
 *         lembrete_1_semana:
 *           type: boolean
 *           description: Enviar lembrete 1 semana antes
 *         status:
 *           type: string
 *           enum: [agendado, realizado, cancelado, adiado]
 *           description: Status do agendamento
 */

/**
 * @swagger
 * /api/agendamentos:
 *   get:
 *     summary: Listar agendamentos do usuário
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo_evento
 *         schema:
 *           type: string
 *           enum: [audiencia, prazo, reuniao, diligencia, outro]
 *         description: Filtrar por tipo de evento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [agendado, realizado, cancelado, adiado]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro (YYYY-MM-DD)
 *       - in: query
 *         name: processo_id
 *         schema:
 *           type: integer
 *         description: Filtrar por processo específico
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agendamento'
 */
router.get('/', agendamentoControllers.listarAgendamentos);

/**
 * @swagger
 * /api/agendamentos/{id}:
 *   get:
 *     summary: Buscar agendamento por ID
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Dados do agendamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 *       404:
 *         description: Agendamento não encontrado
 */
router.get('/:id', agendamentoControllers.buscarAgendamentoPorId);

/**
 * @swagger
 * /api/agendamentos:
 *   post:
 *     summary: Criar novo agendamento
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - data_evento
 *               - tipo_evento
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Audiência de Conciliação"
 *               descricao:
 *                 type: string
 *                 example: "Audiência de conciliação no processo trabalhista"
 *               data_evento:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-20T14:30:00"
 *               tipo_evento:
 *                 type: string
 *                 enum: [audiencia, prazo, reuniao, diligencia, outro]
 *                 example: "audiencia"
 *               processo_id:
 *                 type: integer
 *                 example: 123
 *               local:
 *                 type: string
 *                 example: "Fórum Trabalhista - Sala 5"
 *               lembrete_1_dia:
 *                 type: boolean
 *                 example: true
 *               lembrete_2_dias:
 *                 type: boolean
 *                 example: true
 *               lembrete_1_semana:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 */
router.post('/', agendamentoControllers.criarAgendamento);

/**
 * @swagger
 * /api/agendamentos/{id}:
 *   put:
 *     summary: Atualizar agendamento
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do agendamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               data_evento:
 *                 type: string
 *                 format: date-time
 *               tipo_evento:
 *                 type: string
 *                 enum: [audiencia, prazo, reuniao, diligencia, outro]
 *               local:
 *                 type: string
 *               lembrete_1_dia:
 *                 type: boolean
 *               lembrete_2_dias:
 *                 type: boolean
 *               lembrete_1_semana:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [agendado, realizado, cancelado, adiado]
 *     responses:
 *       200:
 *         description: Agendamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 *       404:
 *         description: Agendamento não encontrado
 */
router.put('/:id', agendamentoControllers.atualizarAgendamento);

/**
 * @swagger
 * /api/agendamentos/{id}:
 *   delete:
 *     summary: Excluir agendamento
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento excluído com sucesso
 *       404:
 *         description: Agendamento não encontrado
 */
router.delete('/:id', agendamentoControllers.excluirAgendamento);

/**
 * @swagger
 * /api/agendamentos/calendario/{ano}/{mes}:
 *   get:
 *     summary: Buscar agendamentos para calendário
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano (YYYY)
 *       - in: path
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês (1-12)
 *     responses:
 *       200:
 *         description: Agendamentos do mês para calendário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agendamento'
 */
router.get('/calendario/:ano/:mes', agendamentoControllers.buscarPorCalendario);

/**
 * @swagger
 * /api/agendamentos/admin/todos:
 *   get:
 *     summary: Listar todos os agendamentos (apenas admin)
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos os agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agendamento'
 *       403:
 *         description: Acesso negado - apenas administradores
 */
router.get('/admin/todos', roleMiddleware(['Administrador']), agendamentoControllers.listarTodosAgendamentos);

/**
 * @swagger
 * /api/agendamentos/stats/resumo:
 *   get:
 *     summary: Estatísticas de agendamentos
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 agendados:
 *                   type: integer
 *                 realizados:
 *                   type: integer
 *                 cancelados:
 *                   type: integer
 *                 proximos_7_dias:
 *                   type: integer
 *                 por_tipo:
 *                   type: object
 *                 por_mes:
 *                   type: array
 */
router.get('/stats/resumo', agendamentoControllers.obterEstatisticas);

module.exports = router;
