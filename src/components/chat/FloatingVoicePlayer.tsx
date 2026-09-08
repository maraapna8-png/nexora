import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Square, Play, Pause, FastForward } from 'lucide-react';
import { voicePlayer } from '../../utils/voiceUtils';

export const FloatingVoicePlayer: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);

  useEffect(() => {
    const unsubscribe = voicePlayer.subscribe((id, playing, paused) => {
      setActiveId(id);
      setIsPlaying(playing);
      setIsPaused(Boolean(paused));
    });
    return () => unsubscribe();
  }, []);

  if (!isPlaying || !activeId) {
    return null;
  }

  const handleStop = () => {
    voicePlayer.stop();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      voicePlayer.resume();
    } else {
      voicePlayer.pause();
    }
  };

  const handleSpeedCycle = () => {
    const nextSpeed = speed === 1.0 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 2.0 : 1.0;
    setSpeed(nextSpeed);
    // Restart current with new speed if needed
    if (window.speechSynthesis) {
      // update speed
    }
  };

  return (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-[#101728]/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-indigo-950/60 flex items-center justify-between gap-2.5">
        {/* Left: Status & Animated Equalizer */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Volume2 className="w-4 h-4 animate-pulse text-indigo-300" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {isPaused ? 'Voice Paused' : 'Reading Response Aloud'}
              </span>
              {!isPaused && (
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-0.5 bg-indigo-400 rounded-full h-2 animate-bounce"></span>
                  <span className="w-0.5 bg-indigo-400 rounded-full h-3 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-0.5 bg-indigo-400 rounded-full h-1.5 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-0.5 bg-indigo-400 rounded-full h-2.5 animate-bounce [animation-delay:-0.2s]"></span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {voicePlayer.getCurrentTextSnippet() || 'Speaking answer...'}
            </p>
          </div>
        </div>

        {/* Right: Controls (Pause/Play & STOP VOICE) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pause / Resume */}
          <button
            onClick={handlePauseResume}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title={isPaused ? 'Resume reading' : 'Pause reading'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Prominent Red Stop Button */}
          <button
            onClick={handleStop}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 ring-1 ring-rose-400/50 cursor-pointer"
            title="Stop voice playback"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
