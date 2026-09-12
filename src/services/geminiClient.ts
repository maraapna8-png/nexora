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
        id: 'gemini-2.5-flash',
        name: 'Nexora 2.5 Flash',
        badge: 'Fast & Smart',
        description: 'Ultra-fast multimodal reasoning for writing, chat & rapid document parsing.',
        recommendedFor: 'Everyday writing, PDF queries & instant analysis'
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Nexora 2.5 Pro',
        badge: 'Deep Reasoning',
        description: 'State-of-the-art capability for complex multi-page synthesis, research & intricate reasoning.',
        recommendedFor: 'Complex legal/technical PDFs, advanced code & comprehensive essays'
      },
      {
        id: 'gemini-2.0-flash-lite',
        name: 'Nexora 2.0 Flash Lite',
        badge: 'Ultra Fast',
        description: 'Optimized for high-speed micro-edits, quick rewrites & instant summaries.',
        recommendedFor: 'Grammar polish, quick translations & brief queries'
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
        options.model || 'gemini-2.5-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-3.1-flash-lite'
      ];

      let stream: any = null;
      let usedModel = options.model || 'gemini-2.5-flash';

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
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          model: options.model || 'gemini-2.5-flash',
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
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
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
    const apiKey = this.getClientApiKey();
    if (!apiKey) {
      throw new Error(
        'Please enter your Gemini API Key in Settings (⚙️ > Nexora AI Engine) to perform AI rewrites on this static page.'
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
      model: params.model || 'gemini-2.5-flash',
      contents: prompt
    });

    return result.text || '';
  }
};
