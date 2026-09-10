import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Languages,
  Wand2,
  Sliders,
  Cpu,
  User as UserIcon,
  LogOut,
  Check,
  Zap,
  Feather
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeOption, LanguageOption, WritingStyleOption, ResponseLengthOption, AIModelType } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const { user, logout, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<'preferences' | 'model' | 'account'>('preferences');
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async (updates: any) => {
    await updateSettings(updates);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const LANGUAGES: LanguageOption[] = ['English', 'Urdu', 'Hindi', 'Arabic', 'Punjabi', 'Auto-detect'];
  const STYLES: WritingStyleOption[] = ['Professional', 'Academic', 'Simple', 'Friendly', 'Creative', 'Formal'];
  const LENGTHS: ResponseLengthOption[] = ['Short', 'Balanced', 'Detailed'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0f1422] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Settings & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-[#0d121e] gap-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preferences & Language
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'model'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Nexora AI Engine
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Account & Security
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {activeTab === 'preferences' && (
            <>
              {/* Appearance Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Appearance Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['dark', 'light', 'system'] as ThemeOption[]).map((theme) => {
                    const isSelected = settings.theme === theme;
                    return (
                      <button
                        key={theme}
                        onClick={() => handleUpdate({ theme })}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium capitalize transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-xs'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                      >
                        {theme === 'dark' && <Moon className="w-4 h-4" />}
                        {theme === 'light' && <Sun className="w-4 h-4" />}
                        {theme === 'system' && <Monitor className="w-4 h-4" />}
                        <span>{theme}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Language Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Default AI Language</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => {
                    const isSelected = settings.defaultLanguage === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => handleUpdate({ defaultLanguage: lang })}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Writing Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Default Writing Style</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLES.map((style) => {
                    const isSelected = settings.writingStyle === style;
                    return (
                      <button
                        key={style}
                        onClick={() => handleUpdate({ writingStyle: style })}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Response Length */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Default Response Depth
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LENGTHS.map((len) => {
                    const isSelected = settings.responseLength === len;
                    return (
                      <button
                        key={len}
                        onClick={() => handleUpdate({ responseLength: len })}
                        className={`p-2.5 rounded-lg border text-center text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        {len}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'model' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Choose the primary Nexora AI model used for text generation, complex document extraction, and multimodal vision:
              </div>

              {[
                {
                  id: 'gemini-3.1-flash-lite',
                  name: 'Nexora 3.1 Flash Lite',
                  badge: 'Ultra Fast (Fastest)',
                  icon: Zap,
                  desc: 'Sub-second response latency, instant streaming, fast voice dictation & quick document insights.'
                },
                {
                  id: 'gemini-3.8-flash',
                  name: 'Nexora 3.8 Flash',
                  badge: 'Smart & Fast',
                  icon: Cpu,
                  desc: 'High-speed multimodal responses, ideal for everyday writing, in-depth PDF Q&A, and comprehensive analyses.'
                },
                {
                  id: 'gemini-3.1-pro-preview',
                  name: 'Nexora 3.1 Pro',
                  badge: 'Deep Reasoning',
                  icon: Feather,
                  desc: 'State-of-the-art capability for lengthy multi-chapter documents, complex research synthesis, and intricate reasoning.'
                }
              ].map((m) => {
                const isSelected = settings.preferredModel === m.id;
                const Icon = m.icon;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleUpdate({ preferredModel: m.id as AIModelType })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span>{m.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300">
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-white text-base font-bold shadow-md">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      (user?.displayName?.[0] || user?.email?.[0] || 'W').toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">{user?.displayName || 'Nexora User'}</h3>
                    <p className="text-xs text-slate-400">{user?.email || 'Guest Mode'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-500">Session Status:</span>{' '}
                    <span className="text-slate-200">{isGuest ? 'Guest (Local Persistence)' : 'Firebase Authenticated (Cloud Sync)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Data Isolation:</span>{' '}
                    <span className="text-emerald-400">Strict User-Scoped Rules</span>
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0c101c] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {saveToast ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                Settings saved!
              </span>
            ) : (
              <span>Changes apply immediately</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
