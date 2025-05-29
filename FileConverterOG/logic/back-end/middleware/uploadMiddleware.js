// Basic minimal middleware - only focused on accepting the file
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Super simple storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// Create multer instance with NO file filter
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Export a simple wrapped middleware
module.exports = function(req, res, next) {
  console.log('Starting file upload with minimal middleware');
  console.log('Request headers:', req.headers);
  
  upload.single('file')(req, res, function(err) {
    if (err) {
      console.error('Upload error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ error: 'No file received' });
    }
    
    console.log('File uploaded successfully:', req.file);
    next();
  });
};