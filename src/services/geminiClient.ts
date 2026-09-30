import { Message, AIModelType, ModelOption, LanguageOption, WritingStyleOption, ResponseLengthOption } from '../types';
import { GoogleGenAI } from '@google/genai';

export interface StreamOptions {
  model?: AIModelType;
  language?: LanguageOption;
  writingStyle?: WritingStyleOption;
  responseLength?: ResponseLengthOption;
  customInstruction?: string;
  signal?: AbortSignal;
}

export const FOUNDER_INFO_MARKDOWN = `My founder is **Muhammad Abdullah Azam** (M. Abdullah Azam), a creative **Software Developer, Web Developer, Web App Developer, Android App Developer, Video Creator, and CV Maker**. He creates modern, responsive, and user-friendly digital solutions for individuals, businesses, and organizations.

### Skills

* 💻 **Software Development** — Building practical and professional software for business and for school etc 
* 🌐 **Web Development** — Creating modern, responsive, and professional websites
* 📱 **Android App Development** — Creating useful and user-friendly Android applications
* 🎬 **Video Creation** — Creating promotional and business videos
* 📄 **CV & Resume Design** — Designing professional and attractive CVs
* ⚡ **Animations & Interactive Effects** — Adding smooth animations and interactive experiences
* 💼 **Business Solutions** — Developing digital solutions tailored to business needs
* 📱 **Responsive Design** — Ensuring websites and web apps work smoothly across devices`;

export function isFounderQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();
  if (/founder|creator|who\s+(created|made|built|developed)\s+you|who\s+is\s+your\s+(founder|developer|creator|maker)|who\s+are\s+you\s+made\s+by/i.test(q)) {
    return true;
  }
  if (/(founder\s*k(o|au)n|kis\s*ne\s*ban(a|aa)ya|apko\s*kisne|tumhe\s*kisne|tumhara\s*founder|apka\s*founder)/i.test(q)) {
    return true;
  }
  if (/\b(abdullah\s+azam|m\.?\s*abdullah\s+azam|muhammad\s+abdullah)\b/i.test(q)) {
    return true;
  }
  return false;
}

const STORAGE_API_KEY = 'nexora_gemini_api_key';

export const geminiClient = {
  /**
   * Get user-configured custom API key or Vite env key
   */
  getClientApiKey(): string {
    const customKey = localStorage.getItem(STORAGE_API_KEY) || '';
    if (customKey.trim()) return customKey.trim();
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    return viteKey.trim();
  },

  /**
   * Save custom API key to browser storage
   */
  setClientApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(STORAGE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_API_KEY);
    }
  },

  /**
   * Fetches available AI models from server or local registry
   */
  async getModels(): Promise<ModelOption[]> {
    try {
      const res = await fetch('/api/models');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          return data.models;
        }
      }
    } catch (e) {
      console.warn('Using local fallback models:', e);
    }
    
    return [
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
        id: 'gemini-flash-latest',
        name: 'Nexora Flash Latest',
        badge: 'High Availability',
        description: 'General-purpose high speed generation model with strong multimodal support.',
        recommendedFor: 'Reliable responses, summaries & text processing'
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Nexora 3.1 Pro',
        badge: 'Deep Reasoning',
        description: 'State-of-the-art capability for complex multi-page synthesis, research & intricate reasoning.',
        recommendedFor: 'Complex legal/technical PDFs, advanced code & comprehensive essays'
      }
    ];
  },

  /**
   * Build system instruction
   */
  buildSystemInstruction(
    language?: LanguageOption,
    style?: WritingStyleOption,
    length: ResponseLengthOption = 'Short',
    customInstructions?: string
  ): string {
    let prompt = `You are Nexora (Nexora AI), an elite, lightning-fast AI writing assistant and document-analysis engine.

MANDATORY FOUNDER & CREATOR IDENTITY:
When the user asks who is your founder, creator, developer, or who made/built you, or inquires about Muhammad Abdullah Azam:
You MUST answer that your founder is Muhammad Abdullah Azam (M. Abdullah Azam) and provide these exact details and skills:
"""
${FOUNDER_INFO_MARKDOWN}
"""
If asked in Urdu, Hindi, or any other language (e.g., "tumhara founder kon hai", "kisne banaya"), provide this exact information about Muhammad Abdullah Azam and his skills clearly in that language.

Your primary capabilities include:
1. Deep document & PDF analysis: extracting key insights, answering questions, summarizing texts, generating study notes & MCQs.
2. Legal Citation & Judgment Reporting: providing precise citations across standard reporting formats (Bluebook, OSCOLA, Neutral Citation, AIR, SCC, PLD, SCMR, US Supreme Court) with italicized titles, courts, years, reporters, and pinpoint refs.
3. Multimodal image understanding: reading diagrams, handwritten notes, infographics, and screenshots.
4. Versatile writing: essays, reports, proposals, emails, video scripts, and academic summaries.
5. Multilingual excellence: fluent in English, Urdu (اردو), Hindi (हिंदी), Arabic (العربية), Punjabi (ਪੰਜਾਬੀ / پنجابی), and other languages.
6. Rich Markdown output: clear headings (##, ###), bullet points, bold key terms, tables, and code blocks.

CRITICAL INSTRUCTION FOR CONCISENESS & SPEED:
- Default to SHORT, CRISP, and DIRECT answers.
- Get straight to the answer immediately without conversational fluff or pleasantries.
- Use bullet points, bold key terms, and concise sentences.`;

    if (language && language !== 'Auto-detect') {
      prompt += `\nStrict Output Language: Respond in ${language}. Ensure natural vocabulary and native phrasing.`;
    }
    if (style) {
      prompt += `\nWriting Tone & Style: ${style}.`;
    }
    if (length === 'Detailed') {
      prompt += `\nDepth: Provide comprehensive, detailed, and thorough explanations with full context.`;
    } else {
      prompt += `\nResponse Length: Short & Concise. Keep answers compact, high-value, and direct.`;
    }
    if (customInstructions) {
      prompt += `\nAdditional Custom Directives: ${customInstructions}`;
    }

    return prompt;
  },

  /**
   * Fallback direct client streaming using @google/genai
   */
  async streamChatClientDirect(
    messages: Message[],
    options: StreamOptions,
    onChunk: (text: string) => void,
    onError: (error: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const apiKey = this.getClientApiKey();
    if (!apiKey) {
      onError(
        'AI Backend Notice: This live page is running on static hosting without a server proxy. Please open Settings (⚙️ > Nexora AI Engine) and enter your Gemini API Key to enable live answers on this domain.'
      );
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = this.buildSystemInstruction(
        options.language,
        options.writingStyle,
        options.responseLength,
        options.customInstruction
      );

      const formattedContents = messages.map((m: Message) => {
        const parts: any[] = [];
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
            } else if (att.extractedText) {
              parts.push({
                text: `[DOCUMENT ATTACHMENT: "${att.name}"]\n--- BEGIN DOCUMENT CONTENT ---\n${att.extractedText.slice(0, 50000)}\n--- END DOCUMENT CONTENT ---\n`
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

      const targetModels = [
        options.model || 'gemini-3.1-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest'
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      let stream: any = null;
      let usedModel = options.model || 'gemini-3.1-flash-lite';

      for (const mod of targetModels) {
        try {
          stream = await ai.models.generateContentStream({
            model: mod,
            contents: formattedContents,
            config: { systemInstruction, temperature: 0.7 }
          });
          usedModel = mod as AIModelType;
          if (stream) break;
        } catch (err: any) {
          console.warn(`Direct client model ${mod} fallback:`, err);
        }
      }

      if (!stream) {
        throw new Error('All Gemini models were unavailable or API key quota limit was reached.');
      }

      let fullText = '';
      for await (const chunk of stream) {
        if (options.signal?.aborted) {
          console.log('Client direct stream aborted.');
          return;
        }
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      onComplete(fullText);
    } catch (err: any) {
      console.error('Client direct stream error:', err);
      onError(err.message || 'Direct AI generation encountered an error.');
    }
  },

  /**
   * Streams a chat conversation
   */
  async streamChat(
    messages: Message[],
    options: StreamOptions,
    onChunk: (text: string) => void,
    onError: (error: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    // Instant smooth streaming for founder inquiries
    const lastUserMsg = messages[messages.length - 1];
    const lastText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';
    const hasAttachments = lastUserMsg?.attachments && lastUserMsg.attachments.length > 0;
    if (isFounderQuery(lastText) && !hasAttachments) {
      const chunks = FOUNDER_INFO_MARKDOWN.match(/.{1,35}/gs) || [FOUNDER_INFO_MARKDOWN];
      let running = '';
      for (const chunk of chunks) {
        if (options.signal?.aborted) return;
        running += chunk;
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 16));
      }
      onComplete(running);
      return;
    }

    try {
      const clientApiKey = this.getClientApiKey();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (clientApiKey) {
        headers['x-gemini-api-key'] = clientApiKey;
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          model: options.model || 'gemini-3.1-flash-lite',
          customApiKey: clientApiKey || undefined,
          language: options.language,
          writingStyle: options.writingStyle,
          responseLength: options.responseLength,
          customInstruction: options.customInstruction
        }),
        signal: options.signal
      });

      const contentType = response.headers.get('content-type') || '';

      // If backend returns HTML (Netlify static SPA fallback) or 404/500, switch to direct client execution
      if (contentType.includes('text/html') || response.status === 404 || !response.ok) {
        console.info('Backend endpoint not reached or static host detected, trying client direct generation...');
        return await this.streamChatClientDirect(messages, options, onChunk, onError, onComplete);
      }

      if (!response.body) {
        return await this.streamChatClientDirect(messages, options, onChunk, onError, onComplete);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';
      let receivedAnyChunk = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            onComplete(fullText);
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.text) {
              receivedAnyChunk = true;
              fullText += parsed.text;
              onChunk(parsed.text);
            }
          } catch (jsonErr) {
            console.warn('Error parsing stream event JSON:', jsonErr, dataStr);
          }
        }
      }

      if (!receivedAnyChunk && !fullText) {
        // Fallback to client direct
        console.info('No stream chunks received from server, falling back to direct client execution...');
        return await this.streamChatClientDirect(messages, options, onChunk, onError, onComplete);
      }

      onComplete(fullText);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
        return;
      }
      console.warn('Chat stream fetch failed, falling back to client-side direct execution:', err);
      return await this.streamChatClientDirect(messages, options, onChunk, onError, onComplete);
    }
  },

  /**
   * Single-shot action (e.g. Rewrite, Summarize, Translate)
   */
  async executeQuickAction(params: {
    prompt?: string;
    action?: 'rewrite' | 'summarize' | 'translate' | 'mcq' | 'notes' | 'explain' | 'grammar';
    actionParam?: string;
    contextText?: string;
    imageDataUrl?: string;
    model?: AIModelType;
  }): Promise<string> {
    const clientApiKey = this.getClientApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (clientApiKey) {
      headers['x-gemini-api-key'] = clientApiKey;
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...params,
          model: params.model || 'gemini-3.1-flash-lite',
          customApiKey: clientApiKey || undefined
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.text) return data.text;
      }
    } catch (e) {
      console.warn('Quick action API fetch failed, trying client direct:', e);
    }

    // Direct client fallback for quick action
    const apiKey = clientApiKey;
    if (!apiKey) {
      throw new Error(
        'Please enter your Gemini API Key in Settings (⚙️ > Nexora AI Engine) to perform AI actions.'
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    let prompt = params.prompt || '';
    if (params.action === 'rewrite') {
      prompt = `Rewrite the following text with a ${params.actionParam || 'professional'} tone:\n\n${params.contextText}`;
    } else if (params.action === 'summarize') {
      prompt = `Provide a clean, structured summary of the following text:\n\n${params.contextText}`;
    } else if (params.action === 'translate') {
      prompt = `Translate the following into ${params.actionParam || 'English'}:\n\n${params.contextText}`;
    } else if (params.action === 'grammar') {
      prompt = `Fix all grammatical mistakes and improve readability:\n\n${params.contextText}`;
    }

    const result = await ai.models.generateContent({
      model: params.model || 'gemini-3.1-flash-lite',
      contents: prompt
    });

    return result.text || '';
  }
};
