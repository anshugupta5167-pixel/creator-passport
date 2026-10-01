import React from 'react';

interface CHQLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'card';
  disableRotate?: boolean;
}

export default function CHQLogo({
  className = '',
  size = 'md',
  showText = true,
  variant = 'default',
  disableRotate = false,
}: CHQLogoProps) {
  const isCard = variant === 'card';
  const shouldRotate = !disableRotate && !isCard;

  const iconSizes = {
    xs: isCard ? 'w-7 h-7 rounded-lg p-1' : 'w-7 h-7 rounded-lg p-1',
    sm: 'w-9 h-9 rounded-2xl p-2',
    md: 'w-11 h-11 rounded-2xl p-2',
    lg: 'w-14 h-14 rounded-2xl p-2.5',
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const containerStyle = isCard
    ? 'bg-black/50 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_2px_6px_rgba(0,0,0,0.6)] hover:border-sky-400/40 transition-colors duration-200'
    : `bg-gradient-to-br from-[#161a23] via-[#0e1117] to-[#07090d] border border-sky-500/25 shadow-[0_0_20px_rgba(14,165,233,0.12)] ${
        shouldRotate
          ? 'transition-all duration-700 ease-out group-hover:rotate-[360deg] group-hover:border-sky-400 group-hover:shadow-[0_0_28px_rgba(56,189,248,0.35)] animate-logo-entry'
          : 'transition-colors hover:border-sky-400'
      }`;

  return (
    <div className={`flex items-center gap-3.5 select-none ${shouldRotate ? 'group' : ''} cursor-pointer ${className}`}>
      {/* Custom Symbolic Logo: Sleek geometric insignia */}
      <div className="relative flex items-center justify-center">
        <div
          className={`${iconSizes[size]} relative ${containerStyle} flex items-center justify-center`}
          title="CreatorHQ"
        >
          {/* Subtle ambient glow backdrop */}
          {!isCard && (
            <div className="absolute inset-0 rounded-[inherit] bg-sky-500/10 blur-[8px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          )}

          {/* Precision Symbolic SVG Emblem (Camouflaged & ultra-crisp) */}
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10"
          >
            <defs>
              <linearGradient id={isCard ? "chqCardGrad" : "chqSymGrad1"} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                {isCard ? (
                  <>
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="60%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </>
                )}
              </linearGradient>
              <linearGradient id={isCard ? "chqCardCore" : "chqSymCore"} x1="18" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id={isCard ? "chqCardDark" : "chqDarkFacet"} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                {isCard ? (
                  <>
                    <stop offset="0%" stopColor="#1a1f2c" />
                    <stop offset="100%" stopColor="#0b0d12" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#1e2430" />
                    <stop offset="100%" stopColor="#0c0e13" />
                  </>
                )}
              </linearGradient>
            </defs>

            {/* Outer Hex-faceted Protective Arc */}
            <path
              d="M24 4L39 12.6V35.4L24 44L9 35.4V12.6L24 4Z"
              fill={isCard ? "url(#chqCardDark)" : "url(#chqDarkFacet)"}
              stroke={isCard ? "url(#chqCardGrad)" : "url(#chqSymGrad1)"}
              strokeWidth={isCard ? "2.4" : "2.2"}
              strokeLinejoin="round"
            />

            {/* Dynamic Inner Interlocking C-Prism */}
            <path
              d="M33 16.5C30.5 13.5 26.5 12 22 13C16.5 14.2 12.5 19 13 25C13.5 31 18.5 35.5 24.5 35C29 34.5 32.5 32 34 28.5L28.5 25.5C27.5 27.5 25.5 28.8 23 28.5C20 28.2 17.5 25.5 17.8 22.5C18.1 19.5 20.8 17.2 23.8 17.5C25.8 17.7 27.2 18.8 28.2 20.2L33 16.5Z"
              fill={isCard ? "url(#chqCardGrad)" : "url(#chqSymGrad1)"}
            />

            {/* Central Precision Play Core Symbol */}
            <path
              d="M22 19.5L30.5 24.5L22 29.5V19.5Z"
              fill={isCard ? "url(#chqCardCore)" : "url(#chqSymCore)"}
            />
          </svg>
        </div>
      </div>

      {/* Brand Name - Big, Bold, Clean (Subtext removed completely per user request) */}
      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} font-extrabold tracking-tight text-white font-sans group-hover:text-sky-300 transition-colors`}>
            CreatorHQ
          </span>
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] group-hover:scale-125 transition-transform" />
        </div>
      )}
    </div>
  );
}


