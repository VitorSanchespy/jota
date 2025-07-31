const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize');

const rolesModels = require('./rolesModels');
const usuariosModels = require('./usuariosModels');
const diligenciaModels = require('./diligenciaModels');
const faseModels = require('./faseModels');
const materiaAssuntoModels = require('./materiaAssuntoModels');
const localTramitacaoModels = require('./localTramitacaoModels');
const processoModels = require('./processoModels');
const arquivoModels = require('./arquivoModels');
const atualizacoesProcessoModels = require('./atualizacaoProcessoModels');
const usuariosProcessoModels = require('./usuariosProcessoModels');
const agendamentoModels = require('./agendamentoModels');
const notificacaoModels = require('./notificacaoModels');
const configuracaoNotificacaoModels = require('./configuracaoNotificacaoModels');

const models = {
  rolesModels,
  usuariosModels,
  diligenciaModels,
  faseModels,
  materiaAssuntoModels,
  localTramitacaoModels,
  processoModels,
  arquivoModels,
  atualizacoesProcessoModels,
  usuariosProcessoModels,
  agendamentoModels,
  notificacaoModels,
  configuracaoNotificacaoModels,
  sequelize,
  Sequelize
};

// Inicializar associações
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models;
