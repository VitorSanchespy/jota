const { atualizacoesProcessoModels: AtualizacoesProcesso, usuariosModels: Usuario, processoModels: Processo, arquivoModels: Arquivo } = require('../models/indexModels');

// Criação de uma nova atualização de processo
exports.adicionarAtualizacaoProcessos = async (req, res) => {
        try {
            const { processo_id, descricao, tipo_atualizacao, arquivos_id } = req.body;
            if (!processo_id || !tipo_atualizacao) {
                return res.status(400).json({ erro: 'processo_id e tipo_atualizacao são obrigatórios.' });
            }
            const usuario_id = req.usuario.id;
            const novaAtualizacao = await AtualizacoesProcesso.create({
                processo_id,
                usuario_id,
                tipo_atualizacao,
                descricao: tipo_atualizacao === 'informacao' ? descricao : null,
                arquivos_id: tipo_atualizacao === 'arquivo' ? arquivos_id : null
            });
            // Retorna a atualização já com os relacionamentos
            const atualizacaoCompleta = await AtualizacoesProcesso.findByPk(novaAtualizacao.id, {
                include: [
                    { model: Usuario, as: 'usuario' },
                    { model: Processo, as: 'processo' },
                    { model: Arquivo, as: 'arquivo' }
                ]
            });
            res.status(201).json(atualizacaoCompleta);
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao adicionar atualização ao processo.' });
        }
}

// Listar atualizações de um processo específico
exports.listarAtualizacaoProcesso = async (req, res) => {
  try {
    const { processo_id } = req.params;
    const updates = await AtualizacoesProcesso.findAll({
      where: { processo_id },
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Processo, as: 'processo' },
        { model: Arquivo, as: 'arquivo' }
      ],
      order: [['data_atualizacao', 'DESC']]
    });
    res.json(updates);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar atualizações.' });
  }
};

// Listar todas as atualizações (para dashboard)
exports.listarTodasAtualizacoes = async (req, res) => {
  try {
    const limite = req.query.limite || 10;
    const updates = await AtualizacoesProcesso.findAll({
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Processo, as: 'processo' },
        { model: Arquivo, as: 'arquivo' }
      ],
      order: [['data_atualizacao', 'DESC']],
      limit: parseInt(limite)
    });
    res.json(updates);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar atualizações.' });
  }
};

// remover Atualizacao do processo
exports.removerAtualizacaoProcessos = async (req, res) => {
        try {
            const { processo_id, atualizacao_id } = req.params;
            if (req.usuario.role !== 'Professor' && req.usuario.role !== 'Admin') {
                return res.status(403).json({ erro: 'Apenas professores ou administradores podem remover atualizações' });
            }
            const count = await AtualizacoesProcesso.destroy({ where: { id: atualizacao_id, processo_id } });
            if (count === 0) {
                return res.status(404).json({ erro: 'Atualização não encontrada' });
            }
            res.json({ mensagem: 'Atualização removida com sucesso' });
        } catch (error) {
            res.status(500).json({ erro: error.message });
        }
}

