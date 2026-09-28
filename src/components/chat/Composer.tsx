import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  Loader2,
  Languages,
  Zap,
  Mic,
  MicOff,
  Volume2,
  Radio,
  AlertCircle
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSettings } from '../../context/SettingsContext';
import { createSpeechRecognizer, isSpeechRecognitionSupported, LANGUAGE_SPEECH_TAGS } from '../../utils/voiceUtils';

interface ComposerProps {
  onFocusInput?: () => void;
}

export const Composer: React.FC<ComposerProps> = () => {
  const {
    sendMessage,
    isGenerating,
    stopGeneration,
    activeAttachments,
    addAttachmentFiles,
    removeAttachment,
    activeModel
  } = useChat();

  const { settings } = useSettings();

  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimVoiceText, setInterimVoiceText] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 180)}px`;
    }
  }, [input, interimVoiceText]);

  // Handle Speech Recognition toggle
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    setVoiceError(null);
    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = createSpeechRecognizer(
        settings.defaultLanguage,
        (transcript: string, isFinal: boolean) => {
          if (isFinal) {
            setInput(prev => {
              const base = prev.trim();
              return base ? `${base} ${transcript}` : transcript;
            });
            setInterimVoiceText('');
          } else {
            setInterimVoiceText(transcript);
          }
        },
        (errorMsg: string) => {
          setVoiceError(errorMsg);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
          setInterimVoiceText('');
        }
      );

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      }
    } catch (e: any) {
      console.warn('Could not start speech recognition:', e);
      setVoiceError('Could not access microphone. Please check permissions.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setInterimVoiceText('');
  };

  const handleSend = () => {
    if (isListening) {
      stopListening();
    }
    const textToSend = (input + (interimVoiceText ? ` ${interimVoiceText}` : '')).trim();
    if ((!textToSend && activeAttachments.length === 0) || isGenerating) return;
    sendMessage(textToSend);
    setInput('');
    setInterimVoiceText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addAttachmentFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addAttachmentFiles(e.dataTransfer.files);
    }
  };

  const hasUploading = activeAttachments.some(a => a.status === 'uploading' || a.status === 'processing');

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto px-2 sm:px-6 transition-all ${
        isDragging ? 'scale-[1.01]' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
        className="hidden"
      />

      {/* Voice listening pulse banner */}
      {isListening && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-indigo-950/90 border border-indigo-500/40 backdrop-blur-md flex items-center justify-between text-xs text-indigo-200 animate-in fade-in duration-200 shadow-lg shadow-indigo-950/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-white truncate">Listening...</span>
            <span className="text-slate-300 hidden sm:inline truncate">
              Speak in {settings.defaultLanguage || 'English'}
            </span>
            {/* Animated sound wave bars */}
            <div className="flex items-center gap-0.5 h-3 ml-0.5 shrink-0">
              <span className="w-0.5 bg-indigo-400 rounded-full h-2 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-0.5 bg-indigo-400 rounded-full h-3 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-0.5 bg-indigo-400 rounded-full h-1.5 animate-bounce"></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={stopListening}
              className="px-2 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
              title="Stop voice recording"
            >
              <MicOff className="w-3 h-3 text-white" />
              <span>Stop</span>
            </button>
            <button
              onClick={handleSend}
              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors shadow-xs flex items-center gap-1"
              title="Send recorded message"
            >
              <ArrowUp className="w-3 h-3 text-white" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}

      {/* Voice Error notice */}
      {voiceError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span className="truncate">{voiceError}</span>
          </div>
          <button
            onClick={() => setVoiceError(null)}
            className="text-rose-400 hover:text-white p-0.5 shrink-0 ml-2"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className={`rounded-2xl bg-[#111728]/95 backdrop-blur-xl border transition-all shadow-xl shadow-black/40 ${
          isListening
            ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-indigo-950/50'
            : isDragging
            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
            : 'border-slate-700/80 hover:border-slate-600 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/30'
        }`}
      >
        {/* Active Attachments Tray */}
        {activeAttachments.length > 0 && (
          <div className="px-2.5 sm:px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5 sm:gap-2 border-b border-slate-800/80">
            {activeAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 group max-w-[200px] sm:max-w-[240px] shadow-xs"
              >
                {att.status === 'processing' || att.status === 'uploading' ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                ) : att.type === 'pdf' ? (
                  <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : att.type === 'word' ? (
                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : att.type === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}

                <div className="truncate flex-1 min-w-0 font-medium text-[11px] sm:text-xs">
                  {att.name}
                </div>

                {att.status === 'ready' && (
                  <span className="text-[9px] sm:text-[10px] text-emerald-400 shrink-0 font-semibold">
                    Ready
                  </span>
                )}

                {att.status === 'error' && (
                  <span className="text-[9px] sm:text-[10px] text-red-400 shrink-0 font-semibold">
                    Failed
                  </span>
                )}

                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="p-1.5 sm:p-3 flex items-end gap-1 sm:gap-2">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors shrink-0"
            title="Attach MS Word (.docx), PDF, Image, or Notes"
            disabled={isGenerating}
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Expanding Textarea */}
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Speak now... listening to your voice..."
                  : activeAttachments.length > 0
                  ? "Ask about the attached file..."
                  : "Ask Nexora or click mic to speak..."
              }
              rows={1}
              disabled={isGenerating}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-[15px] focus:outline-hidden resize-none py-1.5 sm:py-2 px-1 max-h-[160px] sm:max-h-[180px] leading-relaxed"
            />
            {/* Interim live speech recognition ghost text */}
            {interimVoiceText && (
              <span className="text-indigo-300 italic text-xs sm:text-[15px] block px-1 pb-1">
                "{interimVoiceText}..."
              </span>
            )}
          </div>

          {/* Voice Input (Microphone) Option Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center ${
              isListening
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400 animate-pulse'
                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80'
            }`}
            title={isListening ? 'Click to stop voice recording' : 'Voice Input - Click to speak your prompt'}
            disabled={isGenerating}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              onClick={stopGeneration}
              className="p-2 sm:p-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-medium transition-all shadow-md shadow-rose-600/20 shrink-0 flex items-center justify-center animate-pulse"
              title="Stop Generating"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !interimVoiceText && activeAttachments.length === 0) || hasUploading}
              className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center ${
                input.trim() || interimVoiceText || activeAttachments.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Footer Subtext & Quick Indicators */}
        <div className="px-3 sm:px-4 pb-2 pt-0.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>{activeModel.replace('gemini-', 'Nexora ')}</span>
            </span>

            {settings.defaultLanguage !== 'Auto-detect' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 font-medium">
                <Languages className="w-3 h-3" />
                <span>{settings.defaultLanguage}</span>
              </span>
            )}
          </div>

          <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-2">
            <span className="hidden sm:inline">Voice & Text enabled •</span>
            <span className="hidden xs:inline">Shift + Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
