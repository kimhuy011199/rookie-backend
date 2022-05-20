const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const port = process.env.PORT || 5000;
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(
  cors({ origin: [process.env.DEV_ORIGIN_URL, process.env.PROD_ORIGIN_URL] })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/answers', require('./routes/answerRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.use(errorHandler);

app.listen(port, () => console.log(`Server runs on port ${port}`));
