'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('agendamentos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      processo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'processos',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tipo_evento: {
        type: Sequelize.ENUM('audiencia', 'prazo', 'reuniao', 'diligencia', 'outro'),
        allowNull: false
      },
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      data_evento: {
        type: Sequelize.DATE,
        allowNull: false
      },
      local: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('agendado', 'realizado', 'cancelado', 'adiado'),
        defaultValue: 'agendado'
      },
      lembrete_1_dia: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lembrete_2_dias: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lembrete_1_semana: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('agendamentos', ['processo_id']);
    await queryInterface.addIndex('agendamentos', ['usuario_id']);
    await queryInterface.addIndex('agendamentos', ['data_evento']);
    await queryInterface.addIndex('agendamentos', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('agendamentos');
  }
};
