const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const auxTablesController = require('../controllers/tabelaAuxiliarControllers');
// Models removidos, use apenas o controller

router.use(authMiddleware);

// Matéria/Assunto
router.get('/materia-assunto', auxTablesController.listar('materia_assunto'));
router.post('/materia-assunto', auxTablesController.adicionar('materia_assunto'));
router.get('/materia-assunto/buscar', auxTablesController.buscarPorNome('materia_assunto'));

// Fase
router.get('/fase', auxTablesController.listar('fase'));
router.post('/fase', auxTablesController.adicionar('fase'));
router.get('/fase/buscar', auxTablesController.buscarPorNome('fase'));

// Diligência
router.get('/diligencia', auxTablesController.listar('diligencia'));
router.post('/diligencia', auxTablesController.adicionar('diligencia'));
router.get('/diligencia/buscar', auxTablesController.buscarPorNome('diligencia'));

// Local de Tramitação
router.get('/local-tramitacao', auxTablesController.listar('local_tramitacao'));
router.post('/local-tramitacao', auxTablesController.adicionar('local_tramitacao'));
router.get('/local-tramitacao/buscar', auxTablesController.buscarPorNome('local_tramitacao'));

module.exports = router;
