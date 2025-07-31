require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const slowDown = require('express-slow-down');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const app = express();

module.exports = app; // Exporta o app para testes

// Configuração básica de segurança
app.use(helmet());
// express.json() será movido para depois da rota de upload
app.use(
  mongoSanitize({
    replaceWith: '_'
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Configuração do CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Se usar cookies
};
app.use(cors(corsOptions));

const auxTablesRoutes = require('./routes/tabelaAuxiliarRoutes');
app.use('/api/aux', auxTablesRoutes);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.example.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'cdn.example.com']
      }
    },
    hsts: {
      maxAge: 63072000, // 2 anos em segundos
      includeSubDomains: true,
      preload: true
    }
  })
);

// Header adicional contra XSS
app.use((req, res, next) => {
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

//server
const server = http.createServer(app); // Cria servidor HTTP
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Altere para seu frontend
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  // Inscreve o usuário em canais
  socket.on('inscrever', (data) => {
    if (data.processoId) {
      socket.join(`processo_${data.processoId}`);
    }
    if (data.usuarioId) {
      socket.join(`usuario_${data.usuarioId}`);
    }
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:'Muitas requisições - tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);


const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs:(used, req) => {
    const delayAfter = req.slowDown.limit; // Pega o valor de delayAfter
    return (used - delayAfter) * 500; // Aumenta 500ms por requisição excedente
  }
});
app.use(speedLimiter);

// Conexão com o banco de dados
require('./config/config');


// Cria a pasta 'uploads' se não existir
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(uploadDir));

// Adicionar express.json() ANTES das rotas (exceto para upload de arquivos)
app.use((req, res, next) => {
  // Pular express.json() apenas para a rota de upload de arquivos
  if (req.path === '/api/arquivos/upload' && req.method === 'POST') {
    return next();
  }
  express.json()(req, res, next);
});

// Rota de arquivos
app.use('/api/arquivos', require('./routes/arquivoRoutes'));

// Demais rotas
const ProcessoController = require('./controllers/processoControllers');
app.use('/auth', require('./routes/autorizacaoRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/processos', require('./routes/processoRoutes'));
app.use('/api/atualizacoes', require('./routes/atualizacaoProcessoRoutes'));
app.use('/api/agendamentos', require('./routes/agendamentoRoutes'));
// Tratamento de erros
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const errorHandler = require('./middleware/errorHandlerMiddleware');
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  // Inicializar sistema de notificações
  const { inicializarCronJobs } = require('./services/notificationScheduler');
  inicializarCronJobs();
  
  server.listen(PORT, () => {
    // Server started
  });
}

// Função para criar um novo processo
app.createProcess = async (token, processData) => {
  return await apiRequest('/api/processos/novo', {
    method: 'POST',
    token,
    body: processData
  });
}