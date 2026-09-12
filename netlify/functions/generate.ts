import { GoogleGenAI } from '@google/genai';

export const config = {
  path: "/api/generate"
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
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Netlify.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { prompt, action, actionParam, contextText, model = 'gemini-2.5-flash' } = body;

    let fullPrompt = prompt || '';
    if (action === 'rewrite') {
      fullPrompt = `Rewrite the following text with a ${actionParam || 'professional'} tone:\n\n${contextText}`;
    } else if (action === 'summarize') {
      fullPrompt = `Provide a structured, high-impact summary of the following:\n\n${contextText}`;
    } else if (action === 'translate') {
      fullPrompt = `Translate the following text into ${actionParam || 'English'}:\n\n${contextText}`;
    } else if (action === 'grammar') {
      fullPrompt = `Fix all grammar, punctuation, and elevate sentence fluency:\n\n${contextText}`;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: fullPrompt
    });

    return new Response(JSON.stringify({ text: response.text || '' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
