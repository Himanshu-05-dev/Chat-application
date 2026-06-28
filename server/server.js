const express = require('express');
require('dotenv').config();
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { Server } = require('socket.io');

// Connect to the database
connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(server, {
    cors: { origin: '*' }
});

const UserSocketMap = {};

// Export io and UserSocketMap early to avoid circular dependency issues when routers/controllers are required
module.exports = { io, UserSocketMap };

const userRouter = require('./Routes/User.Route');
const messageRouter = require('./Routes/Message.Route');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'token'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use('/api/status', (req, res) => res.send('Server is live'));
app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter);

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('User Connected', userId);

    if (userId) UserSocketMap[userId] = socket.id;

    io.emit('getOnlineUsers', Object.keys(UserSocketMap));

    socket.on('disconnect', () => {
        console.log('User Disconnected', userId);
        delete UserSocketMap[userId];
        io.emit('getOnlineUsers', Object.keys(UserSocketMap));
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});