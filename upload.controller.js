const crypto = require('crypto');
const { CopyrightBlacklist } = require('../models');

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

        // 3. If clean, proceed to save file and schedule worker (simulated for now)
        console.log(`File hash ${fileHashSha256} is clean. Ready for processing.`);

        res.status(200).json({
            message: 'File received and passed initial copyright check.',
            fileHash: fileHashSha256,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during file processing.', error: error.message });
    }
};

// GET /upload/status/:song_id
exports.getUploadStatus = async (req, res) => {
    res.status(501).json({ message: 'Not implemented' });
};