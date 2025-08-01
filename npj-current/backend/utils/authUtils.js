const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configurações de segurança
const saltRounds = 12;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '24h';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
const JWT_ALGORITHM = 'HS256';
const crypto = require('crypto');

async function gerarHash(senha) {
    try {
        return await bcrypt.hash(senha, saltRounds);
    } catch (error) {
        throw new Error('Falha ao processar senha');
    }
}

async function verificarSenha(senha, hash) {
    try {
        return await bcrypt.compare(senha, hash);
    } catch (error) {
        throw new Error('Falha na autenticação');
    }
}


function gerarToken(usuario) {
    try {
        const token = jwt.sign(
            {
                id: usuario.id,
                role: usuario.role,
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.JWT_SECRET,
            {
                expiresIn: TOKEN_EXPIRATION,
                algorithm: JWT_ALGORITHM
            }
        );
        return token;
    } catch (error) {
        throw new Error('Falha ao gerar token de acesso');
    }
}

function gerarRefreshToken(usuario) {
    try {
        // Gera um token aleatório seguro
        const refreshToken = crypto.randomBytes(64).toString('hex');
        // Opcional: pode salvar no banco de dados junto ao usuário
        return refreshToken;
    } catch (error) {
        throw new Error('Falha ao gerar refresh token');
    }
}

function verificarToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: [JWT_ALGORITHM]
        });
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        }
        throw new Error('Token inválido');
    }
}

// Função para validar refresh token (exemplo, precisa de persistência real)
// Aqui apenas simula validação, mas o ideal é salvar no banco
function validarRefreshToken(token, usuario) {
    // Exemplo: buscar no banco se o refreshToken está ativo para o usuário
    // Aqui só retorna true para exemplo
    return true;
}

module.exports = {
    gerarHash,
    verificarSenha,
    gerarToken,
    verificarToken,
    gerarRefreshToken,
    validarRefreshToken
};