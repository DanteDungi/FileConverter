const express = require('express');
const cors = require('cors');
const app = express();

// 1. Middleware FIRST
app.use(cors());
app.use(express.json());

// 2. Import routes
const conversionRoutes = require('./routes/conversionRoutes');

// 3. Mount routes
app.use('/api', conversionRoutes);

// 4. Route logging middleware (add this)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 5. Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('POST /api/upload');
  console.log('POST /api/convert');
  console.log('GET /api/download/:fileId');
});