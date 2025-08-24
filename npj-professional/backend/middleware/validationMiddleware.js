const { check, validationResult } = require('express-validator');

const validate = (method) => {
  switch(method) {
    // Validações para autenticação
    case 'registrarUsuario':
      return [
        check('nome').notEmpty().withMessage('Nome é obrigatório')
          .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres')
          .trim(),
        check('email').isEmail().withMessage('Email inválido')
          .normalizeEmail(),
        check('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
        check('role_id').isInt({ min: 1 }).withMessage('ID de perfil inválido')
      ];
      
    case 'loginUsuario':
      return [
        check('email').isEmail().withMessage('Email inválido')
          .normalizeEmail(),
        check('senha').notEmpty().withMessage('Senha é obrigatória')
      ];

    // Validações para usuários
    case 'getUsuario':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de usuário inválido')
          .toInt()
      ];
      
    case 'updateUsuario':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de usuário inválido')
          .toInt(),
        check('nome').optional().isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres')
          .trim(),
        check('email').optional().isEmail().withMessage('Email inválido')
          .normalizeEmail(),
        check('role_id').optional().isInt({ min: 1 }).withMessage('ID de perfil inválido')
      ];
      
    case 'updateSenha':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de usuário inválido')
          .toInt(),
        check('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
      ];

    // Validações para processos
    case 'criarProcesso':
      return [
        check('numero_processo').notEmpty().withMessage('Número do processo é obrigatório')
          .isString().withMessage('Número do processo deve ser texto')
          .trim(),
        check('contato_assistido').notEmpty().withMessage('Contato do assistido é obrigatório')
          .isString().withMessage('Contato do assistido deve ser texto')
          .trim(),
      ];
    
    case 'buscarProcessos':
    return [
        check('pagina').optional().isInt({ min: 1 }).toInt(),
        check('porPagina').optional().isInt({ min: 1, max: 100 }).toInt(),
        check('numero_processo').optional().trim(),
        check('aluno_id').optional().isInt().toInt()
    ];
    
    case 'listarAlunosPorProcesso':
      return [
          check('processo_id').isInt({ min: 1 }).withMessage('ID do processo inválido')
      ];
    
    case 'atribuirAluno':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido'),
        check('aluno_id').isInt({ min: 1 }).withMessage('ID de aluno inválido')
      ];
      
    case 'getProcesso':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de processo inválido')
          .toInt()
      ];

    // Validações para atualizações
    case 'adicionarAtualizacao':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido')
          .toInt(),
        check('descricao').notEmpty().withMessage('Descrição é obrigatória')
          .isString().withMessage('Descrição deve ser texto')
          .trim()
      ];
      
    case 'listarAtualizacoes':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido')
          .toInt()
      ];

    // Validações para atualização de processos
    case 'atualizarProcesso':
      return [
        check('numero_processo').optional().notEmpty().withMessage('Número do processo não pode estar vazio')
          .isString().withMessage('Número do processo deve ser texto')
          .trim(),
        check('contato_assistido').optional().notEmpty().withMessage('Contato do assistido não pode estar vazio')
          .isString().withMessage('Contato do assistido deve ser texto')
          .trim(),
        check('assistido').optional().trim(),
        check('descricao').optional().trim(),
        check('status').optional().trim(),
        check('sistema').optional().trim()
      ];

    // Validações para atribuição de usuários a processos
    case 'atribuirUsuario':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido'),
        check('usuario_id').isInt({ min: 1 }).withMessage('ID de usuário inválido'),
        check('role').isIn(['Aluno', 'Professor']).withMessage('Role inválida')
      ];

    default:
      return [];
  }
};

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      erro: 'Validação falhou',
      detalhes: errors.array().map(err => ({
        campo: err.param,
        mensagem: err.msg,
        valor: err.value
      }))
    });
  }
  next();
};

module.exports = { validate, handleValidation };