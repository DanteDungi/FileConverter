const { Worker } = require('bull');
const fs = require('fs').promises; // Use fs.promises for async operations
const path = require('path');
const libre = require('libreoffice-convert');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { PDFDocument } = require('pdf-lib');
const conversionQueue = new Queue('file-conversions');

libre.convertAsync = require('util').promisify(libre.convert);

// Worker for processing conversion jobs
const worker = new Worker('file-conversions', async job => {
  const { filePath, targetFormat, originalName } = job.data;
  
  try {
    // Read input file
    const inputBuffer = await fs.readFile(filePath); // Use async readFile
    const inputExt = path.extname(filePath).toLowerCase();
    const outputFileName = `${path.basename(filePath, inputExt)}.${targetFormat}`;
    const outputPath = path.join('converted', outputFileName);
    
    // Create converted directory if not exists
    try {
      await fs.access('converted'); // Check if the directory exists
    } catch {
      await fs.mkdir('converted', { recursive: true }); // Create the directory if it doesn't exist
    }
    
    // Perform conversion based on format
    let outputBuffer;
    
    // Document conversions
    if (['pdf', 'docx', 'txt'].includes(targetFormat)) {
      if (inputExt === '.docx' && targetFormat === 'pdf') {
        outputBuffer = await libre.convertAsync(inputBuffer, '.pdf', undefined);
      } else {
        throw new Error('Document conversion not supported');
      }
    } 
    // Image conversions
    else if (['jpg', 'png', 'webp'].includes(targetFormat)) {
      outputBuffer = await sharp(inputBuffer)
        .toFormat(targetFormat)
        .toBuffer();
    }
    // Audio/video conversions
    else if (['mp3', 'wav'].includes(targetFormat)) {
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .toFormat(targetFormat)
          .on('error', reject)
          .on('end', resolve)
          .save(outputPath);
      });
      return { downloadPath: outputPath };
    } else {
      throw new Error('Unsupported conversion');
    }
    
    // Save the output file
    await fs.writeFile(outputPath, outputBuffer); // Use async writeFile
    
    return { 
      downloadPath: outputPath,
      originalName: path.basename(originalName, inputExt) + '.' + targetFormat
    };
  } catch (err) {
    throw new Error(`Conversion failed: ${err.message}`);
  } finally {
    // Clean up input file
    try {
      await fs.unlink(filePath); // Use async unlink
    } catch (err) {
      console.error('Error cleaning up file:', err);
    }
  }
});

worker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});