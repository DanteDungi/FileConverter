const { Queue } = require('bullmq');

// Redis configuration for the queue
const redisConfig = {
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
};

// Initialize a queue named 'file-conversions' with Redis connection
const conversionQueue = new Queue('file-conversions', {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs
    attempts: 3,          // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Listen for errors on the queue and log them
conversionQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

module.exports = { conversionQueue };