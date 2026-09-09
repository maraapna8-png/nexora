import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCcw,
  Edit2,
  Play,
  Bookmark,
  Download,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  Languages,
  Wand2,
  FileDown,
  Volume2,
  VolumeX,
  Square,
  Radio
} from 'lucide-react';
import { Message, Attachment } from '../../types';
import { copyToClipboard, downloadAsPlainText, downloadAsMarkdown, downloadAsPDF } from '../../utils/exportUtils';
import { useChat } from '../../context/ChatContext';
import { useSettings } from '../../context/SettingsContext';
import { voicePlayer } from '../../utils/voiceUtils';
import { ThinkingIndicator } from './ThinkingIndicator';

interface MessageItemProps {
  message: Message;
  isLastAssistant: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isLastAssistant }) => {
  const {
    regenerateLastMessage,
    editAndResendMessage,
    continueMessage,
    saveDocumentToLibrary,
    quickRewriteMessage,
    quickTranslateMessage,
    isGenerating
  } = useChat();

  const { settings } = useSettings();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [rewriteMenuOpen, setRewriteMenuOpen] = useState(false);
  const [translateMenuOpen, setTranslateMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  const isUser = message.role === 'user';

  // Listen to voicePlayer updates
  useEffect(() => {
    const unsubscribe = voicePlayer.subscribe((activeId, playing) => {
      if (activeId === message.id) {
        setIsSpeaking(playing);
      } else {
        setIsSpeaking(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [message.id]);

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      voicePlayer.stop();
      setIsSpeaking(false);
    } else {
      voicePlayer.speak(
        message.id,
        message.content,
        settings.defaultLanguage || 'English',
        speechRate,
        () => setIsSpeaking(false)
      );
    }
  };

  const cycleSpeechRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = speechRate === 1.0 ? 1.25 : speechRate === 1.25 ? 1.5 : 1.0;
    setSpeechRate(nextRate);
    if (isSpeaking) {
      voicePlayer.speak(
        message.id,
        message.content,
        settings.defaultLanguage || 'English',
        nextRate,
        () => setIsSpeaking(false)
      );
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveDoc = async () => {
    await saveDocumentToLibrary({
      name: `AI Report - ${message.content.slice(0, 24).replace(/[^a-zA-Z0-9 ]/g, '') || 'Note'}`,
      fileType: 'text',
      fileSize: new Blob([message.content]).size,
      status: 'ready',
      extractedTextPreview: message.content.slice(0, 300),
      fullTextLength: message.content.length,
      chunkCount: 1,
      relatedConversationId: message.conversationId
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const REWRITE_STYLES = [
    'Professional',
    'Simple',
    'Shorter',
    'Longer',
    'Grammar correction',
    'Better vocabulary',
    'Formal',
    'Friendly',
    'Academic'
  ];

  const TRANSLATE_LANGS = [
    { label: 'Urdu (اردو)', value: 'Urdu' },
    { label: 'Hindi (हिंदी)', value: 'Hindi' },
    { label: 'Arabic (العربية)', value: 'Arabic' },
    { label: 'Punjabi (ਪੰਜਾਬੀ)', value: 'Punjabi' },
    { label: 'English', value: 'English' }
  ];

  return (
    <div
      className={`py-4 px-4 sm:px-8 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#0f1422]/60 border-y border-slate-800/40'
      }`}
    >
      <div className={`max-w-4xl mx-auto flex items-start gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold shadow-xs">
              You
            </div>
          ) : (
            <div
              className={`relative w-8 h-8 rounded-xl overflow-hidden bg-[#080d19] flex items-center justify-center transition-all duration-300 ${
                message.isStreaming
                  ? 'ring-2 ring-indigo-400/80 shadow-lg shadow-indigo-500/40 animate-pulse-glow'
                  : 'shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/40'
              }`}
            >
              <img
                src="/logo.png"
                alt="Nexora Logo"
                className="w-full h-full object-cover rounded-xl"
              />
              {message.isStreaming && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content & Actions */}
        <div className={`min-w-0 ${isUser ? 'flex flex-col items-end max-w-[85%] sm:max-w-[75%]' : 'flex-1'}`}>
          {/* Header Role/Name & Model badge */}
          <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : 'justify-between'}`}>
            <span className="text-xs font-semibold text-slate-200">
              {isUser ? 'You' : 'Nexora'}
            </span>
            {!isUser && message.model && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 font-mono">
                {message.model.replace('gemini-', 'Nexora ')}
              </span>
            )}
            {message.isStreaming && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[10px] text-indigo-300 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                <span>Generating short response...</span>
              </span>
            )}
          </div>

          {/* Attachments preview if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-3 ${isUser ? 'justify-end' : ''}`}>
              {message.attachments.map((att: Attachment) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-300 max-w-xs truncate shadow-xs"
                >
                  {att.type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : att.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate font-medium">{att.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {(att.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Message Body */}
          {isEditing ? (
            <div className="mt-2 space-y-2 w-full">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-indigo-500/50 text-slate-100 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-y min-h-[100px]"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    editAndResendMessage(message.id, editText);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save & Re-generate
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isUser ? (
            <div className="rounded-2xl rounded-tr-xs bg-indigo-600/90 text-white px-4 py-2.5 shadow-md border border-indigo-500/40 text-sm sm:text-[15px] leading-relaxed break-words text-left">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            <div className="markdown-body text-sm sm:text-[15px] leading-relaxed break-words">
              {message.content ? (
                <div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 rounded-xs animate-pulse align-middle" />
                  )}
                </div>
              ) : (
                <ThinkingIndicator />
              )}
            </div>
          )}

          {/* Action Toolbar for AI responses */}
          {!isUser && message.content && !message.isStreaming && (
            <div className="mt-4 pt-2 border-t border-slate-800/40 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Voice Read Aloud / Stop Button */}
              <div className="flex items-center">
                {isSpeaking ? (
                  <button
                    onClick={handleVoiceToggle}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 ring-1 ring-rose-400 animate-pulse transition-all"
                    title="Click to Stop Voice Playback"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop Voice</span>
                    <span className="flex items-center gap-0.5 ml-0.5">
                      <span className="w-1 bg-white rounded-full h-2 animate-bounce"></span>
                      <span className="w-1 bg-white rounded-full h-3 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 bg-white rounded-full h-1.5 animate-bounce [animation-delay:-0.3s]"></span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleVoiceToggle}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 text-xs"
                    title="Listen to answer (Read Aloud Voice)"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Voice</span>
                  </button>
                )}

                {isSpeaking && (
                  <button
                    onClick={cycleSpeechRate}
                    className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-indigo-200 hover:text-white font-mono"
                    title="Change voice speed"
                  >
                    {speechRate}x
                  </button>
                )}
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Regenerate button */}
              {isLastAssistant && (
                <button
                  onClick={() => regenerateLastMessage()}
                  disabled={isGenerating}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs disabled:opacity-50"
                  title="Regenerate answer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              )}

              {/* Continue button */}
              <button
                onClick={() => continueMessage(message.id)}
                disabled={isGenerating}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs disabled:opacity-50"
                title="Continue response"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Continue</span>
              </button>

              {/* Save to Document Library */}
              <button
                onClick={handleSaveDoc}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
                title="Save as Document"
              >
                {savedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{savedSuccess ? 'Saved' : 'Save'}</span>
              </button>

              {/* Quick Rewrite Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setRewriteMenuOpen(!rewriteMenuOpen);
                    setTranslateMenuOpen(false);
                    setDownloadMenuOpen(false);
                  }}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
                  title="Rewrite in style"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rewrite</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {rewriteMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setRewriteMenuOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-2 w-44 rounded-xl bg-[#131929] border border-slate-700 shadow-xl p-1 z-40 space-y-0.5">
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase">
                        Select Rewrite Style
                      </div>
                      {REWRITE_STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => {
                            quickRewriteMessage(message.id, style);
                            setRewriteMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quick Translate Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setTranslateMenuOpen(!translateMenuOpen);
                    setRewriteMenuOpen(false);
                    setDownloadMenuOpen(false);
                  }}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
                  title="Translate response"
                >
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Translate</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {translateMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setTranslateMenuOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-2 w-44 rounded-xl bg-[#131929] border border-slate-700 shadow-xl p-1 z-40 space-y-0.5">
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase">
                        Translate Output
                      </div>
                      {TRANSLATE_LANGS.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => {
                            quickTranslateMessage(message.id, lang.value);
                            setTranslateMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Download Options Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDownloadMenuOpen(!downloadMenuOpen);
                    setRewriteMenuOpen(false);
                    setTranslateMenuOpen(false);
                  }}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
                  title="Download File"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {downloadMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDownloadMenuOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl bg-[#131929] border border-slate-700 shadow-xl p-1 z-40 space-y-0.5">
                      <button
                        onClick={() => {
                          downloadAsPlainText('nexora-response', message.content);
                          setDownloadMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Plain Text (.txt)</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadAsMarkdown('nexora-response', message.content);
                          setDownloadMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Markdown (.md)</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadAsPDF('nexora-response', message.content);
                          setDownloadMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>PDF (.pdf)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Edit button for User message */}
          {isUser && !isEditing && (
            <div className="mt-1 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
