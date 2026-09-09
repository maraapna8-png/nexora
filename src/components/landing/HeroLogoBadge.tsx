import React from 'react';

export const HeroLogoBadge: React.FC = () => {
  return (
    <div className="relative my-6 flex items-center justify-center">
      {/* Ambient background aura */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 via-blue-600/25 to-purple-600/25 rounded-[36px] blur-2xl opacity-75 animate-pulse duration-1000 pointer-events-none" />
      
      {/* Exact Badge Card with original size and styling */}
      <div className="relative w-[210px] h-[210px] sm:w-[240px] sm:h-[240px] rounded-[30px] bg-[#070b14] p-2 border border-indigo-500/40 shadow-2xl shadow-indigo-950/90 overflow-hidden flex items-center justify-center group transition-transform duration-300 hover:scale-[1.02]">
        {/* Subtle inner gloss highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-black/40 pointer-events-none rounded-[28px]" />
        
        {/* Crisp Logo Image with preserved natural aspect ratio */}
        <img
          src="/logo.png"
          alt="Nexora Logo"
          className="w-full h-full object-contain rounded-[24px] relative z-10 select-none pointer-events-none"
        />

        {/* Corner specular shine */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
      </div>
    </div>
  );
};
