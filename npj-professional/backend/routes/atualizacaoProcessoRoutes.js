const express = require('express');
const router = express.Router();
const processUpdatesController = require('../controllers/atualizacaoProcessoControllers');
const authMiddleware = require('../middleware/authMiddleware');
const { listar } = require('../controllers/tabelaAuxiliarControllers');
const { adicionarAtualizacaoProcessos, 
    removerAtualizacaoProcessos, listarAtualizacaoProcesso, listarTodasAtualizacoes} = require
    ('../controllers/atualizacaoProcessoControllers');

// Listar todas as atualizações (para dashboard)
router.get('/', authMiddleware, listarTodasAtualizacoes);
// Listar atualizações de um processo
router.get('/:processo_id', authMiddleware, listarAtualizacaoProcesso);
// Criar atualização
router.post('/', authMiddleware, adicionarAtualizacaoProcessos);
// Remover atualização
router.delete('/:processo_id/atualizacoes/:atualizacao_id', 
    authMiddleware, removerAtualizacaoProcessos);

module.exports = router;
