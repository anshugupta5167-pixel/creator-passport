'use client';

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  RotateCw,
  Copy,
  ExternalLink,
  Snowflake,
  ShieldCheck,
  BadgeCheck,
  Lock,
  Sparkles
} from 'lucide-react';
import { CreatorProfile } from '@/lib/types';
import confetti from 'canvas-confetti';
import CHQLogo from '@/components/CHQLogo';
import { getSafeAvatarUrl } from '@/lib/urls';
import { subscribeToCreatorSync } from '@/lib/sync';

interface PassportCardProps {
  creator: CreatorProfile;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showControls?: boolean;
  className?: string;
  allowFreeze?: boolean;
  allowThemes?: boolean;
}

export type CardTheme = 'obsidian' | 'titanium' | 'navy' | 'gold';

export default function PassportCard({
  creator,
  interactive = true,
  size = 'hero',
  showControls = true,
  className = '',
  allowFreeze = true,
  allowThemes = true,
}: PassportCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [theme, setTheme] = useState<CardTheme>('obsidian');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [cardCreator, setCardCreator] = useState<CreatorProfile>(creator);
  const cardRef = useRef<HTMLDivElement>(null);
  const cleanSlug = (cardCreator.slug || cardCreator.username || cardCreator.passportId || 'creator').toLowerCase().replace(/^@/, '').trim();

  // Keep cardCreator in sync with props
  useEffect(() => {
    setCardCreator(creator);
  }, [creator]);

  // Subscribe to real-time status and profile updates from admin and database
  useEffect(() => {
    const unsubscribe = subscribeToCreatorSync((payload) => {
      const clean = (cleanSlug || '').toLowerCase();
      const payloadSlug = (payload.slug || '').toLowerCase();
      if (payloadSlug === clean || (payload.creator && (payload.creator.slug || '').toLowerCase() === clean)) {
        if (payload.creator) {
          setCardCreator(payload.creator);
        } else if (payload.status) {
          setCardCreator((prev) => ({
            ...prev,
            verification_status: payload.status as any,
            isVerified: payload.isVerified ?? payload.status === 'VERIFIED',
          }));
        }
      }
    });
    return unsubscribe;
  }, [cleanSlug]);

  // Generate dynamic QR code matching profile URL (https://creatorhq.fun/{slug})
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://creatorhq.fun';
    const profileUrl = `${origin}/${cleanSlug}`;

    QRCode.toDataURL(profileUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: isFrozen ? '#0284c7' : '#0b0d11',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [cleanSlug, isFrozen]);

  // Enhanced 3D tilt tracking on mouse hover with realistic physics
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || isFlipped) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 11;
    const rotY = ((x - centerX) / centerX) * 11;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 0.18 });
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setRotateX(0);
    setRotateY(0);
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const copyPassportId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`@${cleanSlug}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyPassportLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://creatorhq.fun';
    navigator.clipboard.writeText(`${origin}/${cleanSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFreeze = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isFrozen;
    setIsFrozen(nextState);
    if (!nextState) {
      try {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.7 },
        });
      } catch (err) {}
    }
  };

  // Generate a formatted physical card number (e.g. CHQ · 0084 · 2910)
  const passportSeq = React.useMemo(() => {
    if (creator.passportId) {
      const numOnly = creator.passportId.replace(/[^0-9]/g, '');
      if (numOnly.length >= 4) {
        const padded = numOnly.padEnd(8, '0').slice(0, 8);
        return `${padded.slice(0, 4)} · ${padded.slice(4, 8)}`;
      }
    }
    // Deterministic hash from slug
    let hash = 0;
    for (let i = 0; i < cleanSlug.length; i++) {
      hash = (hash << 5) - hash + cleanSlug.charCodeAt(i);
      hash |= 0;
    }
    const abs = Math.abs(hash).toString().padStart(8, '4');
    return `${abs.slice(0, 4)} · ${abs.slice(4, 8)}`;
  }, [creator.passportId, cleanSlug]);

  // Dimensions based on size preset
  const sizeClasses = {
    sm: 'w-[320px] h-[202px] text-[10px]',
    md: 'w-[420px] h-[265px] text-xs',
    lg: 'w-[520px] h-[328px] text-sm',
    hero: 'w-full max-w-[560px] aspect-[1.586/1]',
  }[size];

  // Theme styling with fine metallic surfaces
  const themeStyles: Record<CardTheme, { bg: string; border: string; accent: string }> = {
    obsidian: {
      bg: 'bg-gradient-to-br from-[#121418] via-[#0d0f12] to-[#08090b]',
      border: 'border-white/[0.12] hover:border-white/25',
      accent: 'text-sky-400',
    },
    titanium: {
      bg: 'bg-gradient-to-br from-[#1e222b] via-[#14171d] to-[#0c0e12]',
      border: 'border-white/20 hover:border-white/35',
      accent: 'text-slate-200',
    },
    navy: {
      bg: 'bg-gradient-to-br from-[#0c1626] via-[#080f1b] to-[#050912]',
      border: 'border-sky-500/25 hover:border-sky-400/40',
      accent: 'text-sky-400',
    },
    gold: {
      bg: 'bg-gradient-to-br from-[#1b1710] via-[#120f09] to-[#0a0805]',
      border: 'border-amber-500/25 hover:border-amber-400/40',
      accent: 'text-amber-400',
    },
  };

  const currentTheme = themeStyles[theme];
  const isVerified = Boolean(cardCreator.isVerified || cardCreator.verification_status === 'VERIFIED');
  const isRejected = cardCreator.verification_status === 'REJECTED';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Perspective Card Container */}
      <div
        className={`perspective-1000 relative group transition-all duration-300 ${sizeClasses}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          className={`relative w-full h-full duration-300 ease-out preserve-3d cursor-pointer ${
            isFrozen ? 'card-frozen' : ''
          }`}
          style={{
            transform: isFlipped
              ? 'rotateY(180deg)'
              : `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            boxShadow: isFrozen
              ? '0 20px 45px rgba(2, 132, 199, 0.28), 0 0 25px rgba(56, 189, 248, 0.3)'
              : `${-rotateY * 1.5}px ${rotateX * 1.5 + 18}px 40px -12px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 255, 255, 0.03)`,
            transformStyle: 'preserve-3d',
            willChange: 'transform, box-shadow',
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* ================= CARD FRONT (CLEAN ORIGINAL LUXURY LAYOUT) ================= */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[1.25rem] ${currentTheme.bg} ${currentTheme.border} border overflow-hidden backface-hidden shadow-2xl flex flex-col justify-between p-6 sm:p-7 z-10 transition-all duration-300`}
          >
            {/* Top metallic highlight hairline */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Subtle brushed metal hairline highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none" />

            {/* Specular light tracking */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
              }}
            />

            {/* FROSTED GLASS OVERLAY WHEN FROZEN */}
            {isFrozen && (
              <div className="absolute inset-0 z-30 bg-[#071321]/75 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-2 border border-sky-400/40 rounded-[1.25rem] animate-fadeIn">
                <div className="w-11 h-11 rounded-full bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                  <Snowflake className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <h4 className="text-xs font-bold tracking-widest text-sky-200 uppercase font-mono">
                  CARD FROZEN
                </h4>
                <p className="text-[11px] text-sky-300/80 max-w-xs leading-tight font-sans">
                  Public credential temporarily paused. Tap below to unfreeze.
                </p>
                <button
                  onClick={handleToggleFreeze}
                  className="mt-1 px-4 py-1.5 rounded-full bg-sky-400 text-black text-xs font-bold hover:bg-sky-300 transition-colors shadow-md"
                >
                  Unfreeze Pass
                </button>
              </div>
            )}

            {/* CARD HEADER: Clean Monogram, Network Label & Status */}
            <div
              className="relative z-10 flex items-center justify-between"
              style={{ transform: 'translateZ(14px)' }}
            >
              <div className="flex items-center gap-2.5">
                <CHQLogo size="xs" showText={false} variant="card" disableRotate={true} />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase font-sans leading-none">
                    CREATOR PASS
                  </span>
                  <span className="text-[9px] tracking-[0.14em] text-slate-400 uppercase font-medium mt-0.5">
                    {isVerified ? 'VERIFIED CREATOR' : (isRejected ? 'VERIFICATION REJECTED' : 'PENDING VERIFICATION')}
                  </span>
                </div>
              </div>

              {/* Top Right: Non-Shining Verified Badge (Solid Matte Real Card Style, No Glowing Neon) */}
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <div
                    className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-white px-2.5 py-1 rounded-md bg-white/10 border border-white/20 select-none shadow-sm"
                    title="Officially Verified Creator"
                  >
                    <Check className="w-3 h-3 stroke-[2.5] text-slate-200" />
                    <span className="tracking-wider">VERIFIED</span>
                  </div>
                ) : isRejected ? (
                  <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-400 px-2 py-0.5 rounded-md bg-red-950/40 border border-red-800/40 select-none">
                    <span className="tracking-wider">REJECTED</span>
                  </div>
                ) : (
                  <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 select-none">
                    <span className="tracking-wider">PENDING</span>
                  </div>
                )}
              </div>
            </div>

            {/* CARD BODY: Creator Avatar, Name & Connected Platforms */}
            <div
              className="relative z-10 flex items-center justify-between gap-4 my-auto py-2"
              style={{ transform: 'translateZ(18px)' }}
            >
              {/* Left Column: Avatar + Creator Info */}
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Avatar with fine metallic ring (auto-sourced from YouTube) */}
                <div className="relative shrink-0">
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-white/30 via-white/10 to-transparent shadow-lg">
                    <img
                      src={getSafeAvatarUrl(creator.avatarUrl, creator.displayName)}
                      alt={creator.displayName}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName || 'Creator')}&background=141414&color=ffffff&size=256&bold=true`;
                      }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-[1.5px] border-white/20 shadow-md ring-2 ring-black/40 block"
                    />
                  </div>
                  {/* Official Blue Tick Verified Badge */}
                  {isVerified && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0088ff] border-2 border-white flex items-center justify-center text-white shadow-md ring-1 ring-black/40"
                      title="Verified Identity"
                    >
                      <Check className="w-3 h-3 stroke-[3.5] text-white" />
                    </div>
                  )}
                </div>

                {/* Identity Text: Bold Display Name */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-white leading-tight truncate font-sans">
                      {creator.displayName}
                    </h3>
                  </div>

                  {/* Connected Platform Stats with Clean Badges */}
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    {/* YouTube */}
                    {creator.connections.youtube?.connected && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-white group/yt transition-transform hover:scale-105">
                        <svg className="w-3.5 h-3.5 fill-[#FF0000] shrink-0" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span className="font-bold text-white font-mono tracking-tight text-[11px] sm:text-xs">
                          {(creator.connections.youtube.metricValue || '0').replace(/\s*(subscribers|subs)\s*/gi, '')}
                        </span>
                      </div>
                    )}

                    {/* Discord */}
                    {creator.connections.discord?.connected && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-white group/dc transition-transform hover:scale-105">
                        <svg className="w-3.5 h-3.5 fill-[#5865F2] shrink-0" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <span className="font-bold text-white font-mono tracking-tight text-[11px] sm:text-xs">
                          {creator.connections.discord.metricValue?.includes('Member') ? creator.connections.discord.metricValue : `${creator.connections.discord.metricValue || '0'} Members`}
                        </span>
                      </div>
                    )}

                    {/* Instagram */}
                    {creator.connections.instagram?.connected && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-white group/ig transition-transform hover:scale-105" title={`Instagram: ${creator.connections.instagram.metricValue || creator.connections.instagram.username || cleanSlug}`}>
                        <svg className="w-3.5 h-3.5 fill-[#E1306C] shrink-0" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="font-bold text-white font-mono tracking-tight text-[11px] sm:text-xs">
                          {creator.connections.instagram.metricValue
                            ? creator.connections.instagram.metricValue.replace(/\s*followers/gi, '')
                            : (creator.connections.instagram.username ? (creator.connections.instagram.username.startsWith('@') ? creator.connections.instagram.username : `@${creator.connections.instagram.username}`) : `@${cleanSlug}`)}
                        </span>
                      </div>
                    )}

                    {/* X / Twitter */}
                    {creator.connections.x?.connected && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-white group/x transition-transform hover:scale-105" title={`X / Twitter: ${creator.connections.x.metricValue || creator.connections.x.username || cleanSlug}`}>
                        <svg className="w-3 h-3 fill-white shrink-0" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="font-bold text-white font-mono tracking-tight text-[11px] sm:text-xs">
                          {creator.connections.x.metricValue
                            ? creator.connections.x.metricValue.replace(/\s*followers/gi, '')
                            : (creator.connections.x.username ? (creator.connections.x.username.startsWith('@') ? creator.connections.x.username : `@${creator.connections.x.username}`) : `@${cleanSlug}`)}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Right Column: Clean QR Code (Pointing directly to https://creatorhq.fun/{slug}) */}
              <div
                className="shrink-0 flex flex-col items-center justify-center"
                style={{ transform: 'translateZ(14px)' }}
              >
                <div className="p-1.5 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-white/20 transition-transform hover:scale-105">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`QR code for @${cleanSlug}`}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain block rounded-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-200 animate-pulse rounded" />
                  )}
                </div>
              </div>
            </div>

            {/* CARD FOOTER: Dynamic Category / Niche (Left) & Creator Handle (Right) */}
            <div
              className="relative z-10 flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs"
              style={{ transform: 'translateZ(10px)' }}
            >
              <div>
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase font-sans block text-white">
                  {(creator.niche || creator.category || 'CREATOR').toUpperCase()}
                </span>
              </div>

              <div className="text-right">
                <a
                  href={`/${cleanSlug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] sm:text-xs font-sans font-bold text-sky-400 hover:text-sky-300 block tracking-tight transition-colors"
                >
                  @{cleanSlug}
                </a>
              </div>
            </div>
          </div>

          {/* ================= CARD BACK (EXECUTIVE MINIMALIST METALLIC) ================= */}
          <div className="absolute inset-0 w-full h-full rounded-[1.25rem] bg-gradient-to-br from-[#121417] via-[#0c0d10] to-[#07080a] border border-white/10 overflow-hidden backface-hidden rotate-y-180 shadow-2xl p-6 sm:p-7 flex flex-col justify-between">
            {/* Magnetic Stripe */}
            <div className="-mx-7 -mt-2 h-9 bg-[#050608] border-y border-white/10 relative">
              <div className="absolute inset-0 flex items-center justify-between px-6 text-[8px] font-mono text-slate-400 tracking-widest uppercase">
                <span>AUTHENTICATED CREATOR</span>
                <span className="text-sky-400">@{cleanSlug}</span>
              </div>
            </div>

            {/* Middle Section: Smart Chip & Signatures */}
            <div className="grid grid-cols-12 gap-3 my-2 items-center">
              {/* Metallic Chip Graphic */}
              <div className="col-span-4 flex flex-col items-center">
                <div className="w-12 h-9 sm:w-13 sm:h-10 rounded-md bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 p-0.5 shadow-inner flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 border border-slate-700/40 rounded-md" />
                  <div className="h-full w-full flex flex-col justify-around py-1">
                    <div className="w-full h-[1px] bg-slate-700/50" />
                    <div className="w-full h-[1px] bg-slate-700/50" />
                    <div className="w-full h-[1px] bg-slate-700/50" />
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 font-mono mt-1 tracking-wider uppercase">SECURE PASSKEY</span>
              </div>

              {/* Creator Metadata */}
              <div className="col-span-8 flex flex-col space-y-1 text-left">
                <div className="text-[9px] font-mono text-slate-300">
                  <span className="text-slate-500 uppercase block text-[8px]">HANDLE</span>
                  <span className="text-white font-semibold">@{cleanSlug}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono pt-1">
                  <div>
                    <span className="text-slate-500 block text-[8px]">CATEGORY</span>
                    <span className="text-slate-300">{creator.niche || creator.category || 'Creator'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px]">VERIFICATION</span>
                    <span className={`font-medium ${isVerified ? 'text-emerald-400' : (isRejected ? 'text-red-400' : 'text-amber-400')}`}>
                      {isVerified ? 'VERIFIED' : (isRejected ? 'REJECTED' : 'PENDING')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Box */}
            <div className="bg-white/95 rounded p-2 text-black flex items-center justify-between">
              <span className="font-mono text-xs font-semibold tracking-wide text-slate-900">
                {creator.displayName}
              </span>
              <span className="text-[9px] font-mono text-slate-600 font-bold tracking-wider">
                @{cleanSlug}
              </span>
            </div>

            {/* Microprint & Disclaimer */}
            <div className="pt-2 text-[8px] text-slate-400 leading-tight border-t border-white/5 space-y-0.5">
              <p className="uppercase tracking-wide font-medium text-slate-300">
                CREATORHQ TALENT NETWORK • OFFICIAL VERIFIED PASS
              </p>
              <p>
                Authorized digital identity card for sponsorships, brand partnerships, and community authentication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Interactive Controls Bar */}
      {showControls && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          {/* Flip Button */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all text-xs"
            title="Flip card to inspect back"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
          </button>

          {/* Freeze Toggle */}
          {allowFreeze && (
            <button
              onClick={handleToggleFreeze}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                isFrozen
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Freeze or unfreeze your card"
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-400" />
              <span>{isFrozen ? 'Unfreeze' : 'Freeze Card'}</span>
            </button>
          )}

          {/* Copy Link */}
          <button
            onClick={copyPassportLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all text-xs"
            title="Copy verification link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {/* Card Finish / Theme Selector */}
          {allowThemes && (
            <div className="flex items-center gap-1 ml-1 bg-black/40 p-1 rounded-lg border border-white/5">
              {(['obsidian', 'titanium', 'navy', 'gold'] as CardTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    t === 'obsidian'
                      ? 'bg-zinc-800'
                      : t === 'titanium'
                      ? 'bg-slate-400'
                      : t === 'navy'
                      ? 'bg-sky-600'
                      : 'bg-amber-500'
                  } ${theme === t ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                  title={`Switch to ${t} card finish`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
