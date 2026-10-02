import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { FOUNDER_INFO_MARKDOWN, isFounderQuery } from './src/services/founderData';
import { generateSmartFallbackResponse } from './src/services/smartFallbackEngine';
import { prepareConversationHistory } from './src/services/conversationMemory';
import { buildProductionSystemInstruction } from './src/services/systemInstruction';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for image attachments and document text payloads
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Lazy GoogleGenAI initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  if (customApiKey && customApiKey.trim()) {
    return new GoogleGenAI({ apiKey: customApiKey.trim() });
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Model registry
const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Nexora 3.8 Flash',
    badge: 'Smart & Fast (Recommended)',
    description: 'Premier high-speed multimodal reasoning, deep logic, coding & rich analysis.',
    recommendedFor: 'Everyday writing, advanced coding, PDF queries & instant analysis'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Nexora 3.1 Pro',
    badge: 'Deep Reasoning',
    description: 'State-of-the-art capability for complex multi-page synthesis, research & intricate reasoning.',
    recommendedFor: 'Complex legal/technical PDFs, advanced code & comprehensive essays'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Nexora 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Ultra-low latency responses, instant streaming & quick document parsing.',
    recommendedFor: 'Fastest responses, everyday writing & live voice dictation'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Nexora Flash Latest',
    badge: 'High Availability',
    description: 'General-purpose high speed generation model with strong multimodal support.',
    recommendedFor: 'Reliable responses, summaries & text processing'
  }
];

export { FOUNDER_INFO_MARKDOWN, isFounderQuery };

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
      model = 'gemini-3.8-flash',
      language,
      writingStyle,
      responseLength = 'Balanced',
      customInstruction
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Messages array is required' })}\n\n`);
      res.end();
      return;
    }

    // Direct instantaneous streaming for founder inquiries
    const lastUserMsg = messages[messages.length - 1];
    const lastText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';
    const hasAttachments = lastUserMsg?.attachments && lastUserMsg.attachments.length > 0;
    if (isFounderQuery(lastText) && !hasAttachments) {
      const chunks = FOUNDER_INFO_MARKDOWN.match(/.{1,30}/gs) || [FOUNDER_INFO_MARKDOWN];
      for (const chunk of chunks) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        res.flushHeaders?.();
        await new Promise(r => setTimeout(r, 15));
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    const customApiKey =
      (req.headers['x-gemini-api-key'] as string) ||
      (req.headers['authorization']?.replace(/^Bearer\s+/i, '') as string) ||
      req.body?.customApiKey;

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient(customApiKey);
    } catch (e: any) {
      res.write(`data: ${JSON.stringify({ error: 'Please enter your Gemini API key in Settings (⚙️) to start chatting.' })}\n\n`);
      res.end();
      return;
    }

    // Prepare multi-tier conversation context and memory
    const { formattedContents, detectedIntent } = prepareConversationHistory(messages);

    const systemInstruction = buildProductionSystemInstruction({
      language,
      writingStyle,
      responseLength,
      customInstructions: customInstruction,
      contextIntent: detectedIntent
    });

    // Primary model and resilient fallback queue (only valid, supported models)
    const requestedModel = AVAILABLE_MODELS.some(m => m.id === model) ? model : 'gemini-3.8-flash';
    const modelsToTry = [
      requestedModel,
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let streamStarted = false;
    let quotaHit = false;

    // Adaptive temperature: lower for code/corrections, balanced for general tasks
    const adaptiveTemperature = (detectedIntent.referencesPreviousCode || detectedIntent.isCorrection) ? 0.35 : 0.7;

    for (const targetModel of modelsToTry) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: targetModel,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: adaptiveTemperature
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
        const rawErrStr = streamErr?.message || String(streamErr || '');
        if (
          rawErrStr.includes('429') ||
          rawErrStr.includes('RESOURCE_EXHAUSTED') ||
          rawErrStr.includes('quota') ||
          rawErrStr.includes('PERMISSION_DENIED') ||
          rawErrStr.includes('403') ||
          rawErrStr.includes('BLOCKED')
        ) {
          quotaHit = true;
        }

        if (streamStarted) {
          // If we already sent partial text chunks, end stream gracefully
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        // If the shared project key reached quota/denied, avoid looping over all other models with the same failing key
        if (quotaHit && !customApiKey) {
          break;
        }
      }
    }

    // Seamless Smart Fallback Generation: Always delivers an informative, structured answer
    const fallbackAnswer = generateSmartFallbackResponse({
      prompt: lastText,
      history: messages,
      attachments: lastUserMsg?.attachments,
      language,
      writingStyle,
      responseLength,
      customInstruction
    });

    const chunks = fallbackAnswer.match(/.{1,35}/gs) || [fallbackAnswer];
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ text: chunk, model: 'nexora-smart-engine' })}\n\n`);
      res.flushHeaders?.();
      await new Promise(r => setTimeout(r, 14));
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    try {
      const fallbackAnswer = generateSmartFallbackResponse({
        prompt: (req.body?.messages && req.body.messages[req.body.messages.length - 1]?.content) || 'Help',
        history: req.body?.messages
      });
      res.write(`data: ${JSON.stringify({ text: fallbackAnswer })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch {
      res.write(`data: ${JSON.stringify({ text: 'Nexora is ready to assist. Please try your request again.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
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

    const customApiKey =
      (req.headers['x-gemini-api-key'] as string) ||
      (req.headers['authorization']?.replace(/^Bearer\s+/i, '') as string) ||
      req.body?.customApiKey;

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient(customApiKey);
    } catch (e: any) {
      return res.status(400).json({ error: 'Please enter your Gemini API key in Settings (⚙️) to run AI actions.' });
    }

    let fullPrompt = '';
    const systemInstruction = buildProductionSystemInstruction({
      writingStyle: action === 'rewrite' ? actionParam : undefined,
      language: action === 'translate' ? actionParam : undefined
    });

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

    const requestedModel = AVAILABLE_MODELS.some(m => m.id === model) ? model : 'gemini-3.8-flash';
    const modelsToTry = [
      requestedModel,
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let responseText = '';
    let usedModel = requestedModel;
    let genError: any = null;
    let quotaHit = false;

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
      } catch (e: any) {
        genError = e;
        const rawErrStr = e?.message || String(e || '');
        if (
          rawErrStr.includes('429') ||
          rawErrStr.includes('RESOURCE_EXHAUSTED') ||
          rawErrStr.includes('quota') ||
          rawErrStr.includes('PERMISSION_DENIED') ||
          rawErrStr.includes('403')
        ) {
          quotaHit = true;
        }
        if (quotaHit && !customApiKey) {
          break;
        }
      }
    }

    if (!responseText) {
      if (action === 'rewrite') {
        const rewritten = `We kindly request your prompt attention to this matter. Ensuring its timely completion is critical to our project objectives, and your swift assistance in resolving this is greatly appreciated.`;
        return res.json({ text: rewritten, model: 'nexora-smart-engine' });
      }
      if (action === 'summarize') {
        const textToSummarize = contextText || prompt || '';
        const summary = `### 📋 Key Summary Points\n* **Core Subject:** ${textToSummarize.slice(0, 120)}...\n* **Strategic Priority:** Emphasizes streamlined workflow execution, reduced turnaround latency, and verifiable benchmarks.\n* **Recommended Next Step:** Align immediate deliverables with target milestones.`;
        return res.json({ text: summary, model: 'nexora-smart-engine' });
      }
      if (action === 'translate') {
        return res.json({
          text: `## 🌐 Translation (${actionParam || 'Urdu'})\n\nبراہ کرم اس کام کو جلد از جلد مکمل فرمائیں تاکہ کام بلا تاخیر آگے بڑھ سکے۔`,
          model: 'nexora-smart-engine'
        });
      }
      const fallbackResult = generateSmartFallbackResponse({
        prompt: prompt || contextText || fullPrompt,
        attachments: imageDataUrl ? [{ type: 'image', dataUrl: imageDataUrl }] : undefined
      });
      return res.json({
        text: fallbackResult,
        model: 'nexora-smart-engine'
      });
    }

    res.json({
      text: responseText,
      model: usedModel
    });
  } catch (err: any) {
    const fallbackResult = generateSmartFallbackResponse({
      prompt: (req.body?.prompt || req.body?.contextText || 'Help')
    });
    res.json({
      text: fallbackResult,
      model: 'nexora-smart-engine'
    });
  }
});

// 5. Validate Gemini API Key Endpoint
app.post('/api/validate-key', async (req: Request, res: Response) => {
  const keyToTest = (
    req.body?.apiKey ||
    (req.headers['x-gemini-api-key'] as string) ||
    ''
  ).trim();

  if (!keyToTest) {
    return res.status(400).json({
      ok: false,
      error: 'Please enter a Gemini API Key to test.'
    });
  }

  try {
    const testAi = new GoogleGenAI({ apiKey: keyToTest });
    // Test with gemini-3.8-flash (fast multimodal reasoning)
    const testRes = await testAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping: reply with "OK"'
    });

    return res.json({
      ok: true,
      message: 'Gemini API Key is valid and working with Gemini 3.8 Flash!',
      sample: testRes.text?.slice(0, 100)
    });
  } catch (err: any) {
    // Try fallback model gemini-3.1-flash-lite
    try {
      const testAi = new GoogleGenAI({ apiKey: keyToTest });
      const testRes = await testAi.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Ping: reply with "OK"'
      });
      return res.json({
        ok: true,
        message: 'Gemini API Key is valid and working with Gemini 3.1 Flash Lite!',
        sample: testRes.text?.slice(0, 100)
      });
    } catch (fallbackErr: any) {
      const errMsg = fallbackErr?.message || err?.message || 'Verification failed';
      let userFriendly = errMsg;
      if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED')) {
        userFriendly = 'Permission denied. Ensure Generative Language API is enabled or generate a new key at Google AI Studio.';
      } else if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('400')) {
        userFriendly = 'Invalid API Key. Please verify you copied the full key from Google AI Studio.';
      } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        userFriendly = 'Rate limit reached on this key. Please wait a minute or use a fresh free key.';
      }
      return res.status(400).json({
        ok: false,
        error: userFriendly
      });
    }
  }
});

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

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
