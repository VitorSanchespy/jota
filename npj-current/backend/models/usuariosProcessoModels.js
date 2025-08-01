const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class UsuariosProcesso extends Model {
  static associate(models) {
    UsuariosProcesso.belongsTo(models.usuariosModels, { foreignKey: 'usuario_id', as: 'usuario' });
    UsuariosProcesso.belongsTo(models.processoModels, { foreignKey: 'processo_id', as: 'processo' });
  }
}

UsuariosProcesso.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    processo_id: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    sequelize,
    modelName: 'UsuariosProcesso',
    tableName: 'usuarios_processo',
    timestamps: false
  }
);

module.exports = UsuariosProcesso;
