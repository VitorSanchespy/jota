const winston = require('winston');
const path = require('path');

// Configuração do logger
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Configuração dos transportes
const transports = [
  // Log de erro
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: logFormat
  }),
  
  // Log combinado (todos os níveis)
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: logFormat
  }),

  // Log de auditoria para ações sensíveis
  new winston.transports.File({
    filename: path.join(logDir, 'audit.log'),
    level: 'info',
    maxsize: 10485760, // 10MB
    maxFiles: 10,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.timestamp({
          format: 'HH:mm:ss'
        }),
        winston.format.printf(info => 
          `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Função específica para logs de auditoria
logger.audit = (action, details) => {
  logger.info('AUDIT', {
    action,
    details,
    timestamp: new Date().toISOString(),
    type: 'audit'
  });
};

// Função para logs de performance
logger.performance = (operation, duration, details = {}) => {
  logger.info('PERFORMANCE', {
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString(),
    type: 'performance'
  });
};

// Função para logs de segurança
logger.security = (event, details) => {
  logger.warn('SECURITY', {
    event,
    details,
    timestamp: new Date().toISOString(),
    type: 'security'
  });
};

// Função para logs de usuário
logger.user = (userId, action, details = {}) => {
  logger.info('USER_ACTION', {
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
    type: 'user_action'
  });
};

// Middleware para logs de requisições
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP_REQUEST', logData);
    } else {
      logger.info('HTTP_REQUEST', logData);
    }
  });

  next();
};

module.exports = logger;