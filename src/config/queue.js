const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// Use a single connection for both Queue and Worker for efficiency
const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null
});

// 1. Create a queue to receive tasks
const audioQueue = new Queue('audio-processing', { connection });

// 2. Create a worker to process tasks from the queue
const audioWorker = new Worker('audio-processing', async job => {
    const { Song } = require('../models'); // Import model bên trong worker
    console.log(`[Worker] Processing job #${job.id} for song upload.`);
    const { fileHash, originalname, songId } = job.data;

    try {
        // --- BACKGROUND PROCESSING LOGIC ---
        // TODO:
        // 1. Lấy file tạm (ví dụ: từ S3) bằng key được truyền vào job data.
        // 2. Dùng fluent-ffmpeg để chuyển đổi audio sang định dạng HLS (.m3u8).
        // 3. Dùng các công cụ fingerprinting để tạo `fingerprint_code` và `acoustid_id`.
        // 4. Cập nhật bản ghi 'Song' và 'AudioFingerprint' trong database với URL, duration, và dữ liệu fingerprint mới.
        
        console.log(`[Worker] Simulating HLS conversion for ${originalname} (Hash: ${fileHash})`);
        
        // Giả lập thời gian xử lý
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        // Khi thành công:
        const hlsUrl = `path/to/processed/${songId}/playlist.m3u8`; // URL ví dụ
        await Song.update(
            { status: 'approved', hls_streaming_url: hlsUrl, duration: 210 }, // duration ví dụ
            { where: { id: songId } }
        );
        // TODO: Tạo bản ghi AudioFingerprint tại đây...

        console.log(`[Worker] Finished processing job #${job.id}.`);
    } catch (error) {
        console.error(`[Worker] Error processing job #${job.id} for song ${songId}:`, error.message);
        // Khi thất bại, cập nhật trạng thái bài hát thành 'failed'
        await Song.update({ status: 'failed' }, { where: { id: songId } });
        // Ném lỗi ra ngoài để BullMQ ghi nhận job này là 'failed'
        throw error;
    }
}, { connection });

// --- Worker Event Listeners for Monitoring ---
audioWorker.on('completed', job => {
  console.log(`[Worker] Job #${job.id} has completed successfully.`);
});

audioWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job #${job.id} has failed with error: ${err.message}`);
});

module.exports = {
    audioQueue,
    audioWorker // Export worker for graceful shutdown if needed
};