export type AIModelType =
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite';

export interface ModelOption {
  id: AIModelType;
  name: string;
  badge: string;
  description: string;
  recommendedFor: string;
}

export type LanguageOption = 'English' | 'Urdu' | 'Hindi' | 'Arabic' | 'Punjabi' | 'Auto-detect';

export type WritingStyleOption = 'Professional' | 'Academic' | 'Simple' | 'Friendly' | 'Creative' | 'Formal';

export type ResponseLengthOption = 'Short' | 'Balanced' | 'Detailed';

export type ThemeOption = 'dark' | 'light' | 'system';

export interface UserSettings {
  theme: ThemeOption;
  defaultLanguage: LanguageOption;
  writingStyle: WritingStyleOption;
  responseLength: ResponseLengthOption;
  preferredModel: AIModelType;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'text' | 'document';
  mimeType: string;
  size: number;
  dataUrl?: string; // For images/small previews (base64)
  extractedText?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
  chunkCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  model?: AIModelType;
  isStreaming?: boolean;
  error?: string;
  tokens?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
  model: AIModelType;
  documentIds?: string[];
  messageCount?: number;
}

export interface SavedDocument {
  id: string;
  userId: string;
  name: string;
  fileType: string;
  fileSize: number;
  createdAt: number;
  status: 'ready' | 'processing' | 'error';
  extractedTextPreview: string;
  fullTextLength?: number;
  chunkCount: number;
  relatedConversationId?: string;
}

export interface QuickPrompt {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  category: 'analysis' | 'writing' | 'learning' | 'multilingual';
}
