import React from 'react';

interface SvgIconProps {
  className?: string;
  size?: number;
}

// 1. Audited Precision & Cryptographic Proof
export function AuditedPrecisionSvg({ className = 'w-10 h-10', size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="shieldGlow" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0c1322" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M24 8L36 13V23C36 30.5 30.9 37.4 24 39.5C17.1 37.4 12 30.5 12 23V13L24 8Z" fill="url(#shieldGrad)" fillOpacity="0.2" stroke="url(#shieldGlow)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M19 23.5L22.5 27L29 19.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8" r="2" fill="#38bdf8" />
    </svg>
  );
}

// 2. Direct Brand Deals & Sponsorship Matchmaking
export function BrandDealsSvg({ className = 'w-10 h-10', size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dealGrad" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0c1322" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M11 20L18 13C19.6569 11.3431 22.3431 11.3431 24 13L27 16" stroke="url(#dealGrad)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M37 20L30 13C28.3431 11.3431 25.6569 11.3431 24 13L21 16" stroke="url(#dealGrad)" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="15" y="21" width="18" height="15" rx="4" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
      <path d="M21 28.5H27M24 25.5V31.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="20" r="2" fill="#7dd3fc" />
      <circle cx="33" cy="20" r="2" fill="#7dd3fc" />
    </svg>
  );
}

// 3. Multi-Platform Verified Reach (YouTube + Discord + Socials)
export function MultiPlatformSvg({ className = 'w-10 h-10', size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="platGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0c1322" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="14" stroke="url(#platGrad)" strokeWidth="2" strokeDasharray="3 3" />
      <rect x="18" y="18" width="12" height="12" rx="3" fill="#38bdf8" />
      <polygon points="23,21 27,24 23,27" fill="#020617" />
      <circle cx="14" cy="14" r="3.5" fill="#5865f2" />
      <circle cx="34" cy="14" r="3.5" fill="#e1306c" />
      <circle cx="24" cy="37" r="3" fill="#38bdf8" />
    </svg>
  );
}

// 4. Instant Passkey & Sovereignty
export function CryptoPassSvg({ className = 'w-10 h-10', size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="cardGrad" x1="8" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0c1322" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="10" y="14" width="28" height="20" rx="4" fill="url(#cardGrad)" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2.2" />
      <line x1="10" y1="20" x2="38" y2="20" stroke="#38bdf8" strokeWidth="2" />
      <rect x="14" y="25" width="6" height="4" rx="1" fill="#ffffff" />
      <line x1="24" y1="26" x2="34" y2="26" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="29" x2="30" y2="29" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 5. Freeze & Privacy Controls
export function PrivacyShieldSvg({ className = 'w-10 h-10', size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0c1322" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="11" stroke="#38bdf8" strokeWidth="2.2" />
      <line x1="24" y1="10" x2="24" y2="38" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="24" x2="38" y2="24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="14" x2="34" y2="34" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="34" x2="34" y2="14" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="#ffffff" />
    </svg>
  );
}

// 6. Verified Talent Network & Discoverability
export function GlobalTalentSvg({ className = 'w-10 h-10', size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="globeGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0c1322" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="13" stroke="url(#globeGrad)" strokeWidth="2.2" />
      <ellipse cx="24" cy="24" rx="6" ry="13" stroke="#7dd3fc" strokeWidth="1.6" />
      <line x1="11" y1="24" x2="37" y2="24" stroke="#7dd3fc" strokeWidth="1.6" />
      <circle cx="24" cy="17" r="2" fill="#ffffff" />
      <circle cx="28" cy="29" r="2" fill="#ffffff" />
    </svg>
  );
}

// 7. Step 1: Submit Details & Proof
export function Step1SubmitSvg({ className = 'w-8 h-8' }: SvgIconProps) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="8" width="24" height="20" rx="3.5" stroke="#38bdf8" strokeWidth="2.2" />
      <path d="M6 14L18 21L30 14" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="18" r="1.5" fill="#ffffff" />
    </svg>
  );
}

// 8. Step 2: Staff Proof Inspection
export function Step2AuditSvg({ className = 'w-8 h-8' }: SvgIconProps) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="8" stroke="#38bdf8" strokeWidth="2.2" />
      <path d="M22 22L29 29" stroke="#7dd3fc" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13 16L15.5 18.5L19.5 13.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 9. Step 3: Minting & Verification
export function Step3MintSvg({ className = 'w-8 h-8' }: SvgIconProps) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 4L22.5 13.5L33 15L25.5 22L27 32L18 27L9 32L10.5 22L3 15L13.5 13.5L18 4Z" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="18" cy="18" r="3" fill="#ffffff" />
    </svg>
  );
}

// 10. Philosophy: Zero Compromise on Verification
export function ZeroCompromiseSvg({ className = 'w-12 h-12', size = 48 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="zcGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.6" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0a101f" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M24 8L36 13V23C36 30.5 30.9 37.4 24 39.5C17.1 37.4 12 30.5 12 23V13L24 8Z" fill="url(#zcGrad)" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2.2" />
      <path d="M19 23.5L22.5 27L29 19.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8" r="2.5" fill="#7dd3fc" />
    </svg>
  );
}

// 11. Philosophy: Real-Time Synchronized Identity
export function RealtimeSyncSvg({ className = 'w-12 h-12', size = 48 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="rsGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0a101f" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M26 10L14 26H24L22 38L34 22H24L26 10Z" fill="url(#rsGrad)" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="14" cy="14" r="2" fill="#7dd3fc" />
      <circle cx="34" cy="34" r="2" fill="#7dd3fc" />
    </svg>
  );
}

// 12. Philosophy: Direct Creator Empowerment
export function EmpowermentSvg({ className = 'w-12 h-12', size = 48 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="empGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0a101f" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="14" stroke="#1e293b" strokeWidth="2" />
      <circle cx="24" cy="24" r="9" stroke="url(#empGrad)" strokeWidth="2.2" />
      <circle cx="24" cy="24" r="4" fill="#38bdf8" />
      <line x1="24" y1="6" x2="24" y2="10" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="42" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="24" x2="10" y2="24" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="24" x2="42" y2="24" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 13. Philosophy: Privacy & Security Guardrails
export function SecurityGuardrailsSvg({ className = 'w-12 h-12', size = 48 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sgGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0a101f" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="13" y="21" width="22" height="17" rx="4" fill="url(#sgGrad)" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2.2" />
      <path d="M18 21V16C18 12.6863 20.6863 10 24 10C27.3137 10 30 12.6863 30 16V21" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="28" r="2.5" fill="#ffffff" />
      <line x1="24" y1="30.5" x2="24" y2="34" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 14. Holographic 3D Step Badge (for 01, 02, 03)
export function HoloStepBadge({ number }: { number: string }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-600 opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />
      <div className="relative px-4 py-1.5 rounded-2xl bg-[#090d16] border border-sky-400/40 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-sky-400 font-extrabold text-3xl sm:text-4xl font-mono tracking-tight shadow-inner">
        {number}
      </div>
    </div>
  );
}
