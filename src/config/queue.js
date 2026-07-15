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
    console.log(`[Worker] Processing job #${job.id} for song upload.`);
    const { fileHash, originalname, songId } = job.data;

    // --- BACKGROUND PROCESSING LOGIC ---
    // TODO:
    // 1. Retrieve the temporary file (e.g., from S3) using a key passed in the job data.
    // 2. Use fluent-ffmpeg to convert the audio to HLS (.m3u8) format.
    // 3. Use fingerprinting tools to generate `fingerprint_code` and `acoustid_id`.
    // 4. Update the 'Song' and 'AudioFingerprint' records in the database with the new URLs, duration, and fingerprint data.
    //    Example: await Song.update({ status: 'approved', hls_streaming_url: '...' }, { where: { id: songId } });
    console.log(`[Worker] Simulating HLS conversion for ${originalname} (Hash: ${fileHash})`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000)); 

    console.log(`[Worker] Finished processing job #${job.id}.`);
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