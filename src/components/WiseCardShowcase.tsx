'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PassportCard from '@/components/PassportCard';
import { getAllCreators } from '@/lib/data';
import { CreatorProfile } from '@/lib/types';
import {
  Layers,
  Snowflake,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WiseCardShowcase() {
  const allCreators = getAllCreators();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [customName, setCustomName] = useState('SenpaiSpider');
  const [customCategory, setCustomCategory] = useState('Gaming Creator');
  const [customYouTube, setCustomYouTube] = useState('2.8M');
  const [customDiscord, setCustomDiscord] = useState('85K');

  // Dynamic preview creator
  const baseCreator: Partial<CreatorProfile> = allCreators[activeCardIndex] || {
    id: 'preview_creator_pass',
    slug: 'creator',
    username: 'creator',
    displayName: 'Creator',
    category: 'Gaming Creator',
    tierName: 'Founding Member Tier I',
    isVerified: true,
    verification_status: 'VERIFIED',
    connections: {},
  };

  const liveCreator: CreatorProfile = {
    ...baseCreator,
    displayName: customName || 'Creator',
    category: customCategory || 'Content Creator',
    connections: {
      ...(baseCreator.connections || {}),
      youtube: {
        platform: 'YOUTUBE',
        connected: true,
        username: `${(customName || 'creator').toLowerCase().replace(/\s+/g, '')}TV`,
        metricLabel: 'subscribers',
        metricValue: customYouTube,
        verified: true,
      },
      discord: {
        platform: 'DISCORD',
        connected: true,
        username: `${(customName || 'creator').toLowerCase().replace(/\s+/g, '')}#0001`,
        metricLabel: 'members',
        metricValue: customDiscord,
        verified: true,
      },
    },
  } as CreatorProfile;

  const handleIssueTest = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  return (
    <section className="relative py-24 md:py-32 bg-[#0b0d11] overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#11141a] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              VIRTUAL CARD ENGINE
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
            Virtual Credentials. Interactive by Design.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Just like a modern virtual debit card, your Creator ID is alive: freeze it when private, inspect its cryptographic back strip, or customize finishes on the fly.
          </p>
        </div>

        {/* The 3-Card Fanned Stack (Wise Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: 3D Stack / Interactive Card */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Card Switcher Pills for YouTubers */}
            {allCreators.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 p-1.5 rounded-xl bg-[#11141a] border border-white/10 text-xs font-mono shadow-md">
                {allCreators.slice(0, 4).map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCardIndex(idx);
                      setCustomName(c.displayName);
                      setCustomCategory(c.category);
                      setCustomYouTube(c.connections?.youtube?.metricValue || '100K');
                      setCustomDiscord(c.connections?.discord?.metricValue || '10K');
                    }}
                    className={`px-3.5 py-1.5 rounded-lg transition-colors font-semibold ${
                      activeCardIndex === idx
                        ? 'bg-sky-500 text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {c.displayName} ({c.connections?.youtube?.metricValue || '100K'})
                  </button>
                ))}
              </div>
            )}

            {/* Fanned 3D Cards Container */}
            <div className="relative w-full max-w-[580px] flex items-center justify-center">
              {/* Active Foreground Card */}
              <div className="relative z-10 w-full animate-float-card">
                <PassportCard
                  creator={liveCreator}
                  interactive={true}
                  size="hero"
                  showControls={true}
                  allowFreeze={true}
                />
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400 text-center font-mono">
              Hover to tilt • Tap <strong className="text-sky-400">"Freeze Card"</strong> to pause • Tap <strong className="text-sky-400">"Flip Card"</strong> for details
            </p>
          </div>

          {/* Right Column: Live Instant Card Customizer */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#11141a] p-7 sm:p-8 shadow-md space-y-6">
            
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>INTERACTIVE PREVIEW</span>
              </span>
              <h3 className="text-2xl font-bold text-white font-sans">
                Experience Your Creator Pass
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Preview your handle and live reach before claiming your official CreatorHQ Pass.
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                  CREATOR DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. SenpaiSpider"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                  CONTENT NICHE / CATEGORY
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Gaming Creator"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                    YOUTUBE REACH
                  </label>
                  <input
                    type="text"
                    value={customYouTube}
                    onChange={(e) => setCustomYouTube(e.target.value)}
                    placeholder="e.g. 2.8M"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                    DISCORD COMMUNITY
                  </label>
                  <input
                    type="text"
                    value={customDiscord}
                    onChange={(e) => setCustomDiscord(e.target.value)}
                    placeholder="e.g. 85K"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="w-full py-3 rounded-lg btn-chq-primary text-xs font-semibold flex items-center justify-center gap-2 shadow-sm text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Your Real Pass Now</span>
                </Link>
              </div>

              <div className="p-3.5 rounded-lg bg-[#161922] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Card Standard</span>
                  <span className="text-white font-bold">CreatorHQ Pass</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Public Domain</span>
                  <span className="text-sky-400 font-bold">creatorhq.fun</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
