const { verificarToken } = require('../utils/authUtils');

const verificarTokenReset = async (req, res, next) => {
    const token = req.body.token || req.query.token;
    
    if (!token) {
        return res.status(401).json({ erro: 'Token de redefinição não fornecido' });
    }

    try {
        const decoded = verificarToken(token);
        
        // Verificar se o token tem o propósito correto
        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({ erro: 'Tipo de token inválido' });
        }

        // Adicionar informações do usuário à requisição
        req.usuario = { 
            id: decoded.id,
            purpose: decoded.purpose
        };
        
        next();
    } catch (error) {
        if (error.message === 'Token expirado') {
            return res.status(401).json({ erro: 'Token de redefinição expirado' });
        }
        res.status(401).json({ erro: 'Token de redefinição inválido' });
    }
};

module.exports = verificarTokenReset;