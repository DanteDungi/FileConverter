const { Worker } = require('bullmq');
const fs = require('fs').promises;
const path = require('path');
const libre = require('libreoffice-convert');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { Queue } = require('bullmq');

// Initialize queue for file conversions
const conversionQueue = new Queue('file-conversions');

// Promisify libreoffice convert function for async/await usage
libre.convertAsync = require('util').promisify(libre.convert);

// Create a BullMQ Worker listening on the 'file-conversions' queue
const worker = new Worker('file-conversions', async job => {
  const { filePath, targetFormat, originalName } = job.data;

  try {
    const inputBuffer = await fs.readFile(filePath);
    const inputExt = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, inputExt);
    const outputFileName = `${baseName}.${targetFormat}`;
    const outputDir = path.join(__dirname, '../converted');
    const outputPath = path.join(outputDir, outputFileName);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    let outputBuffer;

    // === Document conversions ===
    if (inputExt === '.docx' && targetFormat === 'pdf') {
      // Convert DOCX to PDF using LibreOffice
      outputBuffer = await libre.convertAsync(inputBuffer, '.pdf', undefined);
    } else if (inputExt === '.pdf' && targetFormat === 'docx') {
      // Convert PDF to DOCX by extracting text and creating new DOCX file
      const pdfParse = require('pdf-parse');
      const docx = require('docx');
      const { Document, Packer, Paragraph, TextRun } = docx;

      const pdfData = await pdfParse(inputBuffer);
      const text = pdfData.text;

      const doc = new Document({
        sections: [{
          properties: {},
          children: text.split('\n')
            .filter(line => line.trim())
            .map(line => new Paragraph({ children: [new TextRun(line)] }))
        }]
      });

      outputBuffer = await Packer.toBuffer(doc);
    }

    // === Image conversions ===
    else if (['.jpg', '.jpeg', '.png', '.webp'].includes(inputExt) && ['jpg', 'png', 'webp'].includes(targetFormat)) {
      outputBuffer = await sharp(inputBuffer)
        .toFormat(targetFormat)
        .toBuffer();
    }

    // === Audio/Video conversions ===
    else if ((inputExt === '.mp3' || inputExt === '.wav') && ['mp3', 'wav'].includes(targetFormat)) {
      // Convert audio format using ffmpeg, save directly to file
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .toFormat(targetFormat)
          .on('error', reject)
          .on('end', resolve)
          .save(outputPath);
      });
      return {
        downloadPath: outputPath,
        originalName: `${path.basename(originalName, inputExt)}.${targetFormat}`
      };
    }

    // === MP4 to MP3 extraction ===
    else if (inputExt === '.mp4' && targetFormat === 'mp3') {
      // Extract audio from MP4 and save as MP3
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .noVideo()
          .audioCodec('libmp3lame')
          .format('mp3')
          .on('error', reject)
          .on('end', resolve)
          .save(outputPath);
      });
      return {
        downloadPath: outputPath,
        originalName: `${path.basename(originalName, inputExt)}.mp3`
      };
    }

    else {
      throw new Error(`Unsupported conversion from ${inputExt} to ${targetFormat}`);
    }

    // Save the converted file buffer if applicable
    if (outputBuffer) {
      await fs.writeFile(outputPath, outputBuffer);
    }

    return {
      downloadPath: outputPath,
      originalName: `${path.basename(originalName, inputExt)}.${targetFormat}`
    };

  } catch (err) {
    // If conversion fails, throw error so job fails in queue
    throw new Error(`Conversion failed: ${err.message}`);
  } finally {
    // Clean up uploaded file after processing
    try {
      await fs.unlink(filePath);
    } catch (cleanupErr) {
      console.error('Error cleaning up file:', cleanupErr.message);
    }
  }
});

// Log when jobs complete successfully
worker.on('completed', job => {
  console.log(`✅ Job ${job.id} completed`);
});

// Log errors when jobs fail
worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});
