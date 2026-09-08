import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Conversation, Message, Attachment, AIModelType, SavedDocument } from '../types';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { firestoreService } from '../firebase/firestoreService';
import { geminiClient } from '../services/geminiClient';
import { extractTextFromPDF } from '../utils/pdfParser';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  activeModel: AIModelType;
  isGenerating: boolean;
  activeAttachments: Attachment[];
  savedDocuments: SavedDocument[];
  searchQuery: string;
  isSearchOpen: boolean;
  selectedDocForAnalysis: SavedDocument | null;
  loadingHistory: boolean;

  setActiveModel: (model: AIModelType) => void;
  setSearchQuery: (q: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  createNewConversation: () => Promise<Conversation>;
  selectConversation: (convId: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  sendMessage: (text: string, overrideAttachments?: Attachment[]) => Promise<void>;
  stopGeneration: () => void;
  regenerateLastMessage: () => Promise<void>;
  editAndResendMessage: (messageId: string, newContent: string) => Promise<void>;
  continueMessage: (messageId: string) => Promise<void>;
  addAttachmentFiles: (files: FileList | File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  saveDocumentToLibrary: (docData: Omit<SavedDocument, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteDocumentFromLibrary: (docId: string) => Promise<void>;
  analyzeDocumentInChat: (docRecord: SavedDocument, promptType?: string) => Promise<void>;
  quickRewriteMessage: (messageId: string, style: string) => Promise<void>;
  quickTranslateMessage: (messageId: string, targetLanguage: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_STORAGE_CONVS_PREFIX = 'writemind_convs_';
const LOCAL_STORAGE_MSGS_PREFIX = 'writemind_msgs_';
const LOCAL_STORAGE_DOCS_PREFIX = 'writemind_docs_';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const { settings } = useSettings();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeModel, setActiveModel] = useState<AIModelType>(settings.preferredModel || 'gemini-3.1-flash-lite');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeAttachments, setActiveAttachments] = useState<Attachment[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedDocForAnalysis, setSelectedDocForAnalysis] = useState<SavedDocument | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Update active model when settings change
  useEffect(() => {
    if (settings.preferredModel) {
      setActiveModel(settings.preferredModel);
    }
  }, [settings.preferredModel]);

  // Load conversations and documents on user login
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setActiveConversation(null);
      setSavedDocuments([]);
      return;
    }

    const loadUserData = async () => {
      setLoadingHistory(true);
      if (isGuest) {
        // Load from LocalStorage for guest
        try {
          const storedConvs = localStorage.getItem(LOCAL_STORAGE_CONVS_PREFIX + user.uid);
          const parsedConvs: Conversation[] = storedConvs ? JSON.parse(storedConvs) : [];
          setConversations(parsedConvs);

          const storedDocs = localStorage.getItem(LOCAL_STORAGE_DOCS_PREFIX + user.uid);
          const parsedDocs: SavedDocument[] = storedDocs ? JSON.parse(storedDocs) : [];
          setSavedDocuments(parsedDocs);

          if (parsedConvs.length > 0) {
            await selectConversation(parsedConvs[0].id, parsedConvs);
          } else {
            await createNewConversation();
          }
        } catch (e) {
          console.error('Error loading guest data:', e);
        }
      } else {
        // Load from Firestore
        try {
          const [remoteConvs, remoteDocs] = await Promise.all([
            firestoreService.getUserConversations(user.uid),
            firestoreService.getUserDocuments(user.uid)
          ]);

          setConversations(remoteConvs);
          setSavedDocuments(remoteDocs);

          if (remoteConvs.length > 0) {
            await selectConversation(remoteConvs[0].id, remoteConvs);
          } else {
            await createNewConversation();
          }
        } catch (err) {
          console.error('Error fetching Firestore history:', err);
        }
      }
      setLoadingHistory(false);
    };

    loadUserData();
  }, [user?.uid, isGuest]);

  // Create a brand new conversation
  const createNewConversation = async (): Promise<Conversation> => {
    if (!user) {
      const dummy: Conversation = {
        id: 'new_' + Date.now(),
        userId: 'temp',
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: activeModel,
        messageCount: 0
      };
      setActiveConversation(dummy);
      setMessages([]);
      return dummy;
    }

    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeModel,
      messageCount: 0
    };

    setActiveConversation(newConv);
    setMessages([]);
    setActiveAttachments([]);

    setConversations(prev => [newConv, ...prev]);

    if (isGuest) {
      const updated = [newConv, ...conversations];
      localStorage.setItem(LOCAL_STORAGE_CONVS_PREFIX + user.uid, JSON.stringify(updated));
    } else {
      try {
        await firestoreService.createConversation(newConv);
      } catch (e) {
        console.warn('Error creating conversation in Firestore:', e);
      }
    }

    return newConv;
  };

  // Select an existing conversation
  const selectConversation = async (convId: string, convsList: Conversation[] = conversations) => {
    const target = convsList.find(c => c.id === convId);
    if (!target && convsList.length > 0) return;

    if (target) {
      setActiveConversation(target);
      setActiveModel(target.model || activeModel);
    }

    if (!user) return;

    if (isGuest) {
      const stored = localStorage.getItem(LOCAL_STORAGE_MSGS_PREFIX + convId);
      const msgs: Message[] = stored ? JSON.parse(stored) : [];
      setMessages(msgs);
    } else {
      try {
        const msgs = await firestoreService.getConversationMessages(convId);
        setMessages(msgs);
        // Cache locally for instant offline availability
        if (msgs.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_MSGS_PREFIX + convId, JSON.stringify(msgs));
        }
      } catch (err) {
        console.warn('Error fetching messages from Firestore, falling back to local cache:', err);
        const stored = localStorage.getItem(LOCAL_STORAGE_MSGS_PREFIX + convId);
        if (stored) {
          try {
            setMessages(JSON.parse(stored));
          } catch (e) {
            // ignore
          }
        }
      }
    }
  };

  // Delete a conversation
  const deleteConversation = async (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        selectConversation(remaining[0].id, remaining);
      } else {
        createNewConversation();
      }
    }

    if (!user) return;

    if (isGuest) {
      const updated = conversations.filter(c => c.id !== convId);
      localStorage.setItem(LOCAL_STORAGE_CONVS_PREFIX + user.uid, JSON.stringify(updated));
      localStorage.removeItem(LOCAL_STORAGE_MSGS_PREFIX + convId);
    } else {
      try {
        await firestoreService.deleteConversation(convId);
      } catch (err) {
        console.error('Error deleting conversation in Firestore:', err);
      }
    }
  };

  // Upload and process files
  const addAttachmentFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const tempId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      const initialAttachment: Attachment = {
        id: tempId,
        name: file.name,
        type: isPdf ? 'pdf' : isImage ? 'image' : 'document',
        mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
        size: file.size,
        status: 'processing'
      };

      setActiveAttachments(prev => [...prev, initialAttachment]);

      try {
        if (isPdf) {
          const parseResult = await extractTextFromPDF(file);
          setActiveAttachments(prev =>
            prev.map(a =>
              a.id === tempId
                ? {
                    ...a,
                    status: 'ready',
                    extractedText: parseResult.text,
                    chunkCount: parseResult.chunks.length
                  }
                : a
            )
          );

          // Also automatically offer to save to user's saved documents
          if (user) {
            saveDocumentToLibrary({
              name: file.name,
              fileType: 'pdf',
              fileSize: file.size,
              status: 'ready',
              extractedTextPreview: parseResult.preview,
              fullTextLength: parseResult.text.length,
              chunkCount: parseResult.chunks.length
            });
          }
        } else if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setActiveAttachments(prev =>
              prev.map(a =>
                a.id === tempId
                  ? {
                      ...a,
                      status: 'ready',
                      dataUrl
                    }
                  : a
              )
            );
          };
          reader.onerror = () => {
            setActiveAttachments(prev =>
              prev.map(a =>
                a.id === tempId
                  ? { ...a, status: 'error', errorMessage: 'Could not read image file' }
                  : a
              )
            );
          };
          reader.readAsDataURL(file);
        } else {
          // Plain text / notes
          const text = await file.text();
          setActiveAttachments(prev =>
            prev.map(a =>
              a.id === tempId
                ? {
                    ...a,
                    status: 'ready',
                    extractedText: text
                  }
                : a
            )
          );
        }
      } catch (err: any) {
        console.error('File processing error:', err);
        setActiveAttachments(prev =>
          prev.map(a =>
            a.id === tempId
              ? { ...a, status: 'error', errorMessage: err.message || 'Processing failed' }
              : a
          )
        );
      }
    }
  };

  const removeAttachment = (id: string) => {
    setActiveAttachments(prev => prev.filter(a => a.id !== id));
  };

  const clearAttachments = () => {
    setActiveAttachments([]);
  };

  // Stop ongoing generation cleanly
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send message to Gemini
  const sendMessage = async (text: string, overrideAttachments?: Attachment[]) => {
    if ((!text.trim() && (!overrideAttachments || overrideAttachments.length === 0) && activeAttachments.length === 0) || isGenerating) {
      return;
    }

    let currentConv = activeConversation;
    if (!currentConv) {
      currentConv = await createNewConversation();
    }

    const currentUserId = user?.uid || 'temp_user';
    const attachmentsToSend = overrideAttachments || [...activeAttachments];
    clearAttachments();

    // 1. Create user message
    const userMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const userMessage: Message = {
      id: userMsgId,
      conversationId: currentConv.id,
      userId: currentUserId,
      role: 'user',
      content: text,
      createdAt: Date.now(),
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
      model: activeModel
    };

    // Auto-update conversation title if it's the first message
    const isFirstMessage = messages.length === 0;
    let newTitle = currentConv.title;
    if (isFirstMessage) {
      if (text.trim()) {
        newTitle = text.trim().slice(0, 38) + (text.length > 38 ? '...' : '');
      } else if (attachmentsToSend.length > 0) {
        newTitle = `Analysis: ${attachmentsToSend[0].name.slice(0, 25)}`;
      }
      currentConv = { ...currentConv, title: newTitle };
      setActiveConversation(currentConv);
      setConversations(prev =>
        prev.map(c => (c.id === currentConv!.id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
      );
    }

    // 2. Create placeholder assistant message for streaming
    const assistantMsgId = 'msg_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      conversationId: currentConv.id,
      userId: currentUserId,
      role: 'assistant',
      content: '',
      createdAt: Date.now() + 1,
      model: activeModel,
      isStreaming: true
    };

    const updatedMessages = [...messages, userMessage, assistantPlaceholder];
    setMessages(updatedMessages);

    // Save user message
    if (user) {
      if (isGuest) {
        localStorage.setItem(
          LOCAL_STORAGE_MSGS_PREFIX + currentConv.id,
          JSON.stringify([...messages, userMessage])
        );
      } else {
        firestoreService.saveMessage(userMessage).catch(err => console.warn('Save user msg error:', err));
      }
    }

    // Prepare stream with AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);

    let accumulatedContent = '';

    await geminiClient.streamChat(
      [...messages, userMessage],
      {
        model: activeModel,
        language: settings.defaultLanguage,
        writingStyle: settings.writingStyle,
        responseLength: settings.responseLength,
        signal: controller.signal
      },
      (chunkText: string) => {
        accumulatedContent += chunkText;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
          )
        );
      },
      (errorMsg: string) => {
        setIsGenerating(false);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent || 'Sorry, I encountered an issue while generating a response. Please try again.',
                  isStreaming: false,
                  error: errorMsg
                }
              : m
          )
        );
      },
      async (finalContent: string) => {
        setIsGenerating(false);
        abortControllerRef.current = null;

        const finalizedMessage: Message = {
          ...assistantPlaceholder,
          content: finalContent || accumulatedContent,
          isStreaming: false
        };

        setMessages(prev =>
          prev.map(m => (m.id === assistantMsgId ? finalizedMessage : m))
        );

        // Persist final assistant message
        if (user) {
          const allMsgs = [...messages, userMessage, finalizedMessage];
          if (isGuest) {
            localStorage.setItem(LOCAL_STORAGE_MSGS_PREFIX + currentConv!.id, JSON.stringify(allMsgs));
            const updatedConvs = conversations.map(c =>
              c.id === currentConv!.id
                ? { ...c, title: newTitle, updatedAt: Date.now(), lastMessage: finalContent.slice(0, 60) }
                : c
            );
            setConversations(updatedConvs);
            localStorage.setItem(LOCAL_STORAGE_CONVS_PREFIX + user.uid, JSON.stringify(updatedConvs));
          } else {
            try {
              await firestoreService.saveMessage(finalizedMessage);
              await firestoreService.updateConversation(currentConv!.id, {
                title: newTitle,
                updatedAt: Date.now(),
                lastMessage: finalContent.slice(0, 80)
              });
            } catch (saveErr) {
              console.warn('Error persisting final message:', saveErr);
            }
          }
        }
      }
    );
  };

  // Regenerate last AI response
  const regenerateLastMessage = async () => {
    if (messages.length === 0 || isGenerating) return;
    const lastMsg = messages[messages.length - 1];
    let msgsToKeep = messages;
    if (lastMsg.role === 'assistant') {
      msgsToKeep = messages.slice(0, -1);
    }
    const lastUserMsg = msgsToKeep[msgsToKeep.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== 'user') return;

    setMessages(msgsToKeep);
    await sendMessage(lastUserMsg.content, lastUserMsg.attachments);
  };

  // Edit previous user message and re-generate
  const editAndResendMessage = async (messageId: string, newContent: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = messages[msgIndex];
    const msgsSlice = messages.slice(0, msgIndex);
    setMessages(msgsSlice);

    await sendMessage(newContent, targetMsg.attachments);
  };

  // Continue generating AI response
  const continueMessage = async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    await sendMessage('Please continue your response seamlessly from where you left off, providing further detail, insights, and next sections.');
  };

  // Quick text rewriting with style
  const quickRewriteMessage = async (messageId: string, style: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    await sendMessage(`Please rewrite your previous response in a "${style}" style/tone. Maintain core substance and accuracy.`);
  };

  // Quick translate into chosen language
  const quickTranslateMessage = async (messageId: string, targetLanguage: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    await sendMessage(`Please translate the previous response accurately and naturally into ${targetLanguage}. Use clear phrasing and native vocabulary.`);
  };

  // Document Library operations
  const saveDocumentToLibrary = async (docData: Omit<SavedDocument, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const newDocRecord: SavedDocument = {
      ...docData,
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.uid,
      createdAt: Date.now()
    };

    setSavedDocuments(prev => [newDocRecord, ...prev]);

    if (isGuest) {
      const updated = [newDocRecord, ...savedDocuments];
      localStorage.setItem(LOCAL_STORAGE_DOCS_PREFIX + user.uid, JSON.stringify(updated));
    } else {
      try {
        await firestoreService.saveDocument(newDocRecord);
      } catch (e) {
        console.warn('Error saving document to Firestore:', e);
      }
    }
  };

  const deleteDocumentFromLibrary = async (docId: string) => {
    setSavedDocuments(prev => prev.filter(d => d.id !== docId));
    if (user) {
      if (isGuest) {
        const updated = savedDocuments.filter(d => d.id !== docId);
        localStorage.setItem(LOCAL_STORAGE_DOCS_PREFIX + user.uid, JSON.stringify(updated));
      } else {
        await firestoreService.deleteDocument(docId);
      }
    }
  };

  const analyzeDocumentInChat = async (docRecord: SavedDocument, promptType: string = 'summary') => {
    setSelectedDocForAnalysis(docRecord);
    const newConv = await createNewConversation();
    let prompt = `I have loaded "${docRecord.name}". Please analyze this document.`;
    if (promptType === 'summary') {
      prompt = `Please provide a thorough, structured summary of "${docRecord.name}" highlighting the main topics, key takeaways, and conclusions.`;
    } else if (promptType === 'mcq') {
      prompt = `Please analyze "${docRecord.name}" and generate 15 high-quality Multiple Choice Questions (MCQs) complete with 4 options and answers for test preparation.`;
    } else if (promptType === 'notes') {
      prompt = `Please create comprehensive, bulleted study notes and quick-revision key concepts based on "${docRecord.name}".`;
    }

    const attachment: Attachment = {
      id: 'att_' + Date.now(),
      name: docRecord.name,
      type: 'pdf',
      mimeType: 'application/pdf',
      size: docRecord.fileSize,
      extractedText: docRecord.extractedTextPreview,
      status: 'ready',
      chunkCount: docRecord.chunkCount
    };

    await sendMessage(prompt, [attachment]);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        activeModel,
        isGenerating,
        activeAttachments,
        savedDocuments,
        searchQuery,
        isSearchOpen,
        selectedDocForAnalysis,
        loadingHistory,

        setActiveModel,
        setSearchQuery,
        setIsSearchOpen,
        createNewConversation,
        selectConversation,
        deleteConversation,
        sendMessage,
        stopGeneration,
        regenerateLastMessage,
        editAndResendMessage,
        continueMessage,
        addAttachmentFiles,
        removeAttachment,
        clearAttachments,
        saveDocumentToLibrary,
        deleteDocumentFromLibrary,
        analyzeDocumentInChat,
        quickRewriteMessage,
        quickTranslateMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
