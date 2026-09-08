import React from 'react';

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  message = 'Initializing Nexora Workspace...' 
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#070a12] flex flex-col items-center justify-center text-slate-100 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/20 to-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Brand Identity Container */}
      <div className="relative flex flex-col items-center z-10 max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-700">
        {/* Glowing Logo Frame */}
        <div className="relative mb-6 group">
          {/* Animated Glow Halo */}
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-3xl blur-lg opacity-60 animate-pulse duration-1000" />
          
          {/* Logo Image */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#090e1a] p-1 ring-1 ring-white/20 shadow-2xl shadow-indigo-950/80 overflow-hidden flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Nexora Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
          Nexora
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 tracking-wide">
          Intelligent Writing & Document Analysis
        </p>

        {/* Loading Bar Indicator */}
        <div className="w-48 h-1.5 bg-slate-800/90 rounded-full mt-7 overflow-hidden relative ring-1 ring-slate-700/50">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full w-full origin-left animate-[loading_1.4s_ease-in-out_infinite]" />
        </div>

        {/* Status Text */}
        <p className="text-[11px] text-slate-500 font-mono mt-3">
          {message}
        </p>
      </div>
    </div>
  );
};
