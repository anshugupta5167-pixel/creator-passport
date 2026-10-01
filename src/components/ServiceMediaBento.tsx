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

export default function ServiceMediaBento() {
  return (
    <div className="w-full relative bg-[#0b0d11]">
      {/* ================= HIGH-IMPACT STATS COUNTERS ================= */}
      <section className="relative py-16 md:py-20 bg-[#0b0d11]">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            
            {/* Stat 1 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl border border-white/10 bg-[#11141a] hover:border-sky-500/50 transition-colors">
              <UsersRound className="w-6 h-6 text-sky-400 mb-1" />
              <div className="text-3xl md:text-4xl font-extrabold text-white font-sans">
                500+
              </div>
              <p className="text-xs text-slate-400 font-medium">Founding Creators</p>
            </TiltCard>

            {/* Stat 2 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl border border-white/10 bg-[#11141a] hover:border-sky-500/50 transition-colors">
              <TrendingUp className="w-6 h-6 text-sky-400 mb-1" />
              <div className="text-3xl md:text-4xl font-extrabold text-white font-sans">
                24M+
              </div>
              <p className="text-xs text-slate-400 font-medium">Verified Reach</p>
            </TiltCard>

            {/* Stat 3 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl border border-white/10 bg-[#11141a] hover:border-sky-500/50 transition-colors">
              <ShieldCheck className="w-6 h-6 text-sky-400 mb-1" />
              <div className="text-3xl md:text-4xl font-extrabold text-white font-sans">
                100%
              </div>
              <p className="text-xs text-slate-400 font-medium">Zero Bot Risk</p>
            </TiltCard>

            {/* Stat 4 */}
            <TiltCard maxTilt={8} className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl border border-white/10 bg-[#11141a] hover:border-sky-500/50 transition-colors">
              <Lock className="w-6 h-6 text-sky-400 mb-1" />
              <div className="text-3xl md:text-4xl font-extrabold text-white font-sans">
                0
              </div>
              <p className="text-xs text-slate-400 font-medium">Passwords Stored</p>
            </TiltCard>

          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-white/10" />

      {/* ================= BENTO GRID ================= */}
      <section className="w-full py-20 md:py-28 bg-[#0b0d11]">
        <div className="container px-4 md:px-6 mx-auto">
          
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141a] px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                The CreatorHQ Standard
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
              Built for Serious Creator Authority
            </h2>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A private platform membership system engineered to give online creators undisputed proof of identity across web, Discord, and brand partnerships.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-7xl mx-auto">
            
            {/* Bento Card 1 (Large 2x2 Prominent Card) */}
            <TiltCard maxTilt={6} className="md:col-span-2 md:row-span-2 rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-9 hover:border-sky-400/60 shadow-lg transition-all flex flex-col justify-between">
              <div className="space-y-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
                  Verified Creator Identity & Media Kit
                </h3>
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
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
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold btn-chq-primary px-6 py-3 rounded-lg"
                >
                  <span>Create Your Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </TiltCard>

            {/* Bento Card 2: Multi-Platform Audience */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all space-y-3.5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white font-sans">Multi-Platform Reach</h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Connect your official YouTube and Discord to showcase your verified audience across video and community channels.
              </p>
            </TiltCard>

            {/* Bento Card 3: Privacy & Status Controls */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all space-y-3.5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <Snowflake className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white font-sans">Status & Freeze Controls</h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Taking a break or fully booked on collabs? Freeze your public card with one tap to pause incoming sponsor inquiries.
              </p>
            </TiltCard>

            {/* Bento Card 4: Founding Creator Pass */}
            <TiltCard maxTilt={6} className="md:col-span-2 rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2.5">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">Featured Creator Network</h3>
                <p className="text-sm sm:text-base text-slate-200 max-w-lg leading-relaxed font-normal">
                  Join verified creators in our talent directory and get discovered by top gaming, tech, and lifestyle brands.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold whitespace-nowrap self-start sm:self-auto shadow-sm"
              >
                Create Pass
              </Link>
            </TiltCard>

          </div>

        </div>
      </section>

    </div>
  );
}
