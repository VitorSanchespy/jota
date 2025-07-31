module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Só adiciona a coluna se ela não existir
    const table = await queryInterface.describeTable('atualizacoes_processo');
    if (!table['tipo_atualizacao']) {
      await queryInterface.addColumn('atualizacoes_processo', 'tipo_atualizacao', {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [['informacao', 'arquivo']]
        }
      });
    }
    if (!table['descricao']) {
      await queryInterface.addColumn('atualizacoes_processo', 'descricao', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('atualizacoes_processo', 'tipo_atualizacao');
    await queryInterface.removeColumn('atualizacoes_processo', 'descricao');
  }
};
