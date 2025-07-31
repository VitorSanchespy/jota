
const { Op } = require('sequelize');
const { gerarHash } = require('../utils/authUtils');
const Usuario = require('./usuarioModels');
const Role = require('./roleModels');

class UsuarioModel {
  static async buscarTodosPaginado({ search = "", page = 1, pageSize = 20 }) {
    return await Usuario.findAll({
      where: {
        ativo: true,
        nome: { [Op.like]: `%${search}%` }
      },
      include: [{ model: Role, attributes: ['nome'] }],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  static async buscarAlunosPaginado({ search = "", page = 1, pageSize = 20 }) {
    return await Usuario.findAll({
      where: {
        ativo: true,
        nome: { [Op.like]: `%${search}%` },
        role_id: 2 // id do papel Aluno
      },
      include: [{ model: Role, attributes: ['nome'] }],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  static async buscarAlunosPorNome(nome) {
    return await Usuario.findAll({
      where: {
        ativo: true,
        nome: { [Op.like]: `%${nome}%` },
        role_id: 2
      },
      include: [{ model: Role, attributes: ['nome'] }]
    });
  }

  static async criar({ nome, email, senha, role_id }) {
    const senhaHash = await gerarHash(senha);
    const usuario = await Usuario.create({ nome, email, senha: senhaHash, role_id, ativo: true });
    return usuario.id;
  }

  static async buscarTodos() {
    return await Usuario.findAll({
      where: { ativo: true },
      include: [{ model: Role, attributes: ['nome'] }]
    });
  }

  static async buscarPorId(id) {
    return await Usuario.findOne({
      where: { id, ativo: true },
      include: [{ model: Role, attributes: ['nome'] }]
    });
  }

  static async buscarPorEmail(email) {
    return await Usuario.findOne({
      where: { email, ativo: true },
      include: [{ model: Role, attributes: ['nome'] }]
    });
  }

  static async atualizar(id, { nome, email, role_id }) {
    return await Usuario.update({ nome, email, role_id }, { where: { id } });
  }

  static async reativar(id) {
    return await Usuario.update({ ativo: true }, { where: { id } });
  }

  static async atualizarSenha(id, senha) {
    const senhaHash = await gerarHash(senha);
    return await Usuario.update({ senha: senhaHash }, { where: { id } });
  }

  static async listarPorRole(roleName) {
    const role = await Role.findOne({ where: { nome: roleName } });
    if (!role) return [];
    return await Usuario.findAll({
      where: { role_id: role.id, ativo: true },
      include: [{ model: Role, attributes: ['nome'] }]
    });
  }

  static async deletar(id) {
    return await Usuario.update({ ativo: false }, { where: { id } });
  }

  static async usuarioCompleto(id) {
    return await Usuario.findOne({
      where: { id },
      include: [{ model: Role, attributes: ['nome'] }]
    });
  }
}

module.exports = UsuarioModel;