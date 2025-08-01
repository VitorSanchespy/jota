'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Criar tabela de grupos de usuários
    await queryInterface.createTable('user_groups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
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

    // Criar tabela de membros de grupos
    await queryInterface.createTable('user_group_members', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user_groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      added_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      added_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices únicos
    await queryInterface.addIndex('user_group_members', ['group_id', 'user_id'], {
      unique: true,
      name: 'unique_group_user'
    });

    // Criar tabela de logs de auditoria
    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      old_values: {
        type: Sequelize.JSON,
        allowNull: true
      },
      new_values: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('user_group_members');
    await queryInterface.dropTable('user_groups');
  }
};