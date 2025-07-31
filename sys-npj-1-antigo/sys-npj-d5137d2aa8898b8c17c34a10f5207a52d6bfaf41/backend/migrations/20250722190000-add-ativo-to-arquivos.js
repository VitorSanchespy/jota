// Migration para adicionar campo 'ativo' na tabela de arquivos
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('arquivos', 'ativo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('arquivos', 'ativo');
  }
};
