import React from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  FileText,
  Clock,
  Settings,
  LogOut,
  Trash2,
  X,
  Search,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Conversation } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'chat' | 'documents' | 'history';
  setActiveView: (view: 'chat' | 'documents' | 'history') => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenLegalCitation?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  onOpenSettings,
  onOpenSearch,
  onOpenLegalCitation
}) => {
  const {
    conversations,
    activeConversation,
    createNewConversation,
    selectConversation,
    deleteConversation,
    savedDocuments
  } = useChat();

  const { user, logout, isGuest } = useAuth();

  // Group conversations by time
  const groupConversations = (list: Conversation[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    list.forEach(c => {
      const cDate = new Date(c.updatedAt || c.createdAt);
      if (cDate >= today) {
        groups.Today.push(c);
      } else if (cDate >= yesterday) {
        groups.Yesterday.push(c);
      } else if (cDate >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(c);
      } else {
        groups.Older.push(c);
      }
    });

    return groups;
  };

  const grouped = groupConversations(conversations);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer / Fixed Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#090d16] border-r border-slate-800/90 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#090e1a] ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-600/20 shrink-0">
              <img 
                src="/logo.png" 
                alt="Nexora" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Nexora
              </span>
              <span className="text-[10px] block text-indigo-400/80 font-medium -mt-1">
                Nexora Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              createNewConversation();
              setActiveView('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 pb-2 space-y-1">
          <button
            onClick={() => {
              setActiveView('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Active Chat</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveView('documents');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${
              activeView === 'documents'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Saved Documents</span>
            </div>
            {savedDocuments.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                {savedDocuments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveView('history');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${
              activeView === 'history'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>History & Search</span>
            </div>
            <Search className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {onOpenLegalCitation && (
            <button
              onClick={() => {
                onOpenLegalCitation();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="group-hover:text-cyan-300">Cite Judgment</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-mono">
                Tool
              </span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="px-4 py-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Recent Chats
          </span>
          <button
            onClick={onOpenSearch}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            <span>Search</span>
          </button>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3">
          {conversations.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              No conversations yet.
              <br />
              Start a new chat to begin!
            </div>
          ) : (
            Object.entries(grouped).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {groupTitle}
                  </div>
                  {list.map(c => {
                    const isActive = activeConversation?.id === c.id && activeView === 'chat';
                    return (
                      <div
                        key={c.id}
                        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/15 text-indigo-200 font-medium border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                        }`}
                        onClick={() => {
                          selectConversation(c.id);
                          setActiveView('chat');
                          if (window.innerWidth < 1024) onClose();
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <span className="truncate">{c.title || 'Untitled Conversation'}</span>
                        </div>

                        {/* Delete conversation button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-400 transition-opacity rounded"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section: User Profile & Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070a12]/90 space-y-2">
          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & Preferences</span>
          </button>

          {/* User Account Info */}
          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (user?.displayName?.[0] || user?.email?.[0] || 'W').toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user?.displayName || 'Nexora User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  {isGuest ? (
                    <span className="text-amber-400 font-medium">Guest Session</span>
                  ) : (
                    <span>{user?.email || 'Authenticated'}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
