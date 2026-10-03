'use client';

import React from 'react';
import Link from 'next/link';
import TiltCard from '@/components/TiltCard';
import {
  ShieldCheck,
  UsersRound,
  TrendingUp,
  Award,
  ArrowRight,
  Lock,
  CheckCircle2,
  Snowflake
} from 'lucide-react';
import {
  MultiPlatformSvg,
  PrivacyShieldSvg,
  GlobalTalentSvg,
  CryptoPassSvg
} from '@/components/RichSvgIcons';

export default function ServiceMediaBento() {
  return (
    <div className="w-full relative bg-transparent">
      {/* ================= HIGH-IMPACT STATS COUNTERS ================= */}
      <section className="relative py-16 md:py-24 bg-transparent">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            
            {/* Stat 1 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-3 p-8 sm:p-10 rounded-3xl border border-sky-500/30 bg-[#090d16]/90 backdrop-blur-md hover:border-sky-400/70 transition-all duration-300 shadow-[0_8px_40px_-12px_rgba(56,189,248,0.2)] hover:shadow-[0_12px_50px_-8px_rgba(56,189,248,0.35)] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mb-1">
                <UsersRound className="w-7 h-7 text-sky-400" />
              </div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-sky-200 font-sans tracking-tight">
                500+
              </div>
              <p className="text-sm sm:text-base text-slate-300 font-semibold tracking-wide">Founding Creators</p>
            </TiltCard>

            {/* Stat 2 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-3 p-8 sm:p-10 rounded-3xl border border-sky-500/30 bg-[#090d16]/90 backdrop-blur-md hover:border-sky-400/70 transition-all duration-300 shadow-[0_8px_40px_-12px_rgba(56,189,248,0.2)] hover:shadow-[0_12px_50px_-8px_rgba(56,189,248,0.35)] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mb-1">
                <TrendingUp className="w-7 h-7 text-sky-400" />
              </div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-sky-200 font-sans tracking-tight">
                24M+
              </div>
              <p className="text-sm sm:text-base text-slate-300 font-semibold tracking-wide">Verified Reach</p>
            </TiltCard>

            {/* Stat 3 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-3 p-8 sm:p-10 rounded-3xl border border-sky-500/30 bg-[#090d16]/90 backdrop-blur-md hover:border-sky-400/70 transition-all duration-300 shadow-[0_8px_40px_-12px_rgba(56,189,248,0.2)] hover:shadow-[0_12px_50px_-8px_rgba(56,189,248,0.35)] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mb-1">
                <ShieldCheck className="w-7 h-7 text-sky-400" />
              </div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-sky-200 font-sans tracking-tight">
                100%
              </div>
              <p className="text-sm sm:text-base text-slate-300 font-semibold tracking-wide">Audit Accuracy</p>
            </TiltCard>

            {/* Stat 4 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-3 p-8 sm:p-10 rounded-3xl border border-sky-500/30 bg-[#090d16]/90 backdrop-blur-md hover:border-sky-400/70 transition-all duration-300 shadow-[0_8px_40px_-12px_rgba(56,189,248,0.2)] hover:shadow-[0_12px_50px_-8px_rgba(56,189,248,0.35)] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mb-1">
                <Award className="w-7 h-7 text-sky-400" />
              </div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-sky-200 font-sans tracking-tight">
                0%
              </div>
              <p className="text-sm sm:text-base text-slate-300 font-semibold tracking-wide">Commission Cut</p>
            </TiltCard>

          </div>
        </div>
      </section>

      {/* ================= BENTO GRID: WHY SOVEREIGN PASSPORTS ================= */}
      <section className="relative py-16 md:py-24 bg-transparent">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-950/40 px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-xs sm:text-sm font-semibold text-sky-300">
                The CreatorHQ Standard
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Built for Serious Creator Authority
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              A private platform membership system engineered to give online creators undisputed proof of identity across web, Discord, and brand partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Bento Card 1 (Large 2x2 Prominent Card) */}
            <TiltCard maxTilt={6} className="md:col-span-2 md:row-span-2 rounded-3xl border border-white/15 bg-[#090d16]/90 backdrop-blur-md p-8 sm:p-10 hover:border-sky-400/60 shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-5">
                <CryptoPassSvg className="w-14 h-14" size={56} />
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
                  Verified Creator Identity & Media Kit
                </h3>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                  Your consolidated, authoritative digital creator card. Display confirmed subscriber counts, server members, and verified platform handles without unverified screenshots or outdated PDF media kits.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs font-mono text-slate-300">
                  <span className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10">
                    ✓ Confirmed Metrics
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10">
                    ✓ Custom Avatar & Banner
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10">
                    ✓ Instant Share Link
                  </span>
                </div>
              </div>

              <div className="pt-8">
                <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)] inline-block">
                  <Link
                    href="/signup"
                    className="btn-chq-primary px-8 py-3 text-sm font-extrabold flex items-center gap-2"
                  >
                    <span>Start Creating</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </TiltCard>

            {/* Bento Card 2: Multi-Platform Reach */}
            <TiltCard maxTilt={8} className="md:col-span-2 rounded-3xl border border-white/15 bg-[#090d16]/90 backdrop-blur-md p-8 hover:border-sky-400/60 shadow-lg transition-all space-y-4">
              <MultiPlatformSvg className="w-12 h-12" size={48} />
              <h3 className="text-xl font-bold text-white font-sans">Multi-Platform Cross-Verification</h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Connect and audit your official YouTube and Discord servers. Showcase your combined audience reach across streaming, video, and community chats.
              </p>
            </TiltCard>

            {/* Bento Card 3: Privacy & Status Controls */}
            <TiltCard maxTilt={8} className="md:col-span-2 rounded-3xl border border-white/15 bg-[#090d16]/90 backdrop-blur-md p-8 hover:border-sky-400/60 shadow-lg transition-all space-y-4">
              <PrivacyShieldSvg className="w-12 h-12" size={48} />
              <h3 className="text-xl font-bold text-white font-sans">Sovereign Privacy & Freeze Controls</h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Taking a break or fully booked on collaborations? Freeze your public card with one tap to pause incoming sponsorship inquiries without losing your verified standing.
              </p>
            </TiltCard>

            {/* Bento Card 4: Founding Creator Pass */}
            <TiltCard maxTilt={6} className="md:col-span-4 rounded-3xl border border-white/15 bg-[#090d16]/90 backdrop-blur-md p-8 sm:p-10 hover:border-sky-400/60 shadow-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-3">
                <GlobalTalentSvg className="w-12 h-12" size={48} />
                <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">Featured Creator Talent Directory</h3>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal">
                  Join verified creators in our talent directory and get discovered directly by top gaming, tech, and entertainment brands worldwide.
                </p>
              </div>
              <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)] shrink-0 self-start sm:self-auto">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-7 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </TiltCard>

          </div>

        </div>
      </section>

    </div>
  );
}
