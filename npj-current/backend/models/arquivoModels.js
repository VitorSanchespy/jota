const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Arquivo extends Model {
  static associate(models) {
    Arquivo.belongsTo(models.processoModels, { foreignKey: 'processo_id', as: 'processo' });
    Arquivo.belongsTo(models.usuariosModels, { foreignKey: 'usuario_id', as: 'usuario' });
    Arquivo.hasMany(models.atualizacoesProcessoModels, { foreignKey: 'arquivos_id', as: 'atualizacoes' });
  }

  static async anexarAProcesso(arquivo_id, processo_id) {
    const arquivo = await Arquivo.findByPk(arquivo_id);
    if (!arquivo) throw new Error('Arquivo não encontrado');
    arquivo.processo_id = processo_id;
    await arquivo.save();
    return arquivo;
  }
}

Arquivo.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    caminho: { type: DataTypes.STRING, allowNull: false },
    tamanho: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    processo_id: { type: DataTypes.INTEGER },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  {
    sequelize,
    modelName: 'Arquivo',
    tableName: 'arquivos',
    timestamps: false
  }
);

module.exports = Arquivo;