const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ConfiguracaoNotificacao extends Model {
  static associate(models) {
    ConfiguracaoNotificacao.belongsTo(models.usuariosModels, { 
      foreignKey: 'usuario_id', 
      as: 'usuario' 
    });
    models.usuariosModels.hasOne(ConfiguracaoNotificacao, {
      foreignKey: 'usuario_id',     
        as: 'configuracao'
    });
  }
}

ConfiguracaoNotificacao.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    email_lembretes: { type: DataTypes.BOOLEAN, defaultValue: true },
    email_alertas: { type: DataTypes.BOOLEAN, defaultValue: true },
    email_atualizacoes: { type: DataTypes.BOOLEAN, defaultValue: false },
    sistema_lembretes: { type: DataTypes.BOOLEAN, defaultValue: true },
    sistema_alertas: { type: DataTypes.BOOLEAN, defaultValue: true },
    sistema_atualizacoes: { type: DataTypes.BOOLEAN, defaultValue: true },
    dias_alerta_sem_atualizacao: { type: DataTypes.INTEGER, defaultValue: 30 },
    horario_preferido_email: { type: DataTypes.TIME, defaultValue: '09:00:00' },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'ConfiguracaoNotificacao',
    tableName: 'configuracoes_notificacao',
    timestamps: false
  }
);

module.exports = ConfiguracaoNotificacao;
