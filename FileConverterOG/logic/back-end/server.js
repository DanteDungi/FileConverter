const express = require('express');
const cors = require('cors');
const app = express();

// 1. Middleware FIRST - CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 2. Route logging middleware - logs each request method and path with timestamp
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 3. Import routes from conversionRoutes.js
const conversionRoutes = require('./routes/conversionRoutes');

// 4. Mount routes under /api prefix
app.use('/api', conversionRoutes);

// 5. Start server on port 3000 and log available endpoints
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('POST /api/upload - Upload file');
  console.log('POST /api/convert - Start conversion job');
  console.log('GET /api/job/:jobId/status - Check job status');
  console.log('GET /api/download/:fileId - Download converted file');
});