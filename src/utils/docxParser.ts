import mammoth from 'mammoth';
import { splitTextIntoChunks } from './pdfParser';

export interface DocxParseResult {
  text: string;
  wordCount: number;
  chunks: string[];
  preview: string;
}

/**
 * Extracts clean readable text from Microsoft Word (.docx, .doc) files
 */
export async function extractTextFromWord(file: File): Promise<DocxParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // 1. Primary: Use mammoth to extract clean text from .docx format
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = (result.value || '').trim();

      if (extractedText && extractedText.length > 5) {
        const words = extractedText.split(/\s+/).filter(Boolean);
        const chunks = splitTextIntoChunks(extractedText, 2500, 300);
        const preview = extractedText.slice(0, 350) + (extractedText.length > 350 ? '...' : '');

        return {
          text: extractedText,
          wordCount: words.length,
          chunks: chunks.length > 0 ? chunks : [extractedText],
          preview
        };
      }
    } catch (mammothErr) {
      console.warn('Mammoth parser error, falling back to stream reader:', mammothErr);
    }

    // 2. Fallback for legacy .doc or unusual binary packaging
    return await fallbackWordReader(file, arrayBuffer);
  } catch (err: any) {
    console.error('Word document extraction error:', err);
    return {
      text: `[Microsoft Word Document: "${file.name}" - Ready for AI Analysis]`,
      wordCount: 0,
      chunks: [`Word document ${file.name}`],
      preview: `Word document ${file.name}`
    };
  }
}

/**
 * Fallback reader extracting text runs from raw bytes
 */
async function fallbackWordReader(file: File, arrayBuffer: ArrayBuffer): Promise<DocxParseResult> {
  try {
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(uint8);

    // Extract printable sequences (runs of printable characters)
    const matches = rawString.match(/[A-Za-z0-9\s.,;:!?'"()\-_/\\@#$%&*+=<>[\]{}]{4,}/g);
    if (matches && matches.length > 0) {
      const filtered = matches
        .map(s => s.trim())
        .filter(s => s.length > 3 && !s.startsWith('xml') && !s.startsWith('w:') && !s.startsWith('xmlns:'))
        .join(' ');

      if (filtered.length > 20) {
        const words = filtered.split(/\s+/).filter(Boolean);
        const chunks = splitTextIntoChunks(filtered, 2500, 300);
        const preview = filtered.slice(0, 350) + (filtered.length > 350 ? '...' : '');
        return {
          text: filtered,
          wordCount: words.length,
          chunks,
          preview
        };
      }
    }

    // Direct text fallback
    const text = await file.text();
    const clean = text.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    const chunks = splitTextIntoChunks(clean, 2500, 300);
    return {
      text: clean || `[Word Document: "${file.name}" attached for analysis]`,
      wordCount: words.length,
      chunks: chunks.length > 0 ? chunks : [clean],
      preview: clean.slice(0, 350) || file.name
    };
  } catch (e) {
    return {
      text: `[Word Document: "${file.name}" attached for analysis]`,
      wordCount: 0,
      chunks: [`Word document ${file.name}`],
      preview: `Word document ${file.name}`
    };
  }
}
