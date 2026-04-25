import fs from 'fs/promises';
import path from 'path';

type PdfParseResult = { text: string };
type PdfParseFunction = (data: Buffer) => Promise<PdfParseResult>;

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    let pdfParse: PdfParseFunction;
    
    try {
      const pdfModule = await import('pdf-parse');
      pdfParse = (pdfModule.default || pdfModule) as PdfParseFunction;
    } catch (importError) {
      console.warn('Falling back to require for pdf-parse:', importError);
      const { createRequire } = await import('module');
      const require = createRequire(path.resolve(process.cwd()));
      pdfParse = require('pdf-parse') as PdfParseFunction;
    }
    
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error: unknown) {
    console.error('Error extracting text from PDF:', error);
    const message = error instanceof Error ? error.message : 'Unknown error while extracting PDF';
    throw new Error(`Failed to extract text from PDF: ${message}`);
  }
}

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(filePath);
  }
  
  // For images, we would need OCR (Tesseract.js)
  // For now, return empty string for non-PDF files
  // TODO: Implement OCR for images
  if (mimeType.startsWith('image/')) {
    throw new Error('Image OCR not yet implemented. Please upload PDF files for automatic extraction.');
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}
