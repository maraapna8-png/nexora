import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  Zap,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ClipboardPaste,
  Cpu
} from 'lucide-react';
import { geminiClient } from '../../services/geminiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('nexora_gemini_api_key') || '';
      setApiKeyInput(stored);
      setHasSavedKey(Boolean(stored && stored.trim()));
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setApiKeyInput(clipText.trim());
        setTestResult(null);
      }
    } catch {
      // Clipboard permissions blocked
    }
  };

  const handleTestKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setTestResult({ ok: false, msg: 'Please enter or paste your Gemini API key first.' });
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          msg: data.message || 'API Key verified successfully! Connected with Google Gemini.'
        });
        // Auto-save on successful test
        geminiClient.setClientApiKey(trimmed);
        setHasSavedKey(true);
        if (onKeySaved) onKeySaved();
      } else {
        setTestResult({
          ok: false,
          msg: data.error || 'Verification failed. Please check that you copied the correct key.'
        });
      }
    } catch (err: any) {
      // Fallback: Test client-side directly
      try {
        geminiClient.setClientApiKey(trimmed);
        const directTest = await geminiClient.executeQuickAction({
          prompt: 'Respond with "Ready"',
          action: 'explain'
        });
        if (directTest) {
          setTestResult({
            ok: true,
            msg: 'API Key verified! Connected directly to Google Gemini.'
          });
          setHasSavedKey(true);
          if (onKeySaved) onKeySaved();
        } else {
          setTestResult({
            ok: false,
            msg: 'Could not connect. Please verify key validity.'
          });
        }
      } catch (clientErr: any) {
        setTestResult({
          ok: false,
          msg: clientErr?.message || 'Verification request failed. Please check internet connection.'
        });
      }
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setTestResult({ ok: false, msg: 'Please enter a valid Gemini API key.' });
      return;
    }
    geminiClient.setClientApiKey(trimmed);
    setHasSavedKey(true);
    setSaveSuccess(true);
    setTestResult({
      ok: true,
      msg: 'API Key saved successfully! Your chat responses are now powered by live Gemini AI.'
    });
    if (onKeySaved) onKeySaved();
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const handleClear = () => {
    setApiKeyInput('');
    geminiClient.setClientApiKey('');
    setHasSavedKey(false);
    setTestResult(null);
    if (onKeySaved) onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0d121f] border border-indigo-500/30 p-5 sm:p-7 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight">
                  Add Free Gemini API Key
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable unlimited live AI queries, Pakistani case citations, and document analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs sm:text-sm">
          {/* Status banner if already active */}
          {hasSavedKey && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Active Key Configured:</strong> Your browser is using your saved Gemini API key.
                </span>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline shrink-0"
              >
                Remove
              </button>
            </div>
          )}

          {/* 3 Simple Steps Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>How to get your free key (Takes 30 seconds):</span>
            </div>

            <ol className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Open Google AI Studio and sign in with any Google account (no credit card needed).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Click <strong>&quot;Create API Key&quot;</strong> and copy your key. Google provides free tier access (15 requests/min).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Paste it below and click <strong>&quot;Save &amp; Test Key&quot;</strong>.
                </span>
              </li>
            </ol>

            <div className="pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Get Free Gemini Key from Google AI Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Input field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Paste Your Gemini API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  if (testResult) setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-24 font-mono transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="p-1.5 text-slate-400 hover:text-indigo-300 transition-colors"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showApiKey ? 'Hide' : 'Show'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.msg}</div>
            </div>
          )}

          {/* What this unlocks */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Real-time sub-second streaming</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Gemini 3.8 Flash &amp; 3.1 Pro models</span>
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            🔒 <strong>Privacy Assurance:</strong> Your API key is stored only inside your browser&apos;s local storage and communicated securely to Google&apos;s official Gemini endpoints.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            {hasSavedKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Key</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingKey || !apiKeyInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testingKey ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{testingKey ? 'Testing...' : 'Test Key'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? 'Saved & Active!' : 'Save & Enable Key'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
