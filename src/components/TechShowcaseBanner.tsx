import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';

interface TechShowcaseBannerProps {
  badge?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export default function TechShowcaseBanner({
  badge = 'VERIFIED PROTOCOL',
  title = 'Sovereign Credentials For Serious Creators',
  subtitle = 'Replace outdated PDF media kits with verifiable cryptographic passes recognized by tier-1 brands.',
  ctaText = 'Start Creating',
  ctaHref = '/signup',
  secondaryCtaText = 'Explore Talents',
  secondaryCtaHref = '/talents',
}: TechShowcaseBannerProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-sky-400/25 shadow-[0_20px_60px_-15px_rgba(56,189,248,0.2)] my-12 group">
      {/* Camouflage Graphic Texture Backdrop */}
      <CamouflageBannerBg bannerOpacity="opacity-55" gridOpacity="opacity-30" />

      {/* Atmospheric Lighting Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060911]/95 via-[#060911]/80 to-transparent pointer-events-none" />

      <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/60 px-3.5 py-1 text-xs font-bold text-sky-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8] animate-pulse" />
            <span>{badge}</span>
          </div>

          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
            {title}
          </h3>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Staff Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>0% Commission</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Instant Passkey</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
          <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.25)]">
            <Link
              href={ctaHref}
              className="btn-chq-primary px-8 py-3.5 text-sm font-extrabold flex items-center justify-center gap-2"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>

          {secondaryCtaText && (
            <Link
              href={secondaryCtaHref}
              className="btn-chq-secondary px-6 py-3.5 text-sm font-semibold flex items-center justify-center"
            >
              <span>{secondaryCtaText}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
