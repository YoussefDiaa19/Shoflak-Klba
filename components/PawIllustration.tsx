
import React from 'react';

const PawIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Toes */}
    <circle cx="22" cy="42" r="12" />
    <circle cx="40" cy="24" r="12" />
    <circle cx="64" cy="24" r="12" />
    <circle cx="82" cy="42" r="12" />
    {/* Main Pad */}
    <path d="M52 48 C 30 48, 20 65, 25 85 C 30 100, 75 100, 80 85 C 85 65, 75 48, 52 48 Z" />
  </svg>
);

export const PawIllustration: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`relative w-32 h-48 text-zinc-400/20 dark:text-zinc-500/10 ${className}`}>
    {/* Paw 1 - Top Left */}
    <div className="absolute top-0 left-0 animate-in fade-in zoom-in duration-700 delay-100 fill-mode-both">
      <PawIcon className="w-10 h-10 -rotate-12" />
    </div>
    
    {/* Paw 2 - Top Right, slightly lower */}
    <div className="absolute top-8 left-16 animate-in fade-in zoom-in duration-700 delay-200 fill-mode-both">
      <PawIcon className="w-10 h-10 rotate-12" />
    </div>
    
    {/* Paw 3 - Middle Left */}
    <div className="absolute top-20 left-4 animate-in fade-in zoom-in duration-700 delay-300 fill-mode-both">
      <PawIcon className="w-10 h-10 -rotate-6" />
    </div>
    
    {/* Paw 4 - Middle Right */}
    <div className="absolute top-28 left-20 animate-in fade-in zoom-in duration-700 delay-400 fill-mode-both">
      <PawIcon className="w-10 h-10 rotate-12" />
    </div>
    
    {/* Paw 5 - Bottom Right */}
    <div className="absolute top-40 left-16 animate-in fade-in zoom-in duration-700 delay-500 fill-mode-both">
      <PawIcon className="w-10 h-10 rotate-6" />
    </div>
  </div>
);
