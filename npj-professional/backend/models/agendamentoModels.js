const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Agendamento extends Model {
  static associate(models) {
    Agendamento.belongsTo(models.processoModels, { 
      foreignKey: 'processo_id', 
      as: 'processo' 
    });
    Agendamento.belongsTo(models.usuariosModels, { 
      foreignKey: 'usuario_id', 
      as: 'usuario' 
    });
    Agendamento.hasMany(models.notificacaoModels, { 
      foreignKey: 'agendamento_id', 
      as: 'notificacoes' 
    });
  }
}

Agendamento.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    processo_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { 
      type: DataTypes.ENUM('audiencia', 'prazo', 'evento', 'reuniao', 'outros'), 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descricao: { type: DataTypes.TEXT },
    data_evento: { type: DataTypes.DATE, allowNull: false },
    hora_evento: { type: DataTypes.TIME },
    local_evento: { type: DataTypes.STRING(255) },
    status: { 
      type: DataTypes.ENUM('agendado', 'realizado', 'cancelado', 'adiado'), 
      defaultValue: 'agendado' 
    },
    lembrete_1_dia: { type: DataTypes.BOOLEAN, defaultValue: true },
    lembrete_2_dias: { type: DataTypes.BOOLEAN, defaultValue: true },
    lembrete_1_semana: { type: DataTypes.BOOLEAN, defaultValue: false },
    notificacao_por_email: { type: DataTypes.BOOLEAN, defaultValue: true },
    notificacao_por_sistema: { type: DataTypes.BOOLEAN, defaultValue: true },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'Agendamento',
    tableName: 'agendamentos',
    timestamps: false
  }
);

module.exports = Agendamento;
