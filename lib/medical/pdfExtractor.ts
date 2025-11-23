import fs from 'fs/promises';
import path from 'path';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Dynamic import with proper error handling
    let pdfParse: any;
    
    try {
      const module = await import('pdf-parse');
      pdfParse = module.default || module;
    } catch (importError) {
      // If dynamic import fails, try using createRequire
      const { createRequire } = await import('module');
      const require = createRequire(path.resolve(process.cwd()));
      pdfParse = require('pdf-parse');
    }
    
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
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

