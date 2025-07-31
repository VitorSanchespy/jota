const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('Conectado ao servidor Socket.io');
    socket.emit('inscrever', { processoId: 1, usuarioId: 123 });
});

socket.on('notificacao', (data) => {
    console.log('Nova notificação:', data);
});

socket.on('disconnect', () => {
    console.log('Desconectado');
});