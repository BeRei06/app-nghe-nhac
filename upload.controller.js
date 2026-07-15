const crypto = require('crypto');
const { CopyrightBlacklist } = require('../models'); // Giả định file này sẽ được chuyển vào /controllers
const { audioQueue } = require('../config/queue');

// Phase 1: Checksum and Copyright Blacklist check
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

        // 3. Nếu file sạch, đẩy tác vụ vào hàng đợi để xử lý ngầm
        const job = await audioQueue.add('process-audio', {
            fileHash: fileHashSha256,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            // Lưu ý: Trong thực tế, bạn nên tải file lên một bộ nhớ tạm
            // như S3 trước, sau đó chỉ truyền key của file đó vào job.
            // Tránh truyền cả buffer của file vào Redis.
        });

        res.status(200).json({
            message: 'File accepted. Processing has started in the background.',
            jobId: job.id,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during file processing.', error: error.message });
    }
};

// GET /upload/status/:song_id
exports.getUploadStatus = async (req, res) => {
    res.status(501).json({ message: 'Not implemented' });
};