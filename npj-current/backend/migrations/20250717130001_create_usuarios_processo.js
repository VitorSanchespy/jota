module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios_processo', {
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      processo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'processos', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios_processo');
  },
};
