const app = require('express')();
const server = require('http').createServer(app);
const cors = require('cors');


const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('Running');
});

app.get('/config', (req, res) => {
    res.json({ SERVER_PORT: PORT });
    console.log(`Notified port ${PORT} to client`);
})

io.on('connection', (socket) => {
    socket.emit('me', socket.id);

    socket.on('disconnect', () => {
        socket.broadcast.emit('callEnded');
    })

    socket.on('callUser', ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit('callUser', { signal: signalData, from, name });
    })

    socket.on('answerCall', (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    })

    socket.on("connect_error", (error) => {
        console.log(`connect_error due to ${error.message}`);
    })
})

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})