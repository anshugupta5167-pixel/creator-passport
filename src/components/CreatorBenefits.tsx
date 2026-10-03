'use client';

import React from 'react';
import Link from 'next/link';
import {
  Handshake,
  FileCheck2,
  TrendingUp,
  Users2,
  Sparkles,
  Headphones,
  ArrowRight
} from 'lucide-react';

interface BenefitItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tag: string;
}

const benefits: BenefitItem[] = [
  {
    icon: Handshake,
    title: 'Direct Brand Connections',
    description: 'Connect directly with premium brands seeking verified creators in your niche. No middlemen, hidden fees, or gatekeeping.',
    tag: 'Direct Partnerships',
  },
  {
    icon: FileCheck2,
    title: 'Clear Agreements',
    description: 'Standardized creator contracts and transparent milestones protect both parties, ensuring expectations and deliverables are aligned.',
    tag: 'Contract Protection',
  },
  {
    icon: TrendingUp,
    title: 'Increased Visibility',
    description: 'Get discovered by vetted sponsors, brand agencies, and commercial partners actively scouting on the CreatorHQ Talent Network.',
    tag: 'Creator Discovery',
  },
  {
    icon: Users2,
    title: 'Supportive Community',
    description: 'Join a private network of serious YouTube creators and Discord server founders collaborating, cross-promoting, and scaling together.',
    tag: 'Private Network',
  },
  {
    icon: Sparkles,
    title: 'Sponsored Content Opportunities',
    description: 'Access a curated pipeline of high-paying sponsorships, product integrations, and long-term brand ambassadorships.',
    tag: 'Monetization',
  },
  {
    icon: Headphones,
    title: 'Personalized Support',
    description: 'Receive dedicated creator advisory on rate card valuation, proof auditing, dispute resolution, and brand outreach.',
    tag: 'Dedicated Advisory',
  },
];

export default function CreatorBenefits() {
  return (
    <section className="relative py-24 md:py-32 bg-[#0b0d11] overflow-hidden border-t border-white/5">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-[#11141a] text-xs font-semibold text-sky-400">
            <span>BENEFITS FOR CREATORS</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
            Built for Creators Who Mean Business.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to turn channel reach and community authority into secure, lucrative brand partnerships.
          </p>
        </div>

        {/* 6-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="group relative p-7 sm:p-8 rounded-2xl bg-[#11141a] border border-white/[0.08] hover:border-sky-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between"
              >
                {/* Top: Icon & Badge */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 group-hover:border-sky-400/50 group-hover:bg-sky-500/20 flex items-center justify-center transition-all">
                      <Icon className="w-5 h-5 text-sky-400" />
                    </div>
                    <span className="text-xs font-medium text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                      {benefit.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans group-hover:text-sky-300 transition-colors">
                    {benefit.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                    {benefit.description}
                  </p>
                </div>

                {/* Bottom clean benefit index */}
                <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="group-hover:text-slate-300 transition-colors">Verified Advantage</span>
                  <span className="font-mono text-sky-400 font-semibold text-xs">0{index + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="mt-14 p-8 rounded-2xl bg-[#121620] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-white">
              Ready to claim your official Creator Pass?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Join verified YouTube and Discord creators with an authenticated passkey.
            </p>
          </div>
          <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)] shrink-0">
            <Link
              href="/signup"
              className="btn-chq-primary px-7 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2"
            >
              <span>Start Creating</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
