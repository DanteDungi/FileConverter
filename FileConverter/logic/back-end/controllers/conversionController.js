const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const sharp = require('sharp');
const { execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

// Supported conversions
const SUPPORTED_CONVERSIONS = {
  'image/jpeg': ['png', 'webp'],
  'image/png': ['jpg', 'webp'],
  'application/pdf': ['docx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf'],
  'audio/mpeg': ['wav', 'ogg', 'flac'],
  'video/mp4': ['mp3']
};

// Helper to check file existence
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// DOCX to PDF
const convertDocxToPdf = async (inputPath, outputPath) => {
  try {
    const libreOfficeCmd = process.platform === 'win32' ? 'soffice' : 'libreoffice';
    const outputDir = path.dirname(outputPath);
    const baseName = path.parse(inputPath).name;

    execSync(`"${libreOfficeCmd}" --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`, {
      stdio: 'pipe'
    });

    const possiblePdfPath = path.join(outputDir, `${baseName}.pdf`);
    const pdfExists = await fs.access(possiblePdfPath).then(() => true).catch(() => false);

    if (!pdfExists) {
      throw new Error(`Expected PDF file not found at ${possiblePdfPath}`);
    }

    if (possiblePdfPath !== outputPath) {
      await fs.rename(possiblePdfPath, outputPath);
    }

  } catch (err) {
    console.error('LibreOffice conversion error:', err.message);
    throw new Error('DOCX to PDF conversion failed. Is LibreOffice installed and on your PATH?');
  }
};

// PDF to DOCX
const convertPdfToDocx = async (inputPath, outputPath) => {
  try {
    const pdfParse = require('pdf-parse');
    const docx = require('docx');
    const { Document, Packer, Paragraph, TextRun } = docx;

    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

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

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);

    return outputPath;
  } catch (err) {
    console.error('Conversion error details:', err);
    throw new Error('PDF to DOCX conversion failed. Please try a different conversion method or tool.');
  }
};

// Audio conversion
const convertAudio = (inputPath, outputPath, targetFormat) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(targetFormat)
      .on('error', reject)
      .on('end', resolve)
      .save(outputPath);
  });
};

// MP4 to MP3 conversion
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

    const inputBuffer = await fs.readFile(inputPath);
    const type = await fileTypeFromBuffer(inputBuffer) || { mime: req.file?.mimetype };

    switch (true) {
      case type.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && targetFormat === 'pdf':
        await convertDocxToPdf(inputPath, outputPath);
        break;

      case type.mime === 'application/pdf' && targetFormat === 'docx':
        await convertPdfToDocx(inputPath, outputPath);
        break;

      case type.mime === 'audio/mpeg':
        await convertAudio(inputPath, outputPath, targetFormat);
        break;

      case type.mime === 'video/mp4' && targetFormat === 'mp3':
        await convertMp4ToMp3(inputPath, outputPath);
        break;

      case type.mime?.startsWith('image/'):
        await sharp(inputBuffer)
          .toFormat(targetFormat)
          .toFile(outputPath);
        break;

      default:
        return res.status(400).json({ error: 'Unsupported conversion' });
    }

    res.json({
      success: true,
      downloadPath: `/api/download/${outputFileName}`,
      fileId: outputFileName
    });

  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({
      error: 'Conversion failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

// File download handler
exports.downloadFile = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../converted', req.params.fileId);

    if (!(await fileExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

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
