const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const sharp = require('sharp');
const { execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

// Supported conversions mapping
const SUPPORTED_CONVERSIONS = {
  'image/jpeg': ['png', 'webp'],
  'image/png': ['jpg', 'webp'],
  'application/pdf': ['docx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf'],
  'audio/mpeg': ['wav', 'ogg', 'flac'],
  'video/mp4': ['mp3']
};

// Helper: Check if a file exists (async)
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Convert DOCX to PDF using LibreOffice headless mode
const convertDocxToPdf = async (inputPath, outputPath) => {
  try {
    // Command varies by platform
    const libreOfficeCmd = process.platform === 'win32' ? 'soffice' : 'libreoffice';
    const outputDir = path.dirname(outputPath);
    const baseName = path.parse(inputPath).name;

    // Run LibreOffice CLI conversion
    execSync(`"${libreOfficeCmd}" --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`, {
      stdio: 'pipe'
    });

    const possiblePdfPath = path.join(outputDir, `${baseName}.pdf`);
    const pdfExists = await fs.access(possiblePdfPath).then(() => true).catch(() => false);

    if (!pdfExists) {
      throw new Error(`Expected PDF file not found at ${possiblePdfPath}`);
    }

    // Rename if outputPath differs from default LibreOffice output
    if (possiblePdfPath !== outputPath) {
      await fs.rename(possiblePdfPath, outputPath);
    }

  } catch (err) {
    console.error('LibreOffice conversion error:', err.message);
    throw new Error('DOCX to PDF conversion failed. Is LibreOffice installed and on your PATH?');
  }
};

// Convert PDF to DOCX by extracting text and writing a new DOCX file
const convertPdfToDocx = async (inputPath, outputPath) => {
  try {
    const pdfParse = require('pdf-parse');
    const docx = require('docx');
    const { Document, Packer, Paragraph, TextRun } = docx;

    // Read PDF buffer and extract text
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Create DOCX document with extracted text
    const doc = new Document({
      sections: [{
        properties: {},
        children: text
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => new Paragraph({
            children: [new TextRun(line)]
          }))
      }]
    });

    // Pack and write the DOCX file
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);

    return outputPath;
  } catch (err) {
    console.error('Conversion error details:', err);
    throw new Error('PDF to DOCX conversion failed. Please try a different conversion method or tool.');
  }
};

// Convert audio files to target format using ffmpeg
const convertAudio = (inputPath, outputPath, targetFormat) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(targetFormat)
      .on('error', reject)
      .on('end', resolve)
      .save(outputPath);
  });
};

// Extract MP3 audio from MP4 video using ffmpeg
const convertMp4ToMp3 = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .format('mp3')
      .on('error', reject)
      .on('end', resolve)
      .save(outputPath);
  });
};

// Main file conversion handler
exports.convertFile = async (req, res) => {
  try {
    const { fileId, targetFormat } = req.body;

    if (!fileId || !targetFormat) {
      return res.status(400).json({ error: 'Missing fileId or targetFormat' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const convertedDir = path.join(__dirname, '../converted');
    const inputPath = path.join(uploadsDir, fileId);
    const outputFileName = `${path.parse(fileId).name}.${targetFormat}`;
    const outputPath = path.join(convertedDir, outputFileName);

    if (!(await fileExists(inputPath))) {
      return res.status(404).json({ error: 'Original file not found' });
    }

    await fs.mkdir(convertedDir, { recursive: true });

    // Run your conversion logic here (call worker or convert inline) and produce outputPath

    // After conversion, send the converted file directly
    const outputBuffer = await fs.readFile(outputPath);

    // Set headers so browser treats response as file download
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    return res.send(outputBuffer);

  } catch (err) {
    console.error('Conversion error:', err);
    return res.status(500).json({ error: 'Conversion failed' });
  }
};


// File upload handler (redundant with middleware but included)
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
      'image/jpeg': ['png', 'webp', 'pdf'],
      'image/png': ['jpg', 'webp', 'pdf'],
      'video/mp4': ['mp3']
    };

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      detectedMimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };

    const availableConversions = supportedConversions[fileInfo.mimetype] || [];

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
    const filePath = path.join(__dirname, '../converted', req.params.fileId);

    // Check if requested file exists
    if (!(await fileExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Send file as download to client
    res.download(filePath, err => {
      if (err) {
        console.error('Download failed:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
};
