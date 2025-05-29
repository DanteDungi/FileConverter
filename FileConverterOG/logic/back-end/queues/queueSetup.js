const { Queue } = require('bull');
const Redis = require('ioredis');

const redisConfig = {
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
};

const conversionQueue = new Queue('file-conversions', {
  redis: redisConfig,
  settings: {
    stalledInterval: 0 // Disable stalled job checking
  }
});

// Event listeners
conversionQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

module.exports = { conversionQueue };