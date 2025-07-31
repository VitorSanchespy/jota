const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware.js');
const { validate, handleValidation } = require('../middleware/validationMiddleware');
// Importando os controladores de processo
const {
    criarProcessos,  vincularUsuarioProcessos, atualizarProcessos,
    listarProcessos, removerUsuarioProcessos,
    listarUsuariosPorProcessos, listarMeusProcessos,
    buscarProcessos, detalharProcessos
} = require('../controllers/processoControllers.js');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// criar novo processo
router.post('/novo',
    roleMiddleware(['Professor', 'Admin']),
    validate('criarProcesso'),
    criarProcessos
);

// Atualizar processo existente
router.patch('/:processo_id',
    roleMiddleware(['Professor', 'Admin', 'Aluno']),
    validate('atualizarProcesso'),
    handleValidation,
    atualizarProcessos
)

// Detalhar processo completo
router.get('/:processo_id/detalhes',
    roleMiddleware(['Professor', 'Admin', 'Aluno']),
    detalharProcessos
);

// listar processos
router.get('/', 
    roleMiddleware(['Professor', 'Admin', 'Aluno']),
    async (req, res) => {
        try {
            const { id: userId, role } = req.usuario;
            const db = require('../config/sequelize');
            let query = `
                SELECT p.*, u.nome as usuario_responsavel
                FROM processos p
                LEFT JOIN usuarios u ON p.idusuario_responsavel = u.id
                WHERE 1=1
            `;
            // Se for Aluno, retorna apenas os processos vinculados ao aluno
            if (role === 'Aluno' || role === 2 || role === '2') {
                query += ` AND p.idusuario_responsavel = ${userId}`;
            }
            query += ` ORDER BY p.criado_em DESC`;
            const [processos] = await db.query(query);
            res.json(processos);
        } catch (error) {
            console.error('Erro ao listar processos:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
);

// Remover usuário de processo
router.delete('/remover-usuario',
    roleMiddleware(['Professor', 'Admin']),
    validate('removerUsuario'),
    removerUsuarioProcessos
);

// Listar usuários vinculados a um processo
router.get('/:processo_id/usuarios',
    roleMiddleware(['Professor', 'Admin', 'Aluno']),
    listarUsuariosPorProcessos
);

// Listar meus processos (Alunos e Professores)
router.get('/meus-processos', listarMeusProcessos);

// Listar processos recentes (últimos 5 atualizados)
router.get('/recentes', 
    roleMiddleware(['Professor', 'Admin', 'Aluno']),
    async (req, res) => {
        try {
            const { id: userId, role } = req.usuario;
            
            let query = `
                SELECT p.*, u.nome as usuario_responsavel
                FROM processos p
                LEFT JOIN usuarios u ON p.idusuario_responsavel = u.id
                WHERE 1=1
            `;
            
            // Filtrar baseado no papel do usuário
            if (role === 'Aluno' || role === 2 || role === '2') { // Aluno
                query += ` AND p.idusuario_responsavel = ${userId}`;
            }
            
            query += ` ORDER BY p.criado_em DESC LIMIT 5`;
            
            const db = require('../config/sequelize');
            const [processos] = await db.query(query);
            
            res.json(processos);
        } catch (error) {
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
);

// Estatísticas dos processos (para dashboard)
router.get('/stats', 
    roleMiddleware(['Professor', 'Admin']),
    async (req, res) => {
        try {
            const { id: userId, role } = req.usuario;
            const db = require('../config/sequelize');
            
            let whereClause = '';
            if (role === 'Professor') {
                whereClause = `WHERE idusuario_responsavel = ${userId}`;
            }
            
            // Contar processos por status
            const [statusResult] = await db.query(`
                SELECT status, COUNT(*) as quantidade 
                FROM processos 
                ${whereClause}
                GROUP BY status
            `);
            
            // Total de processos
            const [totalResult] = await db.query(`
                SELECT COUNT(*) as total 
                FROM processos 
                ${whereClause}
            `);
            
            const stats = {
                total: parseInt(totalResult[0].total),
                porStatus: {},
                ativos: 0
            };
            
            statusResult.forEach(item => {
                const status = item.status || 'indefinido';
                const quantidade = parseInt(item.quantidade);
                stats.porStatus[status] = quantidade;
                
                if (status !== 'arquivado') {
                    stats.ativos += quantidade;
                }
            });
            
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
);

// Buscar processos por numero
router.get('/buscar', buscarProcessos);

// Vincular usuário a processo
router.post('/vincular-usuario',
    roleMiddleware(['Professor', 'Admin']),
    validate('vincularUsuario'),
    vincularUsuarioProcessos
);

module.exports = router;
