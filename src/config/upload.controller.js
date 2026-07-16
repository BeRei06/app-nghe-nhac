const crypto = require('crypto');
const { CopyrightBlacklist, Song } = require('../models');
const { audioQueue } = require('../config/queue');

// Phase 1: Accept file, perform pre-checks, and queue for processing
exports.uploadAudio = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded.' });
    }

    try {
        // 1. Calculate SHA-256 checksum
        const hash = crypto.createHash('sha256');
        hash.update(req.file.buffer);
        const fileHashSha256 = hash.digest('hex');

        // 2. Check against copyright blacklist
        const blacklisted = await CopyrightBlacklist.findOne({ where: { file_hash_sha256: fileHashSha256 } });
        if (blacklisted) {
            return res.status(403).json({
                message: 'This audio is blacklisted due to copyright infringement.',
                reason: blacklisted.reason
            });
        }

        // 3. Create a preliminary song record to get an ID
        const preliminarySong = await Song.create({
            title: req.body.title || 'Untitled', // Get title from request body
            creator_id: req.user.id,
            status: 'processing', // A new status to indicate it's in the queue
            hls_streaming_url: '', // Placeholder
        });

        // 4. If clean, add the processing task to the queue
        const job = await audioQueue.add('process-audio', {
            songId: preliminarySong.id,
            fileHash: fileHashSha256,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            // IMPORTANT: In a real application, you should upload the file to temporary storage
            // (like S3) first, and only pass the file key/URL in the job data.
            // Avoid passing large buffers directly to Redis.
        });

        // Use 202 Accepted: The request has been accepted for processing, but is not yet complete.
        res.status(202).json({
            message: 'File accepted. Processing has started in the background.',
            jobId: job.id,
            songId: preliminarySong.id,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during file processing.', error: error.message });
    }
};

// GET /upload/status/:song_id
exports.getUploadStatus = async (req, res) => {
    const { song_id } = req.params;

    try {
        const song = await Song.findByPk(song_id, {
            // Chỉ lấy các trường cần thiết cho client
            attributes: ['id', 'status', 'title', 'hls_streaming_url', 'copyright_status']
        });

        if (!song) {
            return res.status(404).json({ message: 'Song not found.' });
        }

        // Trả về trạng thái hiện tại của bài hát từ database.
        // Worker sẽ cập nhật trạng thái này khi xử lý xong (approved/failed).
        res.status(200).json({
            songId: song.id,
            status: song.status,
            details: song // Trả về toàn bộ object để client có thể lấy hls_streaming_url khi 'approved'
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching status.', error: error.message });
    }
};