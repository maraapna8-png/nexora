import { GoogleGenAI } from '@google/genai';

export const config = {
  path: "/api/chat/stream"
};

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'GEMINI_API_KEY is not configured in Netlify environment variables.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const {
      messages = [],
      model = 'gemini-2.5-flash',
      language,
      writingStyle,
      responseLength,
      customInstruction
    } = body;

    const ai = new GoogleGenAI({ apiKey });

    // Build system instruction
    let systemInstruction = `You are Nexora (Nexora AI), an elite, lightning-fast AI writing assistant and document-analysis engine.
Capabilities include deep PDF & text analysis, multimodal image understanding, legal citations, essays, reports, and multilingual writing.
Default to direct, concise, and structured answers without conversational filler.`;

    if (language && language !== 'Auto-detect') {
      systemInstruction += `\nStrict Output Language: Respond in ${language}.`;
    }
    if (writingStyle) {
      systemInstruction += `\nWriting Tone & Style: ${writingStyle}.`;
    }
    if (responseLength === 'Detailed') {
      systemInstruction += `\nDepth: Comprehensive and detailed.`;
    } else {
      systemInstruction += `\nDepth: Short & concise.`;
    }
    if (customInstruction) {
      systemInstruction += `\nCustom Directives: ${customInstruction}`;
    }

    // Format contents
    const formattedContents = messages.map((m: any) => {
      const parts: any[] = [];
      if (m.attachments && Array.isArray(m.attachments)) {
        for (const att of m.attachments) {
          if (att.type === 'image' && att.dataUrl) {
            const matches = att.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              parts.push({
                inlineData: { mimeType: matches[1], data: matches[2] }
              });
            }
          } else if (att.extractedText) {
            parts.push({
              text: `[DOCUMENT ATTACHMENT: "${att.name}"]\n${att.extractedText.slice(0, 50000)}`
            });
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

    const modelsToTry = [model, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite'];
    let stream: any = null;

    for (const targetModel of modelsToTry) {
      try {
        stream = await ai.models.generateContentStream({
          model: targetModel,
          contents: formattedContents,
          config: { systemInstruction, temperature: 0.7 }
        });
        if (stream) break;
      } catch (err) {
        console.warn(`Netlify function fallback from ${targetModel}:`, err);
      }
    }

    if (!stream) {
      return new Response(JSON.stringify({ error: 'All AI models were busy. Please try again.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamErr: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: streamErr.message || 'Stream failed' })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
