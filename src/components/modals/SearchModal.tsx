import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, ArrowRight, Calendar } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onOpenChat }) => {
  const { conversations, selectConversation } = useChat();
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTerm('');
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpenChat(); // will be triggered by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const results = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(term.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(term.toLowerCase())
  );

  const handleSelect = async (convId: string) => {
    await selectConversation(convId);
    onOpenChat();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#111728] border border-slate-700 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Type to search conversations, notes, and topics..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No matching conversations found.
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-850 border border-transparent hover:border-slate-700/80 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                      {c.title || 'Untitled'}
                    </span>
                  </div>
                  {c.lastMessage && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {c.lastMessage}
                    </p>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Modal Footer Key Tip */}
        <div className="px-4 py-2 bg-[#0d121f] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search conversations</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            ESC to close
          </span>
        </div>
      </div>
    </div>
  );
};
