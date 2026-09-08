import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Cpu, Compass } from 'lucide-react';

const THINKING_STEPS = [
  'Analyzing your prompt...',
  'Synthesizing concise answer...',
  'Extracting key insights...',
  'Formatting short response...'
];

export const ThinkingIndicator: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 1400);

    const timerInterval = setInterval(() => {
      setElapsed((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="py-2.5 px-3.5 sm:px-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/30 backdrop-blur-md shadow-lg shadow-indigo-950/30 max-w-xl animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header: Step Text & Glowing Indicator */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {/* Animated Glowing Orb */}
          <div className="relative flex items-center justify-center">
            <span className="absolute w-5 h-5 rounded-full bg-indigo-500/40 animate-ping"></span>
            <span className="relative w-3.5 h-3.5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm shadow-indigo-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-200 tracking-wide transition-all duration-300">
                {THINKING_STEPS[stepIndex]}
              </span>
              {/* Equalizer animation */}
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 bg-indigo-400 rounded-full h-2 animate-bounce"></span>
                <span className="w-0.5 bg-purple-400 rounded-full h-3.5 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-0.5 bg-indigo-300 rounded-full h-1.5 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-0.5 bg-violet-400 rounded-full h-2.5 animate-bounce [animation-delay:-0.2s]"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Speed / Elapsed Timer Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
          <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
          <span>{elapsed.toFixed(1)}s</span>
        </div>
      </div>

      {/* Shimmering Skeleton Loader Bars */}
      <div className="space-y-2">
        <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden w-4/5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite_200ms]"></div>
        </div>
        <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden w-3/5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite_400ms]"></div>
        </div>
      </div>
    </div>
  );
};
