const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;

app.get('/', (req, res) => {
  res.send('Server is running.');
});

io.on('connection', (socket) => {
  socket.emit('me', socket.id);

  socket.on('disconnect', () => {
    socket.broadcast.emit('callEnded');
  });

  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('callUser', {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on('answerCall', ({ signal, to }) => {
    io.to(to).emit('callAccepted', signal);
  });

  socket.on('sendIceCandidate', ({ candidate, to }) => {
    io.to(to).emit('receiveIceCandidate', { candidate });
  });
});

server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));