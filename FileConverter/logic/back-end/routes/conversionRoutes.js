const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const conversionController = require('../controllers/conversionController');

// File upload endpoint
router.post('/upload', uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    }
  });
});

// File conversion endpoint (NEW)
router.post('/convert', (req, res) => {
  // Basic validation
  if (!req.body.fileId || !req.body.targetFormat) {
    return res.status(400).json({
      success: false,
      message: 'Missing fileId or targetFormat'
    });
  }

  // Forward to controller
  conversionController.convertFile(req, res);
});

module.exports = router;