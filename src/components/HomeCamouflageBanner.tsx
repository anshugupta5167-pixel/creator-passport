'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import { CryptoPassSvg, MultiPlatformSvg, AuditedPrecisionSvg, BrandDealsSvg } from '@/components/RichSvgIcons';

export default function HomeCamouflageBanner() {
  return (
    <div className="relative w-full max-w-7xl mx-auto my-16 px-4 sm:px-6 lg:px-8">
      {/* 3D Flowing Outer Wrapper */}
      <div className="relative rounded-[32px] overflow-hidden border border-sky-400/30 bg-[#070b14]/90 shadow-[0_25px_80px_-20px_rgba(56,189,248,0.25)] group transition-all duration-500 hover:border-sky-400/70 hover:shadow-[0_30px_90px_-15px_rgba(56,189,248,0.4)]">
        
        {/* Real Camouflage Graphic Tech Background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/chq-hero-banner.jpg"
            alt=""
            className="w-full h-full object-cover object-center opacity-60 scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          {/* Holographic Glowing Atmosphere Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060911]/95 via-[#060911]/85 to-[#060911]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(56,189,248,0.25)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(99,102,241,0.2)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-grid-chq opacity-30" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-10 sm:p-14 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Left Text Column with Holographic Feel */}
          <div className="space-y-6 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/60 px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-sky-400 tracking-wider font-mono">
                CREATORHQ PROTOCOL 2026
              </span>
            </div>

            <h3 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] font-sans">
              Sovereign 3D Passes For{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-200 to-blue-400">
                Serious Creators
              </span>
            </h3>

            <p className="text-base sm:text-xl text-slate-200 leading-relaxed font-normal">
              Say goodbye to forged screenshots and outdated PDF media kits. CreatorHQ gives you a tamper-proof digital passport with verified YouTube metrics, Discord role validation, and direct sponsor access.
            </p>

            {/* 4 Feature Badges with SVG Image Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090d16]/80 border border-sky-500/20 backdrop-blur-sm">
                <AuditedPrecisionSvg className="w-6 h-6 shrink-0" size={24} />
                <span className="text-xs font-semibold text-slate-200">Audited Reach</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090d16]/80 border border-sky-500/20 backdrop-blur-sm">
                <MultiPlatformSvg className="w-6 h-6 shrink-0" size={24} />
                <span className="text-xs font-semibold text-slate-200">YouTube+Discord</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090d16]/80 border border-sky-500/20 backdrop-blur-sm">
                <BrandDealsSvg className="w-6 h-6 shrink-0" size={24} />
                <span className="text-xs font-semibold text-slate-200">0% Commission</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090d16]/80 border border-sky-500/20 backdrop-blur-sm">
                <CryptoPassSvg className="w-6 h-6 shrink-0" size={24} />
                <span className="text-xs font-semibold text-slate-200">3D Holographic</span>
              </div>
            </div>
          </div>

          {/* Right Action Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0 w-full sm:w-auto lg:w-72">
            <div className="p-1 rounded-full border border-sky-400/30 bg-sky-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.3)]">
              <Link
                href="/signup"
                className="btn-chq-primary w-full py-4 px-8 text-base font-extrabold flex items-center justify-center gap-2 text-slate-950"
              >
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
            </div>

            <Link
              href="/talents"
              className="btn-chq-secondary w-full py-4 px-6 text-sm font-semibold flex items-center justify-center text-center"
            >
              <span>Explore Verified Roster</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
