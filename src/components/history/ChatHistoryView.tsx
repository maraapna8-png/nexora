import React, { useState } from 'react';
import {
  Clock,
  Search,
  MessageSquare,
  Trash2,
  Calendar,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ChatHistoryViewProps {
  onOpenChat: () => void;
}

export const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({ onOpenChat }) => {
  const { conversations, selectConversation, deleteConversation, createNewConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = async (convId: string) => {
    await selectConversation(convId);
    onOpenChat();
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-emerald-400" />
            <span>Chat History & Search</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, search, and continue any of your previous conversations and research sessions.
          </p>
        </div>

        <button
          onClick={() => {
            createNewConversation();
            onOpenChat();
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within chat titles or snippets..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          <span className="font-semibold text-white">{filtered.length}</span> conversations
        </div>
      </div>

      {/* Conversation List */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-semibold">No matching conversations found</p>
            <p className="text-xs text-slate-500 mt-1">Try another search keyword or create a new conversation.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                    {c.title || 'Untitled Conversation'}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                    {c.model ? c.model.replace('gemini-', 'Nexora ') : 'Nexora'}
                  </span>
                </div>

                {c.lastMessage && (
                  <p className="text-xs text-slate-400 truncate max-w-xl">
                    {c.lastMessage}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(c.updatedAt || c.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-indigo-300 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
