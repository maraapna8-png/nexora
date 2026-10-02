import { Message, AIModelType, ModelOption, LanguageOption, WritingStyleOption, ResponseLengthOption } from '../types';
import { GoogleGenAI } from '@google/genai';
import { FOUNDER_INFO_MARKDOWN, isFounderQuery } from './founderData';
import { generateSmartFallbackResponse } from './smartFallbackEngine';
import { prepareConversationHistory } from './conversationMemory';
import { buildProductionSystemInstruction } from './systemInstruction';

export { FOUNDER_INFO_MARKDOWN, isFounderQuery };

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
  },

  /**
   * Build system instruction
   */
  buildSystemInstruction(
    language?: LanguageOption,
    style?: WritingStyleOption,
    length: ResponseLengthOption = 'Balanced',
    customInstructions?: string,
    contextIntent?: any
  ): string {
    return buildProductionSystemInstruction({
      language,
      writingStyle: style,
      responseLength: length,
      customInstructions,
      contextIntent
    });
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
      const lastUserMsg = messages[messages.length - 1];
      const fallbackAnswer = generateSmartFallbackResponse({
        prompt: typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '',
        history: messages,
        attachments: lastUserMsg?.attachments,
        language: options.language,
        writingStyle: options.writingStyle,
        responseLength: options.responseLength,
        customInstruction: options.customInstruction
      });
      const chunks = fallbackAnswer.match(/.{1,35}/gs) || [fallbackAnswer];
      let running = '';
      for (const chunk of chunks) {
        if (options.signal?.aborted) return;
        running += chunk;
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 15));
      }
      onComplete(running);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const { formattedContents, detectedIntent } = prepareConversationHistory(messages);

      const systemInstruction = this.buildSystemInstruction(
        options.language,
        options.writingStyle,
        options.responseLength || 'Balanced',
        options.customInstruction,
        detectedIntent
      );

      const targetModels = [
        options.model || 'gemini-3.8-flash',
        'gemini-3.8-flash',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest'
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      let stream: any = null;
      let usedModel = options.model || 'gemini-3.8-flash';
      const adaptiveTemperature = (detectedIntent.referencesPreviousCode || detectedIntent.isCorrection) ? 0.35 : 0.7;

      for (const mod of targetModels) {
        try {
          stream = await ai.models.generateContentStream({
            model: mod,
            contents: formattedContents,
            config: { systemInstruction, temperature: adaptiveTemperature }
          });
          usedModel = mod as AIModelType;
          if (stream) break;
        } catch (err: any) {
          // silently continue to next fallback
        }
      }

      if (!stream) {
        const lastUserMsg = messages[messages.length - 1];
        const fallbackAnswer = generateSmartFallbackResponse({
          prompt: typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '',
          history: messages,
          attachments: lastUserMsg?.attachments,
          language: options.language,
          writingStyle: options.writingStyle,
          responseLength: options.responseLength,
          customInstruction: options.customInstruction
        });
        const chunks = fallbackAnswer.match(/.{1,35}/gs) || [fallbackAnswer];
        let running = '';
        for (const chunk of chunks) {
          if (options.signal?.aborted) return;
          running += chunk;
          onChunk(chunk);
          await new Promise(r => setTimeout(r, 15));
        }
        onComplete(running);
        return;
      }

      let fullText = '';
      for await (const chunk of stream) {
        if (options.signal?.aborted) {
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
      const lastUserMsg = messages[messages.length - 1];
      const fallbackAnswer = generateSmartFallbackResponse({
        prompt: typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '',
        history: messages,
        attachments: lastUserMsg?.attachments,
        language: options.language,
        writingStyle: options.writingStyle,
        responseLength: options.responseLength,
        customInstruction: options.customInstruction
      });
      onComplete(fallbackAnswer);
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
          model: options.model || 'gemini-3.8-flash',
          customApiKey: clientApiKey || undefined,
          language: options.language,
          writingStyle: options.writingStyle,
          responseLength: options.responseLength || 'Balanced',
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
          model: params.model || 'gemini-3.8-flash',
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
      return generateSmartFallbackResponse({
        prompt: params.prompt || params.contextText || 'Quick Action',
        attachments: params.imageDataUrl ? [{ type: 'image', dataUrl: params.imageDataUrl }] : undefined
      });
    }

    try {
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

      const systemInstruction = buildProductionSystemInstruction({
        writingStyle: params.action === 'rewrite' ? params.actionParam : undefined,
        language: params.action === 'translate' ? params.actionParam : undefined
      });

      const result = await ai.models.generateContent({
        model: params.model || 'gemini-3.8-flash',
        contents: prompt,
        config: { systemInstruction }
      });

      return result.text || generateSmartFallbackResponse({ prompt: params.prompt || params.contextText || 'Action' });
    } catch {
      return generateSmartFallbackResponse({
        prompt: params.prompt || params.contextText || 'Action',
        attachments: params.imageDataUrl ? [{ type: 'image', dataUrl: params.imageDataUrl }] : undefined
      });
    }
  }
};
