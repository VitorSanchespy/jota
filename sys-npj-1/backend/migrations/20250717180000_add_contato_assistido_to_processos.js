const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class UsuariosProcesso extends Model {}

UsuariosProcesso.init(
  {
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'CASCADE',
      primaryKey: true
    },
    processo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'processos', key: 'id' },
      onDelete: 'CASCADE',
      primaryKey: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'UsuariosProcesso',
    tableName: 'usuarios_processo',
    timestamps: true
  }
);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('processos');
    if (!table.contato_assistido) {
      await queryInterface.addColumn('processos', 'contato_assistido', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('processos');
    if (table.contato_assistido) {
      await queryInterface.removeColumn('processos', 'contato_assistido');
    }
  },
};
