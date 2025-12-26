
import React from 'react';

const Logo: React.FC<{ className?: string, showText?: boolean }> = ({ className = "w-8 h-8", showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-10 h-10 flex-shrink-0 bg-[#f4c430] rounded-lg flex items-center justify-center shadow-lg">
        {/* Simplified SVG representation of the cross/sun motif */}
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-[#143d2b]" fill="currentColor">
          <circle cx="50" cy="40" r="30" className="text-white/40" />
          <rect x="45" y="15" width="10" height="55" rx="2" />
          <rect x="30" y="30" width="40" height="10" rx="2" />
          <path d="M10 80 Q 50 60 90 80 L 90 90 L 10 90 Z" fill="#143d2b" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter leading-none text-white">GOD'S GRACE</span>
          <span className="text-[8px] font-bold tracking-[0.2em] text-[#f4c430] uppercase">Lawn & Landscape</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
