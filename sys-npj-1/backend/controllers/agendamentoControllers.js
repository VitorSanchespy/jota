const { 
  agendamentoModels: Agendamento, 
  processoModels: Processo, 
  usuariosModels: Usuario,
  notificacaoModels: Notificacao
} = require('../models/indexModels');
const notificationService = require('../services/notificationService');

// Listar agendamentos
exports.listarAgendamentos = async (req, res) => {
  try {
    const { processo_id, data_inicio, data_fim, tipo, status } = req.query;
    const userId = req.usuario.id;
    const userRole = req.usuario.role;

    let whereClause = {};
    
    // Filtros baseados no role
    if (userRole === 'Aluno') {
      whereClause.usuario_id = userId;
    } else if (userRole === 'Professor') {
      // Professor pode ver agendamentos dos processos que supervisiona
      const processos = await Processo.findAll({
        where: { idusuario_responsavel: userId }
      });
      const processoIds = processos.map(p => p.id);
      whereClause.processo_id = processoIds;
    }
    // Admin vê todos

    // Filtros adicionais
    if (processo_id) whereClause.processo_id = processo_id;
    if (tipo) whereClause.tipo = tipo;
    if (status) whereClause.status = status;
    
    if (data_inicio && data_fim) {
      whereClause.data_evento = {
        [require('sequelize').Op.between]: [data_inicio, data_fim]
      };
    }

    const agendamentos = await Agendamento.findAll({
      where: whereClause,
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['data_evento', 'ASC']]
    });

    res.json(agendamentos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Criar agendamento
exports.criarAgendamento = async (req, res) => {
  try {
    const {
      processo_id,
      tipo,
      titulo,
      descricao,
      data_evento,
      hora_evento,
      local_evento,
      lembrete_1_dia,
      lembrete_2_dias,
      lembrete_1_semana,
      notificacao_por_email,
      notificacao_por_sistema
    } = req.body;

    const usuario_id = req.usuario.id;

    // Verificar se o processo existe
    const processo = await Processo.findByPk(processo_id);
    if (!processo) {
      return res.status(404).json({ erro: 'Processo não encontrado' });
    }

    // Verificar permissões
    if (req.usuario.role === 'Aluno') {
      // Aluno só pode criar agendamentos para processos em que está vinculado
      const usuarioProcesso = await require('../models/usuariosProcessoModels').findOne({
        where: { usuario_id, processo_id }
      });
      if (!usuarioProcesso) {
        return res.status(403).json({ erro: 'Sem permissão para este processo' });
      }
    }

    const agendamento = await Agendamento.create({
      processo_id,
      usuario_id,
      tipo,
      titulo,
      descricao,
      data_evento,
      hora_evento,
      local_evento,
      lembrete_1_dia: lembrete_1_dia || true,
      lembrete_2_dias: lembrete_2_dias || true,
      lembrete_1_semana: lembrete_1_semana || false,
      notificacao_por_email: notificacao_por_email || true,
      notificacao_por_sistema: notificacao_por_sistema || true
    });

    // Buscar o agendamento criado com includes
    const agendamentoCriado = await Agendamento.findByPk(agendamento.id, {
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });

    // Agendar notificações
    await agendarNotificacoes(agendamentoCriado);

    res.status(201).json(agendamentoCriado);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar agendamento
exports.atualizarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const agendamento = await Agendamento.findByPk(id);

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    // Verificar permissões
    if (req.usuario.role === 'Aluno' && agendamento.usuario_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão para editar este agendamento' });
    }

    await agendamento.update({
      ...req.body,
      atualizado_em: new Date()
    });

    const agendamentoAtualizado = await Agendamento.findByPk(id, {
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });

    res.json(agendamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Deletar agendamento
exports.excluirAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const agendamento = await Agendamento.findByPk(id);

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    // Verificar permissões
    if (req.usuario.role === 'Aluno' && agendamento.usuario_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão para excluir este agendamento' });
    }

    await agendamento.destroy();
    res.json({ mensagem: 'Agendamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar agendamento por ID
exports.buscarAgendamentoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const agendamento = await Agendamento.findByPk(id, {
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    // Verificar permissões
    if (req.usuario.role === 'Aluno' && agendamento.usuario_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão para ver este agendamento' });
    }

    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar agendamentos para calendário
exports.buscarPorCalendario = async (req, res) => {
  try {
    const { ano, mes } = req.params;
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    const whereClause = {
      data_evento: {
        [Op.between]: [dataInicio, dataFim]
      }
    };

    // Filtrar por usuário se for Aluno
    if (req.usuario.role === 'Aluno') {
      whereClause.usuario_id = req.usuario.id;
    }

    const agendamentos = await Agendamento.findAll({
      where: whereClause,
      include: [
        { model: Processo, as: 'processo', attributes: ['id', 'numero_processo'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }
      ],
      order: [['data_evento', 'ASC']]
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos do calendário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Listar todos os agendamentos (admin)
exports.listarTodosAgendamentos = async (req, res) => {
  try {
    const agendamentos = await Agendamento.findAll({
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['data_evento', 'ASC']]
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar todos os agendamentos:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Obter estatísticas
exports.obterEstatisticas = async (req, res) => {
  try {
    const whereClause = {};
    
    // Filtrar por usuário se for Aluno
    if (req.usuario.role === 'Aluno') {
      whereClause.usuario_id = req.usuario.id;
    }

    const total = await Agendamento.count({ where: whereClause });
    const agendados = await Agendamento.count({ 
      where: { ...whereClause, status: 'agendado' } 
    });
    const realizados = await Agendamento.count({ 
      where: { ...whereClause, status: 'realizado' } 
    });
    const cancelados = await Agendamento.count({ 
      where: { ...whereClause, status: 'cancelado' } 
    });

    // Próximos 7 dias
    const proximos7Dias = new Date();
    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
    
    const proximosEventos = await Agendamento.count({
      where: {
        ...whereClause,
        status: 'agendado',
        data_evento: {
          [Op.between]: [new Date(), proximos7Dias]
        }
      }
    });

    // Por tipo
    const porTipo = await Agendamento.findAll({
      where: whereClause,
      attributes: [
        'tipo_evento',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['tipo_evento']
    });

    res.json({
      total,
      agendados,
      realizados,
      cancelados,
      proximos_7_dias: proximosEventos,
      por_tipo: porTipo.reduce((acc, item) => {
        acc[item.tipo_evento] = parseInt(item.get('count'));
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Função auxiliar para agendar notificações
async function agendarNotificacoes(agendamento) {
  try {
    const dataEvento = new Date(agendamento.data_evento);
    const now = new Date();

    // Criar notificações baseadas nas preferências
    const notificacoes = [];

    if (agendamento.lembrete_1_semana) {
      const data1Semana = new Date(dataEvento);
      data1Semana.setDate(data1Semana.getDate() - 7);
      
      if (data1Semana > now) {
        notificacoes.push({
          usuario_id: agendamento.usuario_id,
          processo_id: agendamento.processo_id,
          agendamento_id: agendamento.id,
          tipo: 'lembrete',
          titulo: `Lembrete: ${agendamento.titulo} em 1 semana`,
          mensagem: `Você tem um ${agendamento.tipo} agendado para ${dataEvento.toLocaleDateString('pt-BR')}: ${agendamento.titulo}`,
          canal: agendamento.notificacao_por_email ? 'ambos' : 'sistema',
          data_envio: data1Semana
        });
      }
    }

    if (agendamento.lembrete_2_dias) {
      const data2Dias = new Date(dataEvento);
      data2Dias.setDate(data2Dias.getDate() - 2);
      
      if (data2Dias > now) {
        notificacoes.push({
          usuario_id: agendamento.usuario_id,
          processo_id: agendamento.processo_id,
          agendamento_id: agendamento.id,
          tipo: 'lembrete',
          titulo: `Lembrete: ${agendamento.titulo} em 2 dias`,
          mensagem: `Você tem um ${agendamento.tipo} agendado para ${dataEvento.toLocaleDateString('pt-BR')}: ${agendamento.titulo}`,
          canal: agendamento.notificacao_por_email ? 'ambos' : 'sistema',
          data_envio: data2Dias
        });
      }
    }

    if (agendamento.lembrete_1_dia) {
      const data1Dia = new Date(dataEvento);
      data1Dia.setDate(data1Dia.getDate() - 1);
      
      if (data1Dia > now) {
        notificacoes.push({
          usuario_id: agendamento.usuario_id,
          processo_id: agendamento.processo_id,
          agendamento_id: agendamento.id,
          tipo: 'lembrete',
          titulo: `Lembrete: ${agendamento.titulo} amanhã`,
          mensagem: `Você tem um ${agendamento.tipo} agendado para amanhã (${dataEvento.toLocaleDateString('pt-BR')}): ${agendamento.titulo}`,
          canal: agendamento.notificacao_por_email ? 'ambos' : 'sistema',
          data_envio: data1Dia
        });
      }
    }

    // Criar as notificações no banco
    if (notificacoes.length > 0) {
      await Notificacao.bulkCreate(notificacoes);
    }

  } catch (error) {
    console.error('Erro ao agendar notificações:', error);
  }
}

// Mantém os exports já definidos acima - não precisa redefinir
