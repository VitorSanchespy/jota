const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const arquivoController = require('../controllers/arquivoControllers');


router.post('/upload', 
  authMiddleware,
  arquivoController.uploadArquivo
);
// Listar arquivos anexados a um processo
router.get('/processo/:processo_id', 
  authMiddleware,
  arquivoController.listarArquivos
);

// Listar arquivos enviados por um usuário
router.get('/usuario/:usuario_id', 
  authMiddleware,
  arquivoController.listarArquivosUsuario
);

// Anexar arquivo já enviado a um processo
router.post('/anexar', 
  authMiddleware,
  arquivoController.anexarArquivoExistente
);

// Soft delete de arquivo
router.delete('/:id', authMiddleware, arquivoController.softDeleteArquivo);

// Rota para desvincular arquivo de um processo
router.put('/desvincular/:id', authMiddleware, arquivoController.desvincularArquivo);



module.exports = router;