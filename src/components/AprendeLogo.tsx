import React from 'react';

interface AprendeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const AprendeLogo: React.FC<AprendeLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Glowing Brain + Grad Cap Logo Icon */}
      <div
        className={`relative ${iconSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-900/60 to-cyan-950/80 border border-cyan-500/40 p-1.5 shadow-[0_0_15px_rgba(0,210,255,0.25)] flex-shrink-0`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d2ff" />
              <stop offset="100%" stopColor="#0066ff" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00d2ff" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Graduation Cap */}
          <polygon
            points="24,4 40,11 24,18 8,11"
            fill="url(#logoGrad)"
            stroke="#b3c5ff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Cap Skull Base */}
          <path
            d="M14 14.5 V19 C14 22 20 23.5 24 23.5 C28 23.5 34 22 34 19 V14.5"
            stroke="#00d2ff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Tassel */}
          <path d="M37 11.5 V19" stroke="#b3c5ff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="37" cy="20.5" r="1.5" fill="#00d2ff" />

          {/* Neural Brain Network */}
          <g filter="url(#glowFilter)">
            {/* Left hemisphere nodes */}
            <circle cx="15" cy="28" r="2" fill="#00d2ff" />
            <circle cx="20" cy="33" r="2" fill="#0066ff" />
            <circle cx="13" cy="36" r="2" fill="#00d2ff" />
            <circle cx="21" cy="40" r="2" fill="#0066ff" />

            {/* Right hemisphere nodes */}
            <circle cx="33" cy="28" r="2" fill="#00d2ff" />
            <circle cx="28" cy="33" r="2" fill="#0066ff" />
            <circle cx="35" cy="36" r="2" fill="#00d2ff" />
            <circle cx="27" cy="40" r="2" fill="#0066ff" />

            {/* Center nodes */}
            <circle cx="24" cy="27" r="2" fill="#ffffff" />
            <circle cx="24" cy="35" r="2" fill="#b3c5ff" />

            {/* Synaptic Connections */}
            <path
              d="M15 28 L24 27 L33 28 M15 28 L20 33 L24 35 L28 33 L33 28 M13 36 L20 33 L21 40 M35 36 L28 33 L27 40 M21 40 L24 35 L27 40"
              stroke="#00d2ff"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1">
            <span className="font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans'] text-base md:text-lg">
              Aprende
            </span>
            <span className="font-extrabold tracking-tight text-cyan-400 font-['Plus_Jakarta_Sans'] text-base md:text-lg drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]">
              AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
