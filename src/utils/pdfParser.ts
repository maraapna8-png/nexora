import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker dynamically
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface PDFParseResult {
  text: string;
  pageCount: number;
  chunks: string[];
  preview: string;
}

/**
 * Extracts clean text from an uploaded PDF file and splits it into searchable chunks
 */
export async function extractTextFromPDF(file: File): Promise<PDFParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: true,
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (pageStr) {
          pageTexts.push(`[Page ${i}]\n${pageStr}`);
        }
      } catch (pageErr) {
        console.warn(`Error extracting text from page ${i}:`, pageErr);
      }
    }

    const fullText = pageTexts.join('\n\n');
    const chunks = splitTextIntoChunks(fullText, 2500, 300);
    const preview = fullText.slice(0, 350) + (fullText.length > 350 ? '...' : '');

    return {
      text: fullText,
      pageCount,
      chunks,
      preview
    };
  } catch (err: any) {
    console.error('PDF parsing error, attempting fallback raw text extractor:', err);
    // Fallback: Read as text/binary for basic text streams
    const fallbackResult = await fallbackTextReader(file);
    return fallbackResult;
  }
}

/**
 * Simple text fallback for text-heavy or plain format documents
 */
async function fallbackTextReader(file: File): Promise<PDFParseResult> {
  try {
    const text = await file.text();
    // Filter printable characters
    const cleanText = text.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
    const chunks = splitTextIntoChunks(cleanText, 2500, 300);
    return {
      text: cleanText || `[Extracted ${file.name} - File ready for AI analysis]`,
      pageCount: 1,
      chunks: chunks.length > 0 ? chunks : [cleanText],
      preview: cleanText.slice(0, 350) || file.name
    };
  } catch (e) {
    return {
      text: `[Document ${file.name} uploaded for contextual analysis]`,
      pageCount: 1,
      chunks: [`Document ${file.name}`],
      preview: `Document ${file.name}`
    };
  }
}

/**
 * Splits large document text into overlapping chunks
 */
export function splitTextIntoChunks(text: string, chunkSize: number = 2500, overlap: number = 300): string[] {
  if (!text || text.length <= chunkSize) {
    return text ? [text] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    // Try to find a sentence or newline break near end
    let breakPoint = text.lastIndexOf('\n', end);
    if (breakPoint <= start || breakPoint < end - 400) {
      breakPoint = text.lastIndexOf('. ', end);
    }
    if (breakPoint <= start || breakPoint < end - 400) {
      breakPoint = end;
    } else {
      breakPoint += 1;
    }

    chunks.push(text.slice(start, breakPoint).trim());
    start = breakPoint - overlap;
  }

  return chunks;
}
