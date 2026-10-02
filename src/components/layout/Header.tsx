import React, { useState } from 'react';
import {
  Menu,
  Search,
  Sparkles,
  Sliders,
  ChevronDown,
  Plus,
  Zap,
  Cpu,
  Feather,
  Scale,
  Key
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { AIModelType } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenLegalCitation?: () => void;
  onOpenApiKey?: () => void;
  activeView: 'chat' | 'documents' | 'history';
  setActiveView: (view: 'chat' | 'documents' | 'history') => void;
}

const MODEL_LABELS: Record<string, { name: string; icon: any; badge: string; color: string }> = {
  'gemini-3.1-flash-lite': { name: 'Nexora 3.1 Flash Lite', icon: Zap, badge: 'Ultra Fast', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'gemini-3.8-flash': { name: 'Nexora 3.8 Flash', icon: Cpu, badge: 'Smart & Fast', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'gemini-3.1-pro-preview': { name: 'Nexora 3.1 Pro', icon: Feather, badge: 'Deep Reasoning', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  'gemini-2.5-flash': { name: 'Nexora 2.5 Flash', icon: Cpu, badge: 'Fast & Smart', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'gemini-2.5-pro': { name: 'Nexora 2.5 Pro', icon: Feather, badge: 'Deep Reasoning', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  'gemini-2.0-flash': { name: 'Nexora 2.0 Flash', icon: Zap, badge: 'Ultra Fast', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'gemini-2.0-flash-lite': { name: 'Nexora 2.0 Flash Lite', icon: Zap, badge: 'Ultra Fast', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
};

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSettings,
  onOpenSearch,
  onOpenLegalCitation,
  onOpenApiKey,
  activeView,
  setActiveView
}) => {
  const { activeConversation, activeModel, setActiveModel, createNewConversation } = useChat();
  const { user, isGuest } = useAuth();
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(localStorage.getItem('nexora_gemini_api_key')?.trim()));

  React.useEffect(() => {
    const checkKey = () => {
      setHasApiKey(Boolean(localStorage.getItem('nexora_gemini_api_key')?.trim()));
    };
    window.addEventListener('focus', checkKey);
    window.addEventListener('storage', checkKey);
    return () => {
      window.removeEventListener('focus', checkKey);
      window.removeEventListener('storage', checkKey);
    };
  }, []);

  const currentModelMeta = MODEL_LABELS[activeModel] || MODEL_LABELS['gemini-3.8-flash'];
  const CurrentModelIcon = currentModelMeta.icon;

  return (
    <header className="h-14 sm:h-16 border-b border-slate-800/80 bg-[#0d121f]/95 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Mobile Sidebar toggle & Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 max-w-[48%] sm:max-w-[55%]">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View title or Active Conversation Title */}
        <div className="flex items-center gap-2 min-w-0">
          {activeView === 'chat' ? (
            <span className="font-semibold text-slate-200 text-xs sm:text-sm md:text-base truncate">
              {activeConversation?.title || 'New Chat'}
            </span>
          ) : activeView === 'documents' ? (
            <span className="font-semibold text-slate-200 text-xs sm:text-sm md:text-base truncate">Saved Documents</span>
          ) : (
            <span className="font-semibold text-slate-200 text-xs sm:text-sm md:text-base truncate">History & Search</span>
          )}
        </div>
      </div>

      {/* Center/Right: Model Selector & Actions */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 hover:border-indigo-500/50 text-xs font-medium text-slate-200 transition-all shadow-xs"
            title="Select AI Model"
          >
            <CurrentModelIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline text-xs">{currentModelMeta.name}</span>
            <span className="sm:hidden text-xs">
              {activeModel === 'gemini-3.1-pro-preview' ? 'Pro' : activeModel === 'gemini-3.1-flash-lite' ? 'Lite' : 'Flash'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
          </button>

          {modelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 max-w-[90vw] rounded-xl bg-[#131929] border border-slate-700/80 shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Nexora Model
                </div>
                {(['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'] as AIModelType[]).map((mKey) => {
                  const meta = MODEL_LABELS[mKey];
                  const Icon = meta.icon;
                  const isSelected = activeModel === mKey;
                  return (
                    <button
                      key={mKey}
                      onClick={() => {
                        setActiveModel(mKey);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/15 border border-indigo-500/40 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-slate-800 text-indigo-400 mt-0.5 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold truncate">{meta.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${meta.color}`}>
                            {meta.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                          {mKey === 'gemini-3.1-flash-lite' ? 'Ultra fast sub-second responses' : mKey === 'gemini-3.8-flash' ? 'High speed & multimodal reasoning' : 'Complex reasoning & long files'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Free API Key Trigger Button */}
        <button
          onClick={() => {
            if (onOpenApiKey) onOpenApiKey();
            else window.dispatchEvent(new CustomEvent('open-api-key-modal'));
          }}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all shadow-xs shrink-0 ${
            hasApiKey
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
          }`}
          title={hasApiKey ? 'Gemini API Key Active (Click to manage)' : 'Add Free Gemini API Key from Google AI Studio'}
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-semibold">
            {hasApiKey ? 'API Key Active' : 'Free API Key'}
          </span>
          <span className="sm:hidden font-semibold">
            {hasApiKey ? 'Key' : 'Free Key'}
          </span>
          {hasApiKey ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          ) : (
            <span className="text-[10px] px-1 rounded-sm bg-amber-400/20 text-amber-300 font-bold shrink-0">
              FREE
            </span>
          )}
        </button>

        {/* Quick New Chat Button (Mobile Icon / Desktop Pill) */}
        <button
          onClick={() => {
            createNewConversation();
            setActiveView('chat');
          }}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all flex items-center gap-1.5"
          title="Start New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        {/* Cite Judgment Quick Button (Hidden on tiny mobile, accessible via sidebar & prompts) */}
        {onOpenLegalCitation && (
          <button
            onClick={onOpenLegalCitation}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all shadow-xs"
            title="Pakistani Judgment Citation Generator (PLD, SCMR, CLC)"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Pakistani Citation</span>
          </button>
        )}

        {/* Search Chats Trigger */}
        <button
          onClick={onOpenSearch}
          aria-label="Search chats"
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Search conversations (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings button - shown on sm: or when no user avatar */}
        {(!user || isGuest) && (
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Settings & Preferences"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* User profile bubble (also opens settings & account) */}
        {user && !isGuest && (
          <button
            onClick={onOpenSettings}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/30 shadow-md shrink-0 transition-transform active:scale-95"
            title={user.displayName || user.email || 'User Account & Settings'}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
            )}
          </button>
        )}
      </div>
    </header>
  );
};
