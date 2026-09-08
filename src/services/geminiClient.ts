import { Message, AIModelType, ModelOption, LanguageOption, WritingStyleOption, ResponseLengthOption } from '../types';

export interface StreamOptions {
  model?: AIModelType;
  language?: LanguageOption;
  writingStyle?: WritingStyleOption;
  responseLength?: ResponseLengthOption;
  customInstruction?: string;
  signal?: AbortSignal;
}

export const geminiClient = {
  /**
   * Fetches available AI models from server
   */
  async getModels(): Promise<ModelOption[]> {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      return data.models;
    } catch (e) {
      console.warn('Fallback default models:', e);
      return [
        {
          id: 'gemini-3.8-flash',
          name: 'Nexora 3.8 Flash',
          badge: 'Fast & Smart',
          description: 'Ultra-fast multimodal reasoning for writing, chat & rapid document parsing.',
          recommendedFor: 'Everyday writing, PDF queries & instant analysis'
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
          description: 'Optimized for high-speed micro-edits, quick rewrites & instant summaries.',
          recommendedFor: 'Grammar polish, quick translations & brief queries'
        }
      ];
    }
  },

  /**
   * Streams a chat conversation from the server using Server-Sent Events
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
          model: options.model || 'gemini-3.1-flash-lite',
          language: options.language,
          writingStyle: options.writingStyle,
          responseLength: options.responseLength,
          customInstruction: options.customInstruction
        }),
        signal: options.signal
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

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
              fullText += parsed.text;
              onChunk(parsed.text);
            }
          } catch (jsonErr) {
            console.warn('Error parsing stream event JSON:', jsonErr, dataStr);
          }
        }
      }

      onComplete(fullText);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('Chat stream error:', err);
        onError(err.message || 'Connection to AI failed. Please try again.');
      }
    }
  },

  /**
   * Single-shot action (e.g. Rewrite, Summarize, Translate, Generate MCQs, Create Notes)
   */
  async executeQuickAction(params: {
    prompt?: string;
    action?: 'rewrite' | 'summarize' | 'translate' | 'mcq' | 'notes' | 'explain' | 'grammar';
    actionParam?: string;
    contextText?: string;
    imageDataUrl?: string;
    model?: AIModelType;
  }): Promise<string> {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Action failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.text;
  }
};
