class NotificacaoService {
  constructor(io) {
    this.io = io;
  }

  // Notifica todos inscritos em um canal de processo
  enviarParaProcesso(processoId, mensagem) {
    this.io.to(`processo_${processoId}`).emit('notificacao', {
      processoId,
      mensagem,
      data: new Date()
    });
  }

  // Notifica um usuário específico
  enviarParaUsuario(usuarioId, mensagem) {
    this.io.to(`usuario_${usuarioId}`).emit('notificacao_pessoal', {
      mensagem,
      data: new Date()
    });
  }
}

module.exports = NotificacaoService;