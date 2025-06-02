const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const sharp = require('sharp');
const { execSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const ffmpeg = require('fluent-ffmpeg');

const convertDocxToPdf = async (inputPath, outputPath) => {
  const libreOfficeCmd = process.platform === 'win32' ? 'soffice' : 'libreoffice';
  const outputDir = path.dirname(outputPath);
  const baseName = path.parse(inputPath).name;

  execSync(`"${libreOfficeCmd}" --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`, {
    stdio: 'pipe'
  });

  const possiblePdfPath = path.join(outputDir, `${baseName}.pdf`);
  await fs.rename(possiblePdfPath, outputPath);
};

const convertPdfToDocx = async (inputPath, outputPath) => {
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
        .map(line => new Paragraph({ children: [new TextRun(line)] }))
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
};

const convertAudio = (inputPath, outputPath, targetFormat) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(targetFormat)
      .on('error', reject)
      .on('end', resolve)
      .save(outputPath);
  });
};

exports.convertFile = async (req, res) => {
  const { fileId, targetFormat } = req.body;

  const uploadsDir = path.join(__dirname, './uploads');
  const convertedDir = path.join(__dirname, './converted');
  const inputPath = path.join(uploadsDir, fileId);
  const outputFileName = `${path.parse(fileId).name}.${targetFormat}`;
  const outputPath = path.join(convertedDir, outputFileName);

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

    case type.mime?.startsWith('image/'):
      await sharp(inputBuffer)
        .toFormat(targetFormat)
        .toFile(outputPath);
      break;

    // default:
    //   throw new Error('Unsupported conversion');
  }

  res.json({
    success: true,
    downloadPath: `/api/download/${outputFileName}`,
    fileId: outputFileName
  });
};

exports.uploadFile = async (req, res) => {
  res.json({
    success: true,
    message: "File uploaded successfully",
    file: {
      originalName: req.file.originalname,
      fileId: req.file.filename,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    }
  });
};

exports.downloadFile = async (req, res) => {
  const filePath = path.join(__dirname, '../converted', req.params.fileId);
  res.download(filePath, err => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  });
};
