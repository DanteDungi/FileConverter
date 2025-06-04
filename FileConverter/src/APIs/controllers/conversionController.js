const fs = require('fs').promises;
const path = require('path');
const { conversionQueue } = require('../queue/queueSetup');

// Helper: Check if a file exists (async)
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Add conversion job to queue
exports.convertFile = async (req, res) => {
  try {
    const { fileId, targetFormat } = req.body;

    if (!fileId || !targetFormat) {
      return res.status(400).json({ error: 'Missing fileId or targetFormat' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const inputPath = path.join(uploadsDir, fileId);

    // Check if original file exists
    if (!(await fileExists(inputPath))) {
      return res.status(404).json({ error: 'Original file not found' });
    }

    // Add conversion job to queue
    const job = await conversionQueue.add('convert-file', {
      filePath: inputPath,
      targetFormat: targetFormat,
      originalName: fileId
    });

    // Return job ID so client can check status
    res.json({
      success: true,
      message: 'Conversion job added to queue',
      jobId: job.id
    });

  } catch (err) {
    console.error('Error adding conversion job:', err);
    return res.status(500).json({ error: 'Failed to queue conversion job' });
  }
};

// Check job status
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await conversionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const status = await job.getState();
    
    let response = {
      jobId: job.id,
      status: status,
      progress: job.progress
    };

    // If job is completed, include download info
    if (status === 'completed') {
      response.downloadReady = true;
      response.result = job.returnvalue;
    }

    // If job failed, include error info
    if (status === 'failed') {
      response.error = job.failedReason;
    }

    res.json(response);

  } catch (err) {
    console.error('Error checking job status:', err);
    res.status(500).json({ error: 'Failed to check job status' });
  }
};

// File upload handler
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Supported conversions for reporting purposes
    const supportedConversions = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf'],
      'application/pdf': ['docx'],
      'image/jpeg': ['png', 'webp'],
      'image/png': ['jpg', 'webp'],
      'video/mp4': ['mp3'],
      'audio/mpeg': ['wav', 'ogg', 'flac']
    };

    const availableConversions = supportedConversions[req.file.mimetype] || [];

    // Return details of uploaded file and possible conversions
    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        originalName: req.file.originalname,
        fileId: req.file.filename,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        conversions: availableConversions
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: err.message
    });
  }
};

// File download handler to send converted files
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(__dirname, '../converted', fileId);

    // Check if requested file exists
    if (!(await fileExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Send file as download to client
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download failed:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
    });

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
};