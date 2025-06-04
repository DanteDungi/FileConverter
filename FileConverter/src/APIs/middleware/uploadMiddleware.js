// Basic minimal middleware - only focused on accepting the file
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists before accepting files
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define multer storage with destination folder and unique filename generation
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename using timestamp + random number + original extension
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// Create multer instance with no file filter and 100MB file size limit
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max file size
});

// Export middleware wrapper to handle single file upload under key 'file'
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