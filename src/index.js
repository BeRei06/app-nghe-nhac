const express = require('express');
const router = express.Router();

const authRouter = require('./auth.router');
const songRouter = require('../../routers/song.router');
const uploadRouter = require('../../routers/upload.router');

module.exports = router;