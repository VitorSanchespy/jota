const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NPJ Professional API',
      version: '2.0.0',
      description: 'API completa do Sistema de Gerenciamento de Processos Jurídicos do NPJ UFMT - Versão Profissional',
      contact: {
        name: 'NPJ UFMT',
        email: 'npj@ufmt.br'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://npj-professional.ufmt.br',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['nome', 'email', 'role'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do usuário'
            },
            nome: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário'
            },
            role: {
              type: 'string',
              enum: ['Admin', 'Professor', 'Aluno'],
              description: 'Papel do usuário no sistema'
            },
            ativo: {
              type: 'boolean',
              description: 'Status ativo do usuário'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        Process: {
          type: 'object',
          required: ['numero_processo', 'titulo', 'descricao'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do processo'
            },
            numero_processo: {
              type: 'string',
              description: 'Número único do processo'
            },
            titulo: {
              type: 'string',
              description: 'Título do processo'
            },
            descricao: {
              type: 'string',
              description: 'Descrição detalhada do processo'
            },
            status: {
              type: 'string',
              enum: ['Ativo', 'Arquivado', 'Suspenso'],
              description: 'Status atual do processo'
            },
            data_inicio: {
              type: 'string',
              format: 'date',
              description: 'Data de início do processo'
            },
            created_by: {
              type: 'integer',
              description: 'ID do usuário que criou o processo'
            }
          }
        },
        Appointment: {
          type: 'object',
          required: ['titulo', 'data_hora', 'usuario_id'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do agendamento'
            },
            titulo: {
              type: 'string',
              description: 'Título do agendamento'
            },
            descricao: {
              type: 'string',
              description: 'Descrição do agendamento'
            },
            data_hora: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora do agendamento'
            },
            duracao: {
              type: 'integer',
              description: 'Duração em minutos'
            },
            usuario_id: {
              type: 'integer',
              description: 'ID do usuário responsável'
            },
            processo_id: {
              type: 'integer',
              description: 'ID do processo relacionado (opcional)'
            },
            recorrente: {
              type: 'boolean',
              description: 'Se o agendamento é recorrente'
            },
            frequencia: {
              type: 'string',
              enum: ['diaria', 'semanal', 'mensal'],
              description: 'Frequência da recorrência'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da notificação'
            },
            title: {
              type: 'string',
              description: 'Título da notificação'
            },
            message: {
              type: 'string',
              description: 'Mensagem da notificação'
            },
            type: {
              type: 'string',
              description: 'Tipo da notificação'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Prioridade da notificação'
            },
            read: {
              type: 'boolean',
              description: 'Se a notificação foi lida'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da notificação'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            details: {
              type: 'object',
              description: 'Detalhes adicionais do erro'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NPJ Professional API Documentation'
  }));
  
  // Endpoint para obter a especificação JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};