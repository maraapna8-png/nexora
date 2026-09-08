import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for image attachments and document text payloads
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Lazy GoogleGenAI initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Model registry
const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Nexora 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Ultra-low latency responses, instant streaming & quick document parsing.',
    recommendedFor: 'Fastest responses, everyday writing & live voice dictation'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Nexora 3.8 Flash',
    badge: 'Fast & Smart',
    description: 'High-speed multimodal reasoning for complex writing & rich analysis.',
    recommendedFor: 'Everyday writing, PDF queries & instant analysis'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Nexora 3.1 Pro',
    badge: 'Deep Reasoning',
    description: 'State-of-the-art capability for complex multi-page synthesis, research & intricate reasoning.',
    recommendedFor: 'Complex legal/technical PDFs, advanced code & comprehensive essays'
  }
];

// Helper to construct system instructions based on style, language, and length
function buildSystemInstruction(
  language?: string,
  style?: string,
  length: string = 'Short',
  customInstructions?: string
): string {
  let prompt = `You are Nexora (Nexora AI), an elite, lightning-fast AI writing assistant and document-analysis engine.
Your primary capabilities include:
1. Deep document & PDF analysis: reading text, identifying structure, extracting key insights, answering specific questions, summarizing complex texts, and generating structured study notes & MCQs.
2. Multimodal image understanding: reading diagrams, handwritten notes, printed text, infographics, screenshots, and visual layouts.
3. Versatile writing: creating essays, articles, professional reports, emails, social content, video scripts, stories, and academic summaries.
4. Multilingual excellence: fluent in English, Urdu (اردو), Hindi (हिंदी), Arabic (العربية), Punjabi (ਪੰਜਾਬੀ / پنجابی), and other global languages. When the user asks in a language or requests a specific language (e.g. Urdu, Hindi), respond naturally, accurately, and idiomatically in that language—never use clumsy literal translations.
5. Rich Markdown output: utilize clear headings (##, ###), bullet lists, bold text for key terms, tables where helpful, code blocks with language tags, and blockquotes for highlights.

CRITICAL INSTRUCTION FOR CONCISENESS & SPEED:
- Default to SHORT, CRISP, and DIRECT answers.
- Get straight to the answer immediately without conversational fluff, pleasantries, or preamble (e.g., do NOT start with "Certainly!", "Sure, here is...", or "In today's fast-paced world...").
- Use bullet points, bold key terms, and concise sentences.
- Only provide extensive long-form writing if the user explicitly asks for an essay, full report, or lengthy story.`;

  if (language && language !== 'Auto-detect') {
    prompt += `\nStrict Output Language: Respond in ${language}. Ensure natural vocabulary and native phrasing.`;
  }
  if (style) {
    prompt += `\nWriting Tone & Style: ${style}.`;
  }
  if (length === 'Detailed') {
    prompt += `\nDepth: Provide comprehensive, detailed, and thorough explanations with full context.`;
  } else {
    // Default or Short
    prompt += `\nResponse Length: Short & Concise. Keep answers compact, high-value, and direct.`;
  }
  if (customInstructions) {
    prompt += `\nAdditional Custom Directives: ${customInstructions}`;
  }

  return prompt;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 2. Get available models
app.get('/api/models', (req: Request, res: Response) => {
  res.json({ models: AVAILABLE_MODELS });
});

// 3. Streaming Chat Endpoint (Server-Sent Events)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  // Set SSE headers with no-buffering for sub-second first-token response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const {
      messages,
      model = 'gemini-3.1-flash-lite',
      language,
      writingStyle,
      responseLength,
      customInstruction
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Messages array is required' })}\n\n`);
      res.end();
      return;
    }

    const ai = getGenAIClient();
    const systemInstruction = buildSystemInstruction(language, writingStyle, responseLength, customInstruction);

    // Format contents for @google/genai SDK
    const formattedContents = messages.map((m: any) => {
      const parts: any[] = [];

      // If message has attachments (images or document context)
      if (m.attachments && Array.isArray(m.attachments)) {
        for (const att of m.attachments) {
          if (att.type === 'image' && att.dataUrl) {
            const matches = att.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
                }
              });
            }
          } else if (att.type === 'pdf' || att.type === 'document' || att.extractedText) {
            const docText = att.extractedText || '';
            if (docText.trim()) {
              parts.push({
                text: `[DOCUMENT ATTACHMENT: "${att.name}"]\n--- BEGIN DOCUMENT CONTENT ---\n${docText.slice(0, 75000)}\n--- END DOCUMENT CONTENT ---\n`
              });
            }
          }
        }
      }

      if (m.content) {
        parts.push({ text: m.content });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: parts.length > 0 ? parts : [{ text: ' ' }]
      };
    });

    // Primary model and fallback queue
    const requestedModel = AVAILABLE_MODELS.some(m => m.id === model) ? model : 'gemini-3.1-flash-lite';
    const modelsToTry = [requestedModel];
    if (requestedModel !== 'gemini-3.1-flash-lite') {
      modelsToTry.push('gemini-3.1-flash-lite');
    }
    if (requestedModel !== 'gemini-3.8-flash' && !modelsToTry.includes('gemini-3.8-flash')) {
      modelsToTry.push('gemini-3.8-flash');
    }

    let streamStarted = false;
    let lastError: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: targetModel,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            streamStarted = true;
            res.write(`data: ${JSON.stringify({ text, model: targetModel })}\n\n`);
          }
        }

        if (streamStarted) {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
      } catch (streamErr: any) {
        lastError = streamErr;
        console.warn(`Streaming attempt failed on ${targetModel}:`, streamErr?.message || streamErr);
        if (streamStarted) {
          // If we already sent chunks, do not restart stream
          res.write(`data: ${JSON.stringify({ error: streamErr.message || 'Stream interrupted' })}\n\n`);
          res.end();
          return;
        }
        // Otherwise continue to next model in fallback list
      }
    }

    // If all models failed before streaming
    res.write(`data: ${JSON.stringify({ error: lastError?.message || 'AI service is temporarily busy. Please retry.' })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Gemini Stream Critical Error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'AI service error encountered' })}\n\n`);
    res.end();
  }
});

// 4. Single-Turn Generation & Quick Actions Endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      action, // 'rewrite' | 'summarize' | 'translate' | 'mcq' | 'notes' | 'explain' | 'grammar'
      actionParam, // e.g. target language or style
      contextText,
      imageDataUrl,
      model = 'gemini-3.8-flash'
    } = req.body;

    if (!prompt && !contextText && !imageDataUrl) {
      return res.status(400).json({ error: 'Prompt or content is required' });
    }

    const ai = getGenAIClient();

    let fullPrompt = '';
    let systemInstruction = buildSystemInstruction();

    if (action === 'rewrite') {
      fullPrompt = `Please rewrite the following text according to the style "${actionParam || 'Professional'}".
Maintain core meaning while elevating clarity, vocabulary, and flow.

TEXT:
"""
${prompt || contextText}
"""`;
    } else if (action === 'summarize') {
      fullPrompt = `Please summarize the following content using the format "${actionParam || 'Key Takeaways'}".
Provide a clear, structured, and insightful summary with bullet points and bold highlights.

CONTENT:
"""
${prompt || contextText}
"""`;
    } else if (action === 'translate') {
      fullPrompt = `Translate the following text into natural, idiomatic ${actionParam || 'Urdu'}.
Preserve tone, nuances, and technical terms accurately.

ORIGINAL TEXT:
"""
${prompt || contextText}
"""`;
    } else if (action === 'mcq') {
      const count = actionParam || '10';
      fullPrompt = `Based on the following content, generate ${count} high-quality Multiple Choice Questions (MCQs) for exam/test prep.
For each question:
1. State the question clearly.
2. Provide 4 options (A, B, C, D).
3. State the correct answer with a concise explanation.

CONTENT:
"""
${prompt || contextText}
"""`;
    } else if (action === 'notes') {
      fullPrompt = `Create clean, organized, high-yield study notes from the following text/material.
Include:
- Key Concepts & Definitions
- Bulleted Summaries of Main Topics
- Important Takeaways & Quick-Revision Points

MATERIAL:
"""
${prompt || contextText}
"""`;
    } else {
      fullPrompt = prompt;
    }

    const parts: any[] = [];

    if (imageDataUrl) {
      const matches = imageDataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    if (contextText && !fullPrompt.includes(contextText)) {
      parts.push({
        text: `Context Reference:\n"""\n${contextText.slice(0, 60000)}\n"""\n\n`
      });
    }

    parts.push({ text: fullPrompt });

    const requestedModel = AVAILABLE_MODELS.some(m => m.id === model) ? model : 'gemini-3.1-flash-lite';
    const modelsToTry = [requestedModel];
    if (requestedModel !== 'gemini-3.1-flash-lite') modelsToTry.push('gemini-3.1-flash-lite');
    if (requestedModel !== 'gemini-3.8-flash' && !modelsToTry.includes('gemini-3.8-flash')) modelsToTry.push('gemini-3.8-flash');

    let responseText = '';
    let usedModel = requestedModel;
    let genError: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        if (response.text) {
          responseText = response.text;
          usedModel = targetModel;
          break;
        }
      } catch (e) {
        genError = e;
        console.warn(`Generate attempt failed on ${targetModel}:`, e);
      }
    }

    if (!responseText) {
      throw genError || new Error('Failed to generate content');
    }

    res.json({
      text: responseText,
      model: usedModel
    });
  } catch (err: any) {
    console.error('Gemini Generate Error:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate response from Gemini AI'
    });
  }
});

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
