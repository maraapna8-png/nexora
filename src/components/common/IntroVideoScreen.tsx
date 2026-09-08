import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, SkipForward, Sparkles } from 'lucide-react';

interface IntroVideoScreenProps {
  onComplete: () => void;
}

export const IntroVideoScreen: React.FC<IntroVideoScreenProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        setHasStarted(true);
      }).catch((err) => {
        console.log('Autoplay muted attempt:', err);
        video.muted = true;
        video.play().catch(() => setVideoError(true));
      });
    }

    // Safety timeout in case video stalls or fails to trigger ended event
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 8500);

    return () => clearTimeout(safetyTimer);
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#05070d] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient gradient lighting */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-black to-purple-950/30 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/10 via-purple-600/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Intro Video Element */}
      <div className="relative w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center p-4">
        {!videoError ? (
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleFinish}
            onError={() => setVideoError(true)}
            className="w-full h-full object-contain rounded-2xl shadow-2xl shadow-indigo-950/60 ring-1 ring-slate-800/60"
          />
        ) : (
          /* Fallback dynamic visual in case browser blocks video element */
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-3xl blur-xl opacity-70 animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Nexora" 
                className="relative w-32 h-32 rounded-2xl object-cover ring-1 ring-white/20 shadow-2xl" 
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Nexora</h1>
            <p className="text-sm text-slate-400 font-medium">Next-Gen Document Intelligence & AI Studio</p>
          </div>
        )}
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <button
          onClick={toggleMute}
          className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-black/40"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>

        <button
          onClick={handleFinish}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 group active:scale-95"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Progress Bar & Brand Pill */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20 w-full max-w-xs px-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Entering Nexora Intelligence</span>
        </div>

        {/* Dynamic Progress indicator */}
        <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden ring-1 ring-slate-700/40">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-150 ease-linear rounded-full"
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
