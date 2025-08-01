const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Usuario extends Model {
  static associate(models) {
    Usuario.belongsTo(models.rolesModels, { foreignKey: 'role_id', as: 'role' });
    Usuario.hasMany(models.atualizacoesProcessoModels, { foreignKey: 'usuario_id', as: 'atualizacoes' });
    Usuario.hasMany(models.arquivoModels, { foreignKey: 'usuario_id', as: 'arquivos' });
    Usuario.hasMany(models.usuariosProcessoModels, { foreignKey: 'usuario_id', as: 'usuariosProcesso' });
  }
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    senha: { type: DataTypes.STRING(255), allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
    telefone: { type: DataTypes.STRING(20) }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false
  }
);

module.exports = Usuario;