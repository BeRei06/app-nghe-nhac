const express = require('express');
const router = express.Router();

// Sprint 1
const authRouter = require('./auth.router');
router.use('/auth', authRouter);

// Sprint 2
const songRouter = require('./song.router');
const uploadRouter = require('./upload.router');
router.use('/songs', songRouter);
router.use('/upload', uploadRouter);

// Sprint 3
const postRouter = require('./post.router');
const feedRouter = require('./feed.router');
router.use('/posts', postRouter);
router.use('/feed', feedRouter);

// Sprint 4
const groupRouter = require('./group.router');
router.use('/groups', groupRouter);

// Sprint 5 & 6 will be added here
// const libraryRouter = require('./library.router');
// ... and so on for all other routers

module.exports = router;