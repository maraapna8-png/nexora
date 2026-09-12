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
  Scale
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { AIModelType } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenLegalCitation?: () => void;
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
  activeView,
  setActiveView
}) => {
  const { activeConversation, activeModel, setActiveModel, createNewConversation } = useChat();
  const { user } = useAuth();
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const currentModelMeta = MODEL_LABELS[activeModel] || MODEL_LABELS['gemini-3.8-flash'];
  const CurrentModelIcon = currentModelMeta.icon;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0d121f]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Mobile Sidebar toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View title or Active Conversation Title */}
        <div className="flex items-center gap-2">
          {activeView === 'chat' ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200 text-sm sm:text-base max-w-[140px] sm:max-w-[280px] md:max-w-[380px] truncate">
                {activeConversation?.title || 'New Conversation'}
              </span>
            </div>
          ) : activeView === 'documents' ? (
            <span className="font-semibold text-slate-200 text-base">Saved Documents</span>
          ) : (
            <span className="font-semibold text-slate-200 text-base">Chat History & Search</span>
          )}
        </div>
      </div>

      {/* Center/Right: Model Selector & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 hover:border-indigo-500/50 text-xs sm:text-sm font-medium text-slate-200 transition-all shadow-sm"
          >
            <CurrentModelIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{currentModelMeta.name}</span>
            <span className="sm:hidden">{activeModel === 'gemini-3.1-pro-preview' ? 'Pro' : 'Flash'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {modelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#131929] border border-slate-700/80 shadow-2xl p-1.5 z-40 space-y-1">
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/15 border border-indigo-500/40 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-slate-800 text-indigo-400 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{meta.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${meta.color}`}>
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

        {/* New Chat Quick Button */}
        <button
          onClick={() => {
            createNewConversation();
            setActiveView('chat');
          }}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        {/* Cite Judgment Quick Button */}
        {onOpenLegalCitation && (
          <button
            onClick={onOpenLegalCitation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all shadow-xs"
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
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Search conversations (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Settings & Preferences"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User profile bubble */}
        {user && (
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/20 shadow-md ml-1"
            title={user.displayName || user.email || 'User Profile'}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              (user.displayName?.[0] || user.email?.[0] || 'W').toUpperCase()
            )}
          </button>
        )}
      </div>
    </header>
  );
};
