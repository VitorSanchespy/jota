'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notificacoes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      processo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'processos',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      agendamento_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'agendamentos',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('lembrete', 'alerta', 'notificacao'),
        allowNull: false
      },
      titulo: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      canal: {
        type: Sequelize.ENUM('email', 'sistema', 'ambos'),
        defaultValue: 'sistema'
      },
      status: {
        type: Sequelize.ENUM('pendente', 'enviado', 'lido', 'erro'),
        defaultValue: 'pendente'
      },
      data_envio: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data_leitura: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tentativas: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      erro_detalhes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('notificacoes', ['usuario_id']);
    await queryInterface.addIndex('notificacoes', ['processo_id']);
    await queryInterface.addIndex('notificacoes', ['agendamento_id']);
    await queryInterface.addIndex('notificacoes', ['status']);
    await queryInterface.addIndex('notificacoes', ['data_envio']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notificacoes');
  }
};
