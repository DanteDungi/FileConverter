const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const conversionController = require('../controllers/conversionController');

// Supported MIME types and their possible conversion targets
const supportedConversions = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf'],
  'application/pdf': ['docx'],
  'image/jpeg': ['png', 'webp'],
  'image/png': ['jpg', 'webp'],
  'video/mp4': ['mp3'],
  'audio/mpeg': ['wav', 'ogg', 'flac']
};

// Route to handle file uploads
router.post('/upload', uploadMiddleware, (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const mimeType = req.file.mimetype;
  // Get possible conversions based on the uploaded file's MIME type
  const availableConversions = supportedConversions[mimeType] || [];

  // Respond with file info and available conversions
  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: {
      originalName: req.file.originalname,
      fileId: req.file.filename,
      mimetype: mimeType,
      size: req.file.size,
      path: req.file.path,
      conversions: availableConversions
    }
  });
});

// Route to initiate file conversion (adds job to queue)
router.post('/convert', (req, res) => {
  // Validate input
  if (!req.body.fileId || !req.body.targetFormat) {
    return res.status(400).json({
      success: false,
      message: 'Missing fileId or targetFormat'
    });
  }

  // Delegate conversion task to controller
  conversionController.convertFile(req, res);
});

// Route to check conversion job status
router.get('/job/:jobId/status', (req, res) => {
  conversionController.getJobStatus(req, res);
});

// Route to download converted files
router.get('/download/:fileId', (req, res) => {
  conversionController.downloadFile(req, res);
});

module.exports = router;