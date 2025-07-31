const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
