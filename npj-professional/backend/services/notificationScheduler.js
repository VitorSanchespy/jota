const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { 
  notificacaoModels: Notificacao, 
  usuariosModels: Usuario, 
  processoModels: Processo,
  agendamentoModels: Agendamento,
  configuracaoNotificacaoModels: ConfiguracaoNotificacao
} = require('../models/indexModels');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// Enviar notificação individual
const sendNotification = async (to, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>Sistema NPJ - UFMT</h1>
          </div>
          <div style="padding: 20px; background-color: #f8f9fa;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
          </div>
          <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
            Sistema NPJ - Núcleo de Prática Jurídica UFMT
          </div>
        </div>
      `,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return false;
  }
};

// Processar notificações pendentes
const processarNotificacoesPendentes = async () => {
  try {
    const agora = new Date();
    
    // Buscar notificações que devem ser enviadas
    const notificacoesPendentes = await Notificacao.findAll({
      where: {
        status: 'pendente',
        data_envio: {
          [require('sequelize').Op.lte]: agora
        }
      },
      include: [
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nome', 'email'],
          include: [
            { model: ConfiguracaoNotificacao, as: 'configuracao' }
          ]
        },
        { model: Processo, as: 'processo' }
      ],
      limit: 50 // Processar em lotes
    });

    console.log(`📋 Processando ${notificacoesPendentes.length} notificações pendentes...`);

    for (const notificacao of notificacoesPendentes) {
      try {
        const usuario = notificacao.usuario;
        const config = usuario.configuracao;
        
        let sucesso = true;

        // Verificar se deve enviar email
        if (notificacao.canal === 'email' || notificacao.canal === 'ambos') {
          if (config && config.email_lembretes && notificacao.tipo === 'lembrete') {
            sucesso = await sendNotification(
              usuario.email, 
              notificacao.titulo, 
              notificacao.mensagem
            );
          } else if (config && config.email_alertas && notificacao.tipo === 'alerta') {
            sucesso = await sendNotification(
              usuario.email, 
              notificacao.titulo, 
              notificacao.mensagem
            );
          }
        }

        // Atualizar status da notificação
        await notificacao.update({
          status: sucesso ? 'enviado' : 'erro',
          data_envio: new Date(),
          tentativas: notificacao.tentativas + 1,
          erro_detalhes: sucesso ? null : 'Erro ao enviar email'
        });

      } catch (error) {
        console.error(`❌ Erro ao processar notificação ${notificacao.id}:`, error);
        await notificacao.update({
          status: 'erro',
          tentativas: notificacao.tentativas + 1,
          erro_detalhes: error.message
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar notificações pendentes:', error);
  }
};

// Verificar processos sem atualização
const verificarProcessosSemAtualizacao = async () => {
  try {
    console.log('🔍 Verificando processos sem atualização...');
    
    // Buscar configurações de usuários
    const configuracoes = await ConfiguracaoNotificacao.findAll({
      include: [{ model: Usuario, as: 'usuario' }]
    });

    for (const config of configuracoes) {
      if (!config.email_alertas && !config.sistema_alertas) continue;

      const diasLimite = config.dias_alerta_sem_atualizacao;
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasLimite);

      // Buscar processos do usuário sem atualização
      const processosSemAtualizacao = await Processo.findAll({
        where: {
          idusuario_responsavel: config.usuario_id,
          status: ['Aberto', 'Em andamento'],
          criado_em: {
            [require('sequelize').Op.lt]: dataLimite
          }
        },
        include: [
          {
            model: require('../models/atualizacaoProcessoModels'),
            as: 'atualizacoes',
            required: false,
            where: {
              data_atualizacao: {
                [require('sequelize').Op.gte]: dataLimite
              }
            }
          }
        ]
      });

      // Filtrar processos que realmente não têm atualizações recentes
      const processosSemAtualizacaoRecente = processosSemAtualizacao.filter(
        processo => !processo.atualizacoes || processo.atualizacoes.length === 0
      );

      if (processosSemAtualizacaoRecente.length > 0) {
        // Criar notificação de alerta
        const titulo = `Alerta: ${processosSemAtualizacaoRecente.length} processo(s) sem atualização`;
        const mensagem = `Você tem ${processosSemAtualizacaoRecente.length} processo(s) sem atualização há mais de ${diasLimite} dias. Verifique se há atualizações pendentes.`;

        await Notificacao.create({
          usuario_id: config.usuario_id,
          tipo: 'alerta',
          titulo,
          mensagem,
          canal: config.email_alertas ? 'ambos' : 'sistema',
          data_envio: new Date()
        });

        console.log(`⚠️ Alerta criado para usuário ${config.usuario.nome}: ${processosSemAtualizacaoRecente.length} processos`);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar processos sem atualização:', error);
  }
};

// Inicializar cron jobs
const inicializarCronJobs = () => {
  console.log('🚀 Inicializando sistema de notificações...');

  // Processar notificações pendentes a cada 5 minutos
  cron.schedule('*/5 * * * *', () => {
    console.log('⏰ Executando processamento de notificações...');
    processarNotificacoesPendentes();
  });

  // Verificar processos sem atualização diariamente às 9h
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Executando verificação de processos sem atualização...');
    verificarProcessosSemAtualizacao();
  });

  // Limpeza de notificações antigas semanalmente
  cron.schedule('0 0 * * 0', async () => {
    console.log('🧹 Executando limpeza de notificações antigas...');
    try {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      
      const deletadas = await Notificacao.destroy({
        where: {
          criado_em: {
            [require('sequelize').Op.lt]: trintaDiasAtras
          },
          status: ['enviado', 'lido']
        }
      });
      
      console.log(`🗑️ ${deletadas} notificações antigas removidas`);
    } catch (error) {
      console.error('❌ Erro na limpeza de notificações:', error);
    }
  });

  console.log('✅ Sistema de notificações iniciado com sucesso!');
};

// Criar configuração padrão para novo usuário
const criarConfiguracaoPadrao = async (usuarioId) => {
  try {
    const configExistente = await ConfiguracaoNotificacao.findOne({
      where: { usuario_id: usuarioId }
    });

    if (!configExistente) {
      await ConfiguracaoNotificacao.create({
        usuario_id: usuarioId
      });
      console.log(`✅ Configuração de notificação criada para usuário ${usuarioId}`);
    }
  } catch (error) {
    console.error('❌ Erro ao criar configuração padrão:', error);
  }
};

module.exports = { 
  sendNotification,
  processarNotificacoesPendentes,
  verificarProcessosSemAtualizacao,
  inicializarCronJobs,
  criarConfiguracaoPadrao
};
