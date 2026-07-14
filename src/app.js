require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mainRouter = require('../routers');

const app = express();

const whitelist = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use('/api', mainRouter);

app.get('/', (req, res) => {
  res.send('Music Social Network API is running...');
});

module.exports = app;