const express = require('express');
const cors = require('cors');
const app = express();

// 1. Middleware FIRST - CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 2. Import routes from conversionRoutes.js
const conversionRoutes = require('./routes/conversionRoutes');

// 3. Mount routes under /api prefix
app.use('/api', conversionRoutes);

// 4. Route logging middleware - logs each request method and path with timestamp
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 5. Start server on port 3000 and log available endpoints
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('POST /api/upload');
  console.log('POST /api/convert');
  console.log('GET /api/download/:fileId');
});
