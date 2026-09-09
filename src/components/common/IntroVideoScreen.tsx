import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, SkipForward, Sparkles } from 'lucide-react';

interface IntroVideoScreenProps {
  onComplete: () => void;
}

export const IntroVideoScreen: React.FC<IntroVideoScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'vortex' | 'logo' | 'flare'>('vortex');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthesized ambient chime when entering stages
  const playSoundEffect = (type: 'vortex' | 'reveal' | 'flare') => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'vortex') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.8);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        osc.start();
        osc.stop(ctx.currentTime + 2.1);
      } else if (type === 'reveal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        osc.start();
        osc.stop(ctx.currentTime + 2.1);
      } else if (type === 'flare') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.8); // E5
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        osc.start();
        osc.stop(ctx.currentTime + 1.9);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 550);
  };

  useEffect(() => {
    playSoundEffect('vortex');

    // Progression timeline (total 5.2s)
    const startTime = Date.now();
    const duration = 5200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (elapsed >= 1800 && elapsed < 3600) {
        setStage((prev) => {
          if (prev !== 'logo') playSoundEffect('reveal');
          return 'logo';
        });
      } else if (elapsed >= 3600) {
        setStage((prev) => {
          if (prev !== 'flare') playSoundEffect('flare');
          return 'flare';
        });
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        handleFinish();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#05070f] flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Cosmic Background */}
      <div className="absolute inset-0 bg-[#060814] overflow-hidden pointer-events-none">
        {/* Animated Radial Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/20 to-purple-600/25 rounded-full blur-[140px] animate-pulse duration-1000" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        {/* Ambient Cosmic Vortex Waves */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            stage === 'vortex' ? 'opacity-90 scale-105' : 'opacity-40 scale-110'
          }`}
        >
          <img 
            src="/src/assets/images/vortex_intro_bg_1788863745390.jpg" 
            alt="Cosmic Vortex" 
            className="w-full h-full object-cover animate-spin-slow opacity-80 mix-blend-screen"
            style={{ animationDuration: '28s' }}
          />
        </div>
      </div>

      {/* Center Cinematic Stage */}
      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center justify-center min-h-[460px]">
        {/* Stage 1: Vortex Tunnel Center */}
        {stage === 'vortex' && (
          <div className="relative flex flex-col items-center animate-in fade-in zoom-in-75 duration-700">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 blur-2xl opacity-80 animate-ping duration-1000" />
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#090e1a]/90 border border-cyan-400/40 shadow-2xl shadow-cyan-500/40 flex items-center justify-center p-3 animate-pulse">
                <img 
                  src="/logo.png" 
                  alt="Nexora Symbol" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(56,189,248,0.7)]" 
                />
              </div>
            </div>
            <span className="mt-8 text-xs sm:text-sm font-semibold tracking-widest uppercase bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
              Synthesizing Nexora Neural Core
            </span>
          </div>
        )}

        {/* Stage 2: Rising 3D Folded Ribbon 'N' Emblem */}
        {stage === 'logo' && (
          <div className="relative flex flex-col items-center animate-in fade-in zoom-in-90 duration-700">
            {/* Ambient Glow */}
            <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/40 via-blue-600/50 to-purple-600/50 rounded-[48px] blur-3xl animate-pulse duration-700" />
            
            {/* Crisp 3D Logo Card */}
            <div className="relative w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] rounded-[36px] bg-[#070b14]/95 p-3 border border-indigo-500/50 shadow-2xl shadow-indigo-950/90 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/50 pointer-events-none rounded-[34px]" />
              <img 
                src="/logo.png" 
                alt="Nexora 3D Logo" 
                className="w-full h-full object-contain rounded-[28px] relative z-10 filter drop-shadow-[0_10px_25px_rgba(30,58,138,0.8)]"
              />
            </div>
          </div>
        )}

        {/* Stage 3: Starburst Lens Flare & Typography Reveal */}
        {stage === 'flare' && (
          <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            {/* Expanding Lens Flare Light Beam */}
            <div className="absolute -inset-10 bg-gradient-to-r from-cyan-400/30 via-indigo-500/40 to-violet-500/40 rounded-full blur-[80px] pointer-events-none animate-pulse" />
            
            {/* The Full Glowing Flare Frame */}
            <div className="relative w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] rounded-[36px] bg-[#070b14]/95 p-2 border border-cyan-400/60 shadow-[0_0_50px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden">
              <img 
                src="/src/assets/images/logo_flare_frame_1788863779791.jpg" 
                alt="Nexora Radiant Flare" 
                className="w-full h-full object-contain rounded-[30px] relative z-10" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 backdrop-blur-md text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-black/50"
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>

        <button
          onClick={handleFinish}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/40 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 group active:scale-95"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Progress Bar & Brand Pill */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 w-full max-w-xs px-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 bg-slate-900/90 px-4 py-1.5 rounded-full border border-slate-700/80 backdrop-blur-md shadow-lg shadow-black/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Entering Nexora Workspace</span>
        </div>

        {/* Dynamic Progress indicator */}
        <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden ring-1 ring-slate-700/60 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-100 ease-linear rounded-full shadow-[0_0_10px_rgba(56,189,248,0.8)]"
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
