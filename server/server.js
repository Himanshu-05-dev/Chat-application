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

// Export server along with socket properties early to resolve circular dependencies and support Vercel deployments
module.exports = server;
module.exports.io = io;
module.exports.UserSocketMap = UserSocketMap;

const userRouter = require('./Routes/User.Route');
const messageRouter = require('./Routes/Message.Route');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cors({
    origin: process.env.CLIENT_URL,
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


if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    });
}

// Export server for vercel (CommonJS)
module.exports = server;