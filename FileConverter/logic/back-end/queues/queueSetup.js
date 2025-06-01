const { Queue } = require('bull');
const Redis = require('ioredis');

// Redis configuration for the queue
const redisConfig = {
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
};

// Initialize a queue named 'file-conversions' with Redis connection
const conversionQueue = new Queue('file-conversions', {
  redis: redisConfig,
  settings: {
    stalledInterval: 0 // Disable stalled job checking to prevent retries for stuck jobs
  }
});

// Listen for errors on the queue and log them
conversionQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

module.exports = { conversionQueue };
