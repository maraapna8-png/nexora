import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NamePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
}

export const NamePromptModal: React.FC<NamePromptModalProps> = ({ isOpen, onClose, initialName }) => {
  const { user, updateUserName } = useAuth();
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing =
        initialName ||
        localStorage.getItem('nexora_user_preferred_name') ||
        (user?.displayName && user.displayName !== 'Guest Writer' && user.displayName !== 'User' ? user.displayName : '');
      setNameInput(existing);
      setError('');
    }
  }, [isOpen, initialName, user?.displayName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Please enter your name to continue.');
      return;
    }
    await updateUserName(trimmed);
    localStorage.setItem('nexora_asked_user_name', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0d121f] border border-indigo-500/30 p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Nexora Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Welcome to Nexora
          </span>
        </div>

        {/* Title & Question */}
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
          What is your name?
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif">
          Let me know what to call you so I can personalize your Nexora experience and welcome you properly.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. abdullah"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-sm outline-hidden transition-all font-medium"
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Continue to Nexora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
          <span>You can change this anytime.</span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('nexora_asked_user_name', 'true');
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 hover:underline transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
