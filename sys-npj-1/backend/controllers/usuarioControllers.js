const { usuariosModels: Usuario, rolesModels: Role } = require('../models/indexModels');

// Endpoint temporário para depuração: lista todos os usuários e todos os campos
exports.listarUsuariosDebug = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({ include: [{ model: Role, as: 'role' }] });
        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao listar usuários (debug):', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Listar usuários para atribuição (com paginação e filtro por nome)
exports.listarUsuariosParaVinculacao = async (req, res) => {
  try {
    if (req.usuario.role !== 'Professor' && req.usuario.role !== 'Admin') {
      return res.status(403).json({ erro: 'Acesso permitido apenas para professores e admins' });
    }
    const { search = "", page = 1 } = req.query;
    const usuarios = await Usuario.findAll({
      where: {
        ativo: true,
        nome: { [require('sequelize').Op.like]: `%${search}%` }
      },
      include: [{ model: Role, as: 'role' }],
      limit: 20,
      offset: (Number(page) - 1) * 20
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Listar usuários com paginação e filtro por nome
exports.listarUsuarios = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const usuarios = await Usuario.findAll({
            where: {
                ativo: true,
                nome: { [require('sequelize').Op.like]: `%${search}%` }
            },
            include: [{ model: Role, as: 'role' }],
            limit: 20,
            offset: (Number(page) - 1) * 20
        });
        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Listar usuários por role
exports.listarUsuariosPorRole = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const { roleName } = req.params;
        
        const whereClause = {
            ativo: true
        };
        
        // Adicionar filtro de busca se fornecido
        if (search) {
            whereClause.nome = { [require('sequelize').Op.like]: `%${search}%` };
        }
        
        const usuarios = await Usuario.findAll({
            where: whereClause,
            include: [{ model: Role, as: 'role', where: { nome: roleName } }],
            limit: 20,
            offset: (Number(page) - 1) * 20
        });
        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao listar usuários por role:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Criar novo usuário
exports.criarUsuarios = async (req, res) => {
    try {
        const { nome, email, senha, role_id, telefone } = req.body;
        let roleNome = 'Aluno';
        if (role_id === 1) roleNome = 'Admin';
        if (role_id === 2) roleNome = 'Aluno';
        if (role_id === 3) roleNome = 'Professor';
        const usuarioLogado = req.usuario;
        
        console.log('[criarUsuarios] Usuario logado:', usuarioLogado);
        console.log('[criarUsuarios] Tentando criar role:', roleNome, 'role_id:', role_id);
        
        if (!usuarioLogado) {
            if (roleNome !== 'Aluno') {
                return res.status(403).json({ erro: 'Só é permitido criar conta de Aluno.' });
            }
        } else if (usuarioLogado.role === 'Professor') {
            // Professores podem criar Alunos e outros Professores, mas não Admins
            if (roleNome === 'Admin') {
                return res.status(403).json({ erro: 'Professores não podem criar Admins.' });
            }
        }
        const senhaHash = await require('../utils/authUtils').gerarHash(senha);
        const usuario = await Usuario.create({ nome, email, senha: senhaHash, role_id, telefone });
        res.status(201).json({ id: usuario.id, mensagem: 'Usuário criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Buscar usuário por ID
exports.buscarUsuariosPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, { include: [{ model: Role, as: 'role' }] });
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Perfil
// Perfil do usuário autenticado
exports.perfilUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findByPk(usuarioId, { include: [{ model: Role, as: 'role' }] });
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Atualizar senha do usuário
exports.atualizarSenhaUsuarios = async (req, res) => {
    try {
        const { senha } = req.body;
        const senhaHash = await require('../utils/authUtils').gerarHash(senha);
        await Usuario.update({ senha: senhaHash }, { where: { id: req.params.id } });
        res.json({ mensagem: 'Senha atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Atualizar próprio perfil (usuário autenticado)
exports.atualizarPerfilProprio = async (req, res) => {
    try {
        const { nome, email, telefone } = req.body;
        const usuarioId = req.usuario.id;
        
        // Usuário pode editar apenas nome, email e telefone - não pode alterar role_id
        await Usuario.update({ nome, email, telefone }, { where: { id: usuarioId } });
        
        // Retornar dados atualizados
        const usuarioAtualizado = await Usuario.findByPk(usuarioId, { 
            include: [{ model: Role, as: 'role' }] 
        });
        
        res.json({ 
            mensagem: 'Perfil atualizado com sucesso',
            usuario: usuarioAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil próprio:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Atualizar usuário (apenas Admin/Professor)
exports.atualizarUsuarios = async (req, res) => {
    try {
        const { nome, email, role_id, telefone } = req.body;
        await Usuario.update({ nome, email, role_id, telefone }, { where: { id: req.params.id } });
        res.json({ mensagem: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Soft delete: inativa o usuário (ativo = 0)
exports.softDeleteUsuarios = async (req, res) => {
    try {
        const id = req.params.id;
        await Usuario.update({ ativo: false }, { where: { id } });
        res.json({ mensagem: 'Usuário inativado com sucesso.' });
    } catch (error) {
        console.error('Erro ao inativar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// Reativar usuário: marca ativo = 1
exports.reativarUsuarios = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        if (usuario.ativo) {
            return res.status(400).json({ erro: 'Usuário já está ativo' });
        }
        await Usuario.update({ ativo: true }, { where: { id: req.params.id } });
        res.json({ mensagem: 'Usuário reativado com sucesso', usuario });
    } catch (error) {
        console.error('Erro ao reativar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};


