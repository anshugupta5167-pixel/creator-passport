'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CHQLogo from '@/components/CHQLogo';
import { Download, Check, ShieldCheck, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function BrandAssetsPage() {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const handleDownload = (url: string, filename: string, formatKey: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadedFormat(formatKey);
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white flex flex-col font-sans pt-20">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Brand Kit & Discord Assets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            CreatorHQ Discord Logo & Brand Assets
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            High-resolution Discord server avatars with custom tech background, vector emblems, and official branding.
          </p>
        </div>

        {/* Discord Logo Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-3xl bg-[#11141a] border border-white/10 shadow-2xl">
          {/* Left: Previews (Square & Discord Circle Mode) */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Square Full Canvas */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 font-medium">Original (1:1 Square)</span>
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.2)] bg-black relative group">
                <img
                  src="/creatorhq-discord-logo.png"
                  alt="CreatorHQ Discord Logo with Background"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Discord Circle Preview */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-mono text-sky-400 font-medium">Discord Avatar Preview</span>
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.35)] bg-black relative group">
                <img
                  src="/creatorhq-discord-logo.png"
                  alt="CreatorHQ Discord Avatar Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* Right: Specifications & Download Buttons */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-mono font-semibold">
                  DISCORD OPTIMIZED
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-mono font-semibold">
                  1024 × 1024 PX
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">
                CreatorHQ Discord Server Icon
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed mt-1">
                Custom designed with an obsidian carbon background, glowing cybernetic hex-shield, interlocking C-prism, and circular safe-zone tailored specifically for Discord profiles, bots, and server avatars.
              </p>
            </div>

            {/* Download Options */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleDownload('/creatorhq-discord-logo.png', 'creatorhq-discord-logo.png', 'png')}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
              >
                {downloadedFormat === 'png' ? <Check className="w-4 h-4 stroke-[3]" /> : <Download className="w-4 h-4" />}
                <span>{downloadedFormat === 'png' ? 'Downloaded High-Res PNG!' : 'Download High-Res PNG (1024x1024)'}</span>
              </button>

              <button
                onClick={() => handleDownload('/creatorhq-discord-avatar.svg', 'creatorhq-discord-avatar.svg', 'svg')}
                className="w-full h-12 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {downloadedFormat === 'svg' ? <Check className="w-4 h-4 stroke-[3]" /> : <Download className="w-4 h-4" />}
                <span>{downloadedFormat === 'svg' ? 'Downloaded Vector SVG!' : 'Download Vector SVG (512x512)'}</span>
              </button>

              <button
                onClick={() => handleDownload('/creatorhq-logo.svg', 'creatorhq-brand-logo.svg', 'brand-svg')}
                className="w-full h-12 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {downloadedFormat === 'brand-svg' ? <Check className="w-4 h-4 stroke-[3]" /> : <Download className="w-4 h-4" />}
                <span>{downloadedFormat === 'brand-svg' ? 'Downloaded Brand Logo!' : 'Download Full Horizontal Brand Logo (SVG)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vector SVG Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Vector SVG Discord Logo */}
          <div className="p-6 rounded-2xl bg-[#11141a] border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Vector Discord Avatar (SVG)</span>
            </h3>
            <div className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center p-2">
              <img src="/creatorhq-discord-avatar.svg" alt="Vector Discord Avatar" className="w-full h-full object-contain" />
            </div>
            <a
              href="/creatorhq-discord-avatar.svg"
              download="creatorhq-discord-avatar.svg"
              className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Vector File</span>
            </a>
          </div>

          {/* Card 2: Transparent Emblem & Wordmark */}
          <div className="p-6 rounded-2xl bg-[#11141a] border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>Full Brand Wordmark (Transparent)</span>
            </h3>
            <div className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-white/10 bg-[#080a0e] flex items-center justify-center p-6">
              <img src="/creatorhq-logo.svg" alt="Brand Wordmark" className="w-full object-contain" />
            </div>
            <a
              href="/creatorhq-logo.svg"
              download="creatorhq-logo.svg"
              className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Brand Wordmark</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
