const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Notificacao extends Model {
  static associate(models) {
    Notificacao.belongsTo(models.usuariosModels, { 
      foreignKey: 'usuario_id', 
      as: 'usuario' 
    });
    Notificacao.belongsTo(models.processoModels, { 
      foreignKey: 'processo_id', 
      as: 'processo' 
    });
    Notificacao.belongsTo(models.agendamentoModels, { 
      foreignKey: 'agendamento_id', 
      as: 'agendamento' 
    });
  }
}

Notificacao.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    processo_id: { type: DataTypes.INTEGER, allowNull: true },
    agendamento_id: { type: DataTypes.INTEGER, allowNull: true },
    tipo: { 
      type: DataTypes.ENUM('lembrete', 'alerta', 'informacao', 'sistema'), 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    canal: { 
      type: DataTypes.ENUM('email', 'sistema', 'ambos'), 
      defaultValue: 'sistema' 
    },
    status: { 
      type: DataTypes.ENUM('pendente', 'enviado', 'lido', 'erro'), 
      defaultValue: 'pendente' 
    },
    data_envio: { type: DataTypes.DATE },
    data_leitura: { type: DataTypes.DATE },
    tentativas: { type: DataTypes.INTEGER, defaultValue: 0 },
    erro_detalhes: { type: DataTypes.TEXT },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'Notificacao',
    tableName: 'notificacoes',
    timestamps: false
  }
);

module.exports = Notificacao;
