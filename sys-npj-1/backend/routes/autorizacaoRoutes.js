const express = require('express');
const router = express.Router();
const authController = require('../controllers/autorizacaoControllers');
const { validate,  handleValidation } = require('../middleware/validationMiddleware');
const verificarToken = require('../middleware/authMiddleware');
const verificarTokenReset = require('../middleware/resetPasswordMiddleware');

// registrar novo usuário
router.post('/registrar', [
  validate('registrarUsuario'),
  handleValidation
], authController.registrar);

// Login de usuário
router.post('/login', [
  validate('loginUsuario'),
  handleValidation
], authController.login);

// Compatível com frontend: POST /auth/esqueci-senha
router.post('/esqueci-senha', authController.solicitarRecuperacao);
router.post('/solicitar-recuperacao', authController.solicitarRecuperacao);
router.post('/redefinir-senha', verificarTokenReset, authController.redefinirSenha);

// perfil do usuário autenticado 
router.get('/perfil', verificarToken, authController.perfil);

// Endpoint para refresh token
router.post('/refresh', authController.refreshToken);

module.exports = router;