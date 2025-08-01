'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Estender tabela de agendamentos para funcionalidades avançadas
    await queryInterface.addColumn('agendamentos', 'google_event_id', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('agendamentos', 'outlook_event_id', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('agendamentos', 'recorrente', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('agendamentos', 'frequencia', {
      type: Sequelize.ENUM('diaria', 'semanal', 'mensal'),
      allowNull: true
    });

    await queryInterface.addColumn('agendamentos', 'fim_recorrencia', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('agendamentos', 'agendamento_pai_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'agendamentos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('agendamentos', 'reminder_sent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('agendamentos', 'status', {
      type: Sequelize.ENUM('Agendado', 'Confirmado', 'Concluído', 'Cancelado', 'Remarcado'),
      defaultValue: 'Agendado'
    });

    // Criar tabela de integrações de calendário
    await queryInterface.createTable('calendar_integrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      provider: {
        type: Sequelize.ENUM('google', 'outlook', 'apple'),
        allowNull: false
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criar índice único para user_id + provider
    await queryInterface.addIndex('calendar_integrations', ['user_id', 'provider'], {
      unique: true,
      name: 'unique_user_provider'
    });

    // Criar tabela de lembretes
    await queryInterface.createTable('appointment_reminders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      agendamento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'agendamentos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reminder_type: {
        type: Sequelize.ENUM('email', 'sms', 'notification', 'whatsapp'),
        allowNull: false
      },
      minutes_before: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        defaultValue: 'pending'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices
    await queryInterface.addIndex('appointment_reminders', ['agendamento_id']);
    await queryInterface.addIndex('appointment_reminders', ['status']);
  },

  async down(queryInterface, Sequelize) {
    // Remover tabelas
    await queryInterface.dropTable('appointment_reminders');
    await queryInterface.dropTable('calendar_integrations');

    // Remover colunas da tabela agendamentos
    await queryInterface.removeColumn('agendamentos', 'status');
    await queryInterface.removeColumn('agendamentos', 'reminder_sent');
    await queryInterface.removeColumn('agendamentos', 'agendamento_pai_id');
    await queryInterface.removeColumn('agendamentos', 'fim_recorrencia');
    await queryInterface.removeColumn('agendamentos', 'frequencia');
    await queryInterface.removeColumn('agendamentos', 'recorrente');
    await queryInterface.removeColumn('agendamentos', 'outlook_event_id');
    await queryInterface.removeColumn('agendamentos', 'google_event_id');
  }
};