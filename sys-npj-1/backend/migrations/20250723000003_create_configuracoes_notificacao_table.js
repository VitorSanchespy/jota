'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('configuracoes_notificacao', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      email_lembretes: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      email_alertas: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sistema_lembretes: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sistema_alertas: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      dias_alerta_sem_atualizacao: {
        type: Sequelize.INTEGER,
        defaultValue: 7
      },
      horario_envio_resumo: {
        type: Sequelize.TIME,
        defaultValue: '09:00:00'
      },
      enviar_resumo_diario: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      enviar_resumo_semanal: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      criado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Adicionar índices
    await queryInterface.addIndex('configuracoes_notificacao', ['usuario_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('configuracoes_notificacao');
  }
};


    // ...restante do código
