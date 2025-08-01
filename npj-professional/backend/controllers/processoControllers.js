
const {
  processoModels: Processo,
  usuariosModels: Usuario,
  atualizacoesProcessoModels: AtualizacoesProcesso,
  usuariosProcessoModels: UsuariosProcesso,
  arquivoModels: Arquivo,
  materiaAssuntoModels: MateriaAssunto,
  faseModels: Fase,
  diligenciaModels: Diligencia,
  localTramitacaoModels: LocalTramitacao
} = require('../models/indexModels');

    // Atualizar processo existente
    exports.atualizarProcessos = async (req, res) => {
        try {
            const { processo_id } = req.params;
            const dadosAtualizar = req.body;
            if (!processo_id) {
                return res.status(400).json({ erro: 'processo_id é obrigatório na URL.' });
            }
            
            const processo = await Processo.findByPk(processo_id);
            if (!processo) {
                return res.status(404).json({ erro: 'Processo não encontrado.' });
            }

            // Descobrir campos alterados
            const camposAlterados = [];
            for (const campo in dadosAtualizar) {
                if (processo[campo] !== undefined && processo[campo] !== dadosAtualizar[campo]) {
                    camposAlterados.push(`${campo}: '${processo[campo]}' → '${dadosAtualizar[campo]}'`);
                }
            }
            await processo.update(dadosAtualizar);

            // Grava histórico na tabela atualizacoes_processo
            if (camposAlterados.length > 0) {
                await AtualizacoesProcesso.create({
                    processo_id: processo.id,
                    usuario_id: req.usuario.id,
                    tipo_atualizacao: 'Edição',
                    descricao: `Alterações: ${camposAlterados.join('; ')}`
                });
            }

            res.json({ mensagem: 'Processo atualizado com sucesso', processo });
        } catch (error) {
            console.error('Erro ao atualizar processo:', error);
            res.status(500).json({ erro: 'Erro ao atualizar processo.' });
        }
    }

    // Criar novo processo
    exports.criarProcessos = async (req, res) => {
        try {
            const {
                numero_processo,
                descricao,
                status,
                materia_assunto_id,
                local_tramitacao_id,
                sistema,
                fase_id,
                diligencia_id,
                idusuario_responsavel,
                data_encerramento,
                observacoes,
                num_processo_sei,
                assistido,
                contato_assistido
            } = req.body;
            if (!numero_processo || !status || !materia_assunto_id || !local_tramitacao_id || !sistema || !fase_id || !diligencia_id || !idusuario_responsavel || !contato_assistido) {
                return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
            }
            const processo = await Processo.create({
                numero_processo,
                descricao,
                status,
                materia_assunto_id,
                local_tramitacao_id,
                sistema,
                fase_id,
                diligencia_id,
                idusuario_responsavel,
                data_encerramento,
                observacoes,
                num_processo_sei,
                assistido,
                contato_assistido
            });
            res.status(201).json(processo);
        } catch (error) {
            res.status(500).json({ erro: error.message });
        }
    }

    // Vincular usuário a um processo
    exports.vincularUsuarioProcessos = async (req, res) => {
        try {
            const { processo_id, usuario_id, role } = req.body;
            if (!processo_id || !usuario_id || !role) {
                return res.status(400).json({ erro: 'processo_id, usuario_id e role são obrigatórios' });
            }
            if (!['Aluno', 'Professor'].includes(role)) {
                return res.status(400).json({ erro: 'Role inválida' });
            }
            // Cria vínculo na tabela de associação
            await UsuariosProcesso.create({ processo_id, usuario_id });
            res.json({ mensagem: 'Usuário atribuído com sucesso' });
        } catch (error) {
            console.error('Erro ao atribuir usuario:', error);
            if (error.status === 409) {
                return res.status(409).json({ erro: error.message });
            }
            res.status(500).json({ erro: error.message });
        }
    }

    // Listar todos os processos
    exports.listarProcessos = async (req, res) => {
        try {
            let where = {};
            const role = (req.usuario.role || '').toLowerCase();
            console.log('[listarProcessos] Usuário:', req.usuario?.id, '| Role:', req.usuario?.role, '| Nome:', req.usuario?.nome);
            if (role === 'aluno') {
                // Busca processos em que o aluno está vinculado
                const vinculos = await UsuariosProcesso.findAll({ where: { usuario_id: req.usuario.id } });
                const ids = vinculos.map(v => v.processo_id);
                where = { id: ids };
                console.log('[listarProcessos] Aluno, ids vinculados:', ids);
            }
            const processos = await Processo.findAll({
                where,
                include: [
                    { model: AtualizacoesProcesso, as: 'atualizacoes' },
                    { model: Arquivo, as: 'arquivos' },
                    { model: UsuariosProcesso, as: 'usuariosProcesso' },
                    { model: MateriaAssunto, as: 'materiaAssunto' },
                    { model: Fase, as: 'fase' },
                    { model: Diligencia, as: 'diligencia' },
                    { model: LocalTramitacao, as: 'localTramitacao' }
                ]
            });
            console.log('[listarProcessos] Total processos retornados:', processos.length);
            res.json(processos);
        } catch (error) {
            console.error('[listarProcessos] Erro:', error);
            res.status(500).json({ erro: error.message });
        }
    }

    // Buscar processos pelo numero
    exports.buscarProcessos = async (req, res) => {
        try {
            const filtros = { ...req.query };
            const pagina = parseInt(filtros.pagina) || 1;
            const porPagina = parseInt(filtros.porPagina) || 10;
            delete filtros.pagina;
            delete filtros.porPagina;
            // Monta where dinâmico
            const where = {};
            // Busca pelo número do processo (parcial ou exata)
            if (filtros.numero_processo) {
                where.numero_processo = { [Op.like]: `%${filtros.numero_processo}%` };
            }
            if (filtros.status) where.status = filtros.status;
            if (filtros.usuario_id) {
                // Permitir filtro por qualquer usuário vinculado
                const vinculos = await UsuariosProcesso.findAll({ where: { usuario_id: filtros.usuario_id } });
                const ids = vinculos.map(v => v.processo_id);
                where.id = ids;
            }
            const { count, rows } = await Processo.findAndCountAll({
                where,
                include: [
                    { model: AtualizacoesProcesso, as: 'atualizacoes' },
                    { model: Arquivo, as: 'arquivos' },
                    { model: UsuariosProcesso, as: 'usuariosProcesso' },
                    { model: MateriaAssunto, as: 'materiaAssunto' },
                    { model: Fase, as: 'fase' },
                    { model: Diligencia, as: 'diligencia' },
                    { model: LocalTramitacao, as: 'localTramitacao' }
                ],
                limit: porPagina,
                offset: (pagina - 1) * porPagina
            });
            res.json({ total: count, processos: rows });
        } catch (error) {
            res.status(500).json({ erro: error.message });
        }
    }

    // Listar meus processos (para alunos e professores)
    exports.listarMeusProcessos = async (req, res) => {
        try {
            if (!['Aluno', 'Professor'].includes(req.usuario.role)) {
                return res.status(403).json({ erro: 'Acesso permitido apenas para alunos e professores' });
            }
            const vinculos = await UsuariosProcesso.findAll({ where: { usuario_id: req.usuario.id } });
            const ids = vinculos.map(v => v.processo_id);
            const processos = await Processo.findAll({
                where: { id: ids },
                include: [
                    { model: AtualizacoesProcesso, as: 'atualizacoes' },
                    { model: Arquivo, as: 'arquivos' },
                    { model: UsuariosProcesso, as: 'usuariosProcesso' },
                    { model: MateriaAssunto, as: 'materiaAssunto' },
                    { model: Fase, as: 'fase' },
                    { model: Diligencia, as: 'diligencia' },
                    { model: LocalTramitacao, as: 'localTramitacao' }
                ]
            });
            return res.json(processos);
        } catch (error) {
            console.error('Erro ao listar meus processos:', error);
            return res.status(500).json({ erro: 'Erro ao buscar processos do usuário.' });
        }
    }

    // Remover usuário de um processo (generalizado)
    exports.removerUsuarioProcessos = async (req, res) => {
        try {
            const { processo_id, usuario_id } = req.body;
            if (!processo_id || !usuario_id) {
                return res.status(400).json({ erro: 'processo_id e usuario_id são obrigatórios' });
            }
            if (!["Professor", "Admin"].includes(req.usuario.role)) {
                return res.status(403).json({ erro: 'Apenas professores ou admins podem remover usuários' });
            }
            const count = await UsuariosProcesso.destroy({ where: { processo_id, usuario_id } });
            if (count === 0) {
                return res.status(400).json({ erro: 'Usuário não está atribuído a este processo' });
            }
            return res.json({ mensagem: 'Usuário removido do processo com sucesso' });
        } catch (error) {
            console.error('Erro ao remover usuário:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // listar usuários vinculados a um processo (generalizado)
    exports.listarUsuariosPorProcessos = async (req, res) => {
        try {
            const { processo_id } = req.params;
            const { pagina = 1, porPagina = 10 } = req.query;
            if (!processo_id || isNaN(Number(processo_id))) {
                return res.status(400).json({ erro: 'ID do processo inválido' });
            }
            const vinculos = await UsuariosProcesso.findAll({
                where: { processo_id },
                include: [{ model: Usuario, as: 'usuario' }],
                limit: Number(porPagina),
                offset: (Number(pagina) - 1) * Number(porPagina)
            });
            const usuariosComRole = vinculos.map(v => ({
                nome: v.usuario?.nome,
                role: v.usuario?.role_id === 3 ? 'Professor(a)' : 'Aluno(a)'
            }));
            return res.json(usuariosComRole);
        } catch (error) {
            console.error('Erro ao listar usuários do processo:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Detalhar processo com todas as informações possíveis
    exports.detalharProcessos = async (req, res) => {
        try {
            const { processo_id } = req.params;
            if (!processo_id) {
                return res.status(400).json({ erro: 'processo_id é obrigatório' });
            }
            // Busca o processo com todos os relacionamentos
            const processo = await Processo.findByPk(processo_id, {
                include: [
                    { model: AtualizacoesProcesso, as: 'atualizacoes', include: [
                        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email', 'telefone', 'role_id'] }
                    ] },
                    { model: Arquivo, as: 'arquivos' },
                    { model: UsuariosProcesso, as: 'usuariosProcesso', include: [
                        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email', 'telefone', 'role_id'] }
                    ] },
                    { model: MateriaAssunto, as: 'materiaAssunto' },
                    { model: Fase, as: 'fase' },
                    { model: Diligencia, as: 'diligencia' },
                    { model: LocalTramitacao, as: 'localTramitacao' }
                ]
            });
            if (!processo) {
                return res.status(404).json({ erro: 'Processo não encontrado' });
            }
            // Buscar nome do usuário criador
            let usuarioCriador = null;
            if (processo.idusuario_responsavel) {
                usuarioCriador = await Usuario.findByPk(processo.idusuario_responsavel, {
                    attributes: ['id', 'nome', 'email', 'telefone', 'role_id']
                });
            }
            res.json({
                ...processo.toJSON(),
                usuarioCriador
            });
        } catch (error) {
            console.error('Erro ao detalhar processo:', error);
            res.status(500).json({ erro: 'Erro ao buscar detalhes do processo.' });
        }
    };



