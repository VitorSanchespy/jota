'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar se a tabela configuracoes_notificacao existe
    const tableExists = await queryInterface.showAllTables();
    if (!tableExists.includes('configuracoes_notificacao')) {
      // Criar a tabela se não existir
      await queryInterface.createTable('configuracoes_notificacao', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: 'usuarios',
            key: 'id'
          }
        },
        email_lembretes: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        email_alertas: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        email_atualizacoes: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        sistema_lembretes: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        sistema_alertas: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        sistema_atualizacoes: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        dias_alerta_sem_atualizacao: {
          type: Sequelize.INTEGER,
          defaultValue: 30
        },
        horario_preferido_email: {
          type: Sequelize.TIME,
          defaultValue: '09:00:00'
        },
        criado_em: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        atualizado_em: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      });
    } else {
      // Se a tabela existe, verificar se a coluna email_atualizacoes existe
      const columns = await queryInterface.describeTable('configuracoes_notificacao');
      if (!columns.email_atualizacoes) {
        await queryInterface.addColumn('configuracoes_notificacao', 'email_atualizacoes', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        });
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Remover a coluna se ela existir
    const columns = await queryInterface.describeTable('configuracoes_notificacao');
    if (columns.email_atualizacoes) {
      await queryInterface.removeColumn('configuracoes_notificacao', 'email_atualizacoes');
    }
  }
};
