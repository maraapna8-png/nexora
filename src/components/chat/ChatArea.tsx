import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  FileSearch,
  PenTool,
  Image as ImageIcon,
  FileText,
  BookOpen,
  HelpCircle,
  Wand2,
  Languages,
  ChevronDown,
  Scale
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MessageItem } from './MessageItem';
import { Composer } from './Composer';
import { FloatingVoicePlayer } from './FloatingVoicePlayer';

interface ChatAreaProps {
  onOpenLegalCitation?: () => void;
}

interface PromptCard {
  title: string;
  subtitle: string;
  icon: any;
  prompt: string;
  color: string;
  onClickCustom?: () => void;
}

const EXAMPLE_PROMPTS: PromptCard[] = [
  {
    title: 'Cite Court Judgment',
    subtitle: 'Format citations for legal reports & briefs',
    icon: Scale,
    prompt: 'Create a standardized legal citation for reporting this judgment: [Enter Case Name, Court, Year, Volume, Reporter, Page/Paragraph, or paste raw judgment snippet]. Include Neutral Citation, Bluebook, OSCOLA, and Official Law Reporter formats with a concise Ratio Decidendi parenthetical.',
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
  },
  {
    title: 'Analyze this PDF',
    subtitle: 'Extract key insights, chapters & questions',
    icon: FileSearch,
    prompt: 'Please analyze the attached PDF, summarize its main thesis, and highlight the most critical takeaways.',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  },
  {
    title: 'Write an article',
    subtitle: 'SEO-ready, structured & engaging',
    icon: PenTool,
    prompt: 'Write an in-depth, engaging, and professional article about artificial intelligence transforming modern research and document analysis.',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  },
  {
    title: 'Explain this image',
    subtitle: 'Diagrams, handwritten notes & charts',
    icon: ImageIcon,
    prompt: 'Please analyze this uploaded image in detail. Transcribe all text, explain the key diagrams or visual charts, and summarize the core information.',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
  },
  {
    title: 'Summarize a document',
    subtitle: 'Executive summary & bullet points',
    icon: FileText,
    prompt: 'Provide a structured executive summary of this content with bulleted core takeaways, background context, and action items.',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  {
    title: 'Create study notes',
    subtitle: 'High-yield definitions & key concepts',
    icon: BookOpen,
    prompt: 'Generate clean, organized, high-yield study notes with definitions, key principles, and quick-revision memory triggers.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    title: 'Create 50 MCQs',
    subtitle: 'Exam test prep with 4 options & answers',
    icon: HelpCircle,
    prompt: 'Generate 20 comprehensive Multiple Choice Questions (MCQs) for exam preparation with 4 options (A, B, C, D), correct answers, and concise explanations.',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
  },
  {
    title: 'Rewrite professionally',
    subtitle: 'Improve grammar, vocabulary & tone',
    icon: Wand2,
    prompt: 'Please rewrite this text into a polished, high-impact professional tone with elevated vocabulary and seamless sentence flow.',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
  }
];

export const ChatArea: React.FC<ChatAreaProps> = ({ onOpenLegalCitation }) => {
  const { messages, sendMessage, isGenerating } = useChat();
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Smooth auto-scroll when new messages or chunks arrive
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handlePromptClick = (promptText: string) => {
    sendMessage(promptText);
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {isEmptyState ? (
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 flex flex-col items-center text-center">
            {/* Logo & Greeting */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#090e1a] ring-1 ring-indigo-500/40 shadow-2xl shadow-indigo-600/40 mb-5 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Nexora Logo" 
                className="w-full h-full object-cover" 
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How can I help you today?
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md">
              Nexora writes articles, analyzes PDF documents, understands images, and generates study notes with advanced AI.
            </p>

            {/* Example Prompt Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
              {EXAMPLE_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.title === 'Cite Court Judgment' && onOpenLegalCitation) {
                        onOpenLegalCitation();
                      } else {
                        handlePromptClick(item.prompt);
                      }
                    }}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-start gap-3 group shadow-xs hover:shadow-md"
                  >
                    <div className={`p-2 rounded-lg border ${item.color} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center justify-between">
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/30">
            {messages.map((msg, index) => {
              const isLastAssistant = index === messages.length - 1 && msg.role === 'assistant';
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isLastAssistant={isLastAssistant}
                />
              );
            })}
            <div ref={scrollEndRef} />
          </div>
        )}
      </div>

      {/* Floating Audio Playback Controls (Active when Voice is speaking) */}
      <FloatingVoicePlayer />

      {/* Fixed Bottom Composer Container */}
      <div className="shrink-0 pb-4 pt-2 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/95 to-transparent">
        <Composer />
      </div>
    </div>
  );
};
