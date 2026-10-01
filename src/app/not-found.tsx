'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import { Compass, Home, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20 relative overflow-hidden">
      <Navbar />

      {/* Camouflage Tech Banner in Background */}
      <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none overflow-hidden">
        <CamouflageBannerBg />
      </div>

      <main className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-2xl w-full text-center space-y-8 p-8 sm:p-12 rounded-3xl bg-[#11141a]/90 border border-white/[0.08] shadow-2xl backdrop-blur-sm">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ERROR 404 • PAGE NOT FOUND</span>
          </div>

          {/* 404 Headline */}
          <div className="space-y-3">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white font-sans">
              404
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Sovereign Identity Route Not Found
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
              The page or passport URL you are looking for does not exist on the CreatorHQ network or may have been updated.
            </p>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl btn-chq-primary text-xs font-semibold flex items-center gap-2 text-white shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>

            <Link
              href="/creators"
              className="px-6 py-3 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Explore Talents</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Creator Studio</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-white/5 text-xs text-slate-500 font-mono">
            <span>creatorhq.fun • Verification & Identity Infrastructure</span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
