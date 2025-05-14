const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const conversionController = require('../controllers/conversionController');
const path = require('path');

const supportedConversions = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf'],
  'application/pdf': ['docx'],
  'image/jpeg': ['png', 'webp', 'pdf'],
  'image/png': ['jpg', 'webp', 'pdf'],
  'video/mp4': ['mp3'],
  'audio/mpeg': ['wav', 'ogg', 'flac']
};

router.post('/upload', uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const mimeType = req.file.mimetype;
  const availableConversions = supportedConversions[mimeType] || [];

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

router.post('/convert', (req, res) => {
  if (!req.body.fileId || !req.body.targetFormat) {
    return res.status(400).json({
      success: false,
      message: 'Missing fileId or targetFormat'
    });
  }

  conversionController.convertFile(req, res);
});

module.exports = router;
