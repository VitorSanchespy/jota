const express = require('express');
const router = express.Router();
const roleMiddleware = require('../middleware/roleMiddleware.js'); // Novo middleware para roles
const authMiddleware = require('../middleware/authMiddleware');
const { validate, handleValidation, } = require('../middleware/validationMiddleware'); // Middleware de validação
// Importando os controladores de usuário
const { listarUsuarios, criarUsuarios, listarUsuariosPorRole, buscarUsuariosPorId,
atualizarUsuarios, reativarUsuarios, softDeleteUsuarios, 
listarUsuariosDebug, listarUsuariosParaVinculacao, perfilUsuario,
atualizarSenhaUsuarios, atualizarPerfilProprio} = require('../controllers/usuarioControllers.js');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Endpoint temporário para depuração
router.get('/debug/all', listarUsuariosDebug);


// Rotas de perfil do usuário autenticado (devem vir antes das rotas com :id)
router.get('/me', perfilUsuario);
router.put('/me', atualizarPerfilProprio);
router.put('/me/senha', atualizarSenhaUsuarios);
router.delete('/me', softDeleteUsuarios);

// Soft delete usuário (padrão REST)
router.delete('/:id', [
  roleMiddleware(['Professor', 'Admin']),
  softDeleteUsuarios
]);

// Reativar usuário
router.put('/:id/reativar', [
  roleMiddleware(['Admin', 'Professor']),
  reativarUsuarios
]);

//listar paginação de usuários
router.get('/pagina', roleMiddleware(['Admin']), listarUsuarios);

// Contar total de usuários (para dashboard)
router.get('/count', roleMiddleware(['Admin']), async (req, res) => {
  try {
    const db = require('../config/sequelize');
    
    // Contar usuários totais
    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE ativo = true');
    
    // Contar usuários por tipo
    const [porTipoResult] = await db.query(`
      SELECT r.nome_role as tipo, COUNT(u.id) as quantidade
      FROM usuarios u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.ativo = true 
      GROUP BY r.nome_role
    `);
    
    const usuariosPorTipo = {};
    porTipoResult.forEach(item => {
      usuariosPorTipo[item.tipo.toLowerCase()] = parseInt(item.quantidade);
    });
    
    res.json({ 
      total: parseInt(totalResult[0].total),
      porTipo: usuariosPorTipo
    });
  } catch (error) {
    console.error('Erro ao contar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Lista todos os usuários (para admin) ou apenas alunos (para professor)
router.get('/', roleMiddleware(['Admin', 'Professor']), (req, res, next) => {
  if (req.user && req.user.role_id === 3) { // Professor
    req.params.roleName = 'Aluno';
    return listarUsuariosPorRole(req, res, next);
  }
  return listarUsuarios(req, res, next);
});

// Lista apenas alunos (para professor)
router.get('/alunos', roleMiddleware(['Professor', 'Admin']), (req, res) => {
  req.params.roleName = 'Aluno';
  return listarUsuariosPorRole(req, res);
});

// lista usuários para vinculação ao processo
router.get('/vincular', roleMiddleware(['Professor', 'Admin']), listarUsuariosParaVinculacao);

// listar usuários por role
router.get('/role/:roleName', roleMiddleware(['Professor', 'Admin']), listarUsuariosPorRole);

// buscar usuário por ID
router.get(
  '/:id',
  validate('getUsuario'),
  handleValidation,
  buscarUsuariosPorId
);

// atualizar usuário
router.put(
  '/:id',
  validate('updateUsuario'),
  handleValidation,
  atualizarUsuarios
);

// criar novo usuário
router.post(
  '/',
  roleMiddleware(['Admin', 'Professor']),
  validate('registrarUsuario'),
  handleValidation,
  criarUsuarios
);

// atualizar senha do usuário
router.put('/:id/senha', [
  validate('updateSenha'),
  handleValidation,
  atualizarSenhaUsuarios
]);


module.exports = router;