const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const port = process.env.PORT || 5000;
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const http = require('http');
const { NOTI_ACTIONS } = require('./core/contants/constants');

connectDB();

const app = express();

app.use(
  cors({ origin: [process.env.DEV_ORIGIN_URL, process.env.PROD_ORIGIN_URL] })
);

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/answers', require('./routes/answerRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.DEV_ORIGIN_URL,
    methods: ['GET', 'POST'],
  },
});

io.on(NOTI_ACTIONS.CONNECT, (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on(NOTI_ACTIONS.JOIN_ROOM, (userId) => {
    socket.join(userId);
    console.log(`User with ID: ${socket.id} joined room: ${userId}`);
  });

  socket.on(NOTI_ACTIONS.SEND_NOTI, (data) => {
    const { userId, message } = data;
    socket.to(userId).emit(NOTI_ACTIONS.RECEIVE_NOTI, message);
  });

  socket.on(NOTI_ACTIONS.DISCONNECT, () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

server.listen(port, () => console.log(`Server runs on port ${port}`));
