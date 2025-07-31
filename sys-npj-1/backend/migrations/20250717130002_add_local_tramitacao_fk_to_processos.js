module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('processos');
    if (!table.local_tramitacao_id) {
      await queryInterface.addColumn('processos', 'local_tramitacao_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'local_tramitacao', key: 'id' },
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('processos');
    if (table.local_tramitacao_id) {
      await queryInterface.removeColumn('processos', 'local_tramitacao_id');
    }
  },
};
