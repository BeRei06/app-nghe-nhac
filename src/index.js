const express = require('express');
const router = express.Router();

const authRouter = require('./auth.router');

const songRouter = require('../../routers/song.router');
const uploadRouter = require('../../routers/upload.router');

router.use('/auth', authRouter);
router.use('/songs', songRouter);
router.use('/upload', uploadRouter);

module.exports = router;