const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const connectDB = require('./config/db');
const {
  initTags,
  initUsers,
  initQuestions,
  initAnswers,
  initUserLikes,
} = require('./core/services/init-database');
const { resetDatabase } = require('./core/services/reset-database');
const { errorHandler } = require('./middleware/errorMiddleware');
const { NOTI_ACTIONS } = require('./core/contants/constants');
const port = process.env.PORT || 443;

connectDB();

const app = express();

app.use(cors({ origin: [process.env.ORIGIN_URL, process.env.CMS_URL] }));

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/answers', require('./routes/answerRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN_URL,
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
    const userId = data.userId;
    socket.to(userId).emit(NOTI_ACTIONS.RECEIVE_NOTI, data);
  });

  socket.on(NOTI_ACTIONS.DISCONNECT, () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

server.listen(port, () => console.log(`Server runs on port ${port}`));

// resetDatabase();
// initTags();
// initUsers();
// initQuestions();
// initAnswers();
// initUserLikes();
