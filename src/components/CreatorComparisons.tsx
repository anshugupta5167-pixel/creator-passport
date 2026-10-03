'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ComparisonData {
  id: string;
  name: string;
  pillLabel: string;
  headline: string;
  description: string;
  creatorHqFeature: string;
  competitorFeature: string;
  costComparison: string;
}

const comparisons: ComparisonData[] = [
  {
    id: 'linktree',
    name: 'Linktree',
    pillLabel: 'CreatorHQ vs Linktree',
    headline: 'Which is better, CreatorHQ or Linktree?',
    description:
      'Linktree is a simple bio-link aggregator with unverified links. CreatorHQ is a verified identity infrastructure and digital media kit with staff-audited YouTube reach and Discord server ownership proofs.',
    creatorHqFeature: 'Cryptographic digital passport with staff-verified channel reach & 0% fee brand connections.',
    competitorFeature: 'Generic link buttons, self-reported bio text, and monthly paywalls ($10–$24/mo) for custom domains.',
    costComparison: 'CreatorHQ is 100% free with sovereign verified credentials; Linktree charges for pro features.',
  },
  {
    id: 'beacons',
    name: 'Beacons',
    pillLabel: 'CreatorHQ vs Beacons',
    headline: 'How does CreatorHQ compare to Beacons.ai?',
    description:
      'Beacons offers all-in-one creator link trees with built-in storefronts. CreatorHQ specializes exclusively in sovereign verified credentials, proof auditing, and fraud-proof metrics that premium brand sponsors demand.',
    creatorHqFeature: 'Manual staff audit and tamper-proof verification badges that brands trust for $10k+ sponsorships.',
    competitorFeature: 'Automated widgets that anyone can fabricate or modify without verification audits.',
    costComparison: 'CreatorHQ is 100% free for verified creators with zero revenue cuts; Beacons takes up to 9% transaction cuts.',
  },
  {
    id: 'bento',
    name: 'Bento',
    pillLabel: 'CreatorHQ vs Bento',
    headline: 'Which is superior for creators, CreatorHQ or Bento?',
    description:
      'Bento provides visual portfolio grids for design freelancers. CreatorHQ provides official credentials specifically designed for YouTube creators and Discord server founders seeking brand partnerships.',
    creatorHqFeature: 'Dynamic virtual card engine, card freeze mode, and verified platform metrics.',
    competitorFeature: 'Static portfolio cards without verification checkmarks or sponsor inquiry routing.',
    costComparison: 'Both offer free tiers; CreatorHQ includes enterprise-grade verified trust badges.',
  },
  {
    id: 'discord',
    name: 'Discord Roles',
    pillLabel: 'CreatorHQ vs Discord Roles',
    headline: 'Can Discord roles replace a CreatorHQ Passport?',
    description:
      'Discord roles only exist inside a single guild and cannot be shown to external sponsors. CreatorHQ bridges your Discord community ownership into a public, verified credential accessible worldwide.',
    creatorHqFeature: 'Global canonical URL (creatorhq.fun/creator/your-id) verifiable anywhere on the web.',
    competitorFeature: 'Confined to individual servers with no external brand proof or verifiable media kit.',
    costComparison: 'CreatorHQ is free and public; Discord Server Subscriptions take a 10% platform fee.',
  },
  {
    id: 'stan',
    name: 'Stan Store',
    pillLabel: 'CreatorHQ vs Stan Store',
    headline: 'Is CreatorHQ cheaper than Stan Store?',
    description:
      'Stan Store charges $29 to $99 per month to sell digital downloads. CreatorHQ focuses on verifiable identity and brand sponsorships without costly monthly subscriptions.',
    creatorHqFeature: 'No monthly subscription fees, verifiable proof auditing, and direct sponsor inquiries.',
    competitorFeature: 'High monthly fee ($29–$99/month) primarily tailored for course creators.',
    costComparison: 'CreatorHQ is 100% free for verified digital credentials; Stan Store costs $348 to $1,188 per year.',
  },
  {
    id: 'agencies',
    name: 'Traditional Agencies',
    pillLabel: 'CreatorHQ vs Talent Agencies',
    headline: 'Why use CreatorHQ instead of a traditional talent agency?',
    description:
      'Traditional talent management agencies take 20% to 50% cuts of every brand deal and lock creators into exclusive contracts. CreatorHQ gives creators sovereign ownership of their media kit with direct sponsor access.',
    creatorHqFeature: '100% deal retention (keep 100% of brand payments), instant card control, and sovereign ownership.',
    competitorFeature: '20% to 50% commission cuts, multi-year binding contracts, and agency gatekeeping.',
    costComparison: 'CreatorHQ takes 0% commission on your sponsorships. Agencies take 20–50%.',
  },
];

export default function CreatorComparisons() {
  const [activeComparisonId, setActiveComparisonId] = useState<string>('linktree');
  const activeComp = comparisons.find((c) => c.id === activeComparisonId) || comparisons[0];

  return (
    <section className="py-20 md:py-28 bg-transparent relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-xs font-semibold text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM COMPARISONS & FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            How CreatorHQ Compares.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Independent online creators deserve verified credentials, not basic link lists. Compare CreatorHQ to legacy alternatives.
          </p>
        </div>

        {/* Active Comparison Card Detail */}
        <div className="rounded-2xl bg-[#12151c] border border-white/15 p-6 sm:p-10 mb-10 shadow-xl space-y-6">
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              {activeComp.headline}
            </h3>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl font-normal">
              {activeComp.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* CreatorHQ Column */}
            <div className="p-6 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>CreatorHQ Sovereign Passport</span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                {activeComp.creatorHqFeature}
              </p>
            </div>

            {/* Competitor Column */}
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-base">
                <XCircle className="w-5 h-5 shrink-0 text-slate-500" />
                <span>{activeComp.name} Alternative</span>
              </div>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                {activeComp.competitorFeature}
              </p>
            </div>
          </div>

          {/* Pricing Bottom Note */}
          <div className="p-5 rounded-xl bg-[#161922] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <span className="text-slate-300 text-sm">
              <strong className="text-white">Pricing & Economics:</strong> {activeComp.costComparison}
            </span>
            <Link
              href="/signup"
              className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 shrink-0 text-sm"
            >
              <span>Start Creating</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none">
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-full btn-chq-primary text-xs font-extrabold shrink-0 flex items-center gap-2 shadow-lg shadow-sky-500/20"
          >
            <span>Start Creating</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>

          {comparisons.map((c) => {
            const pageSlug = c.id === 'discord' ? 'discord-roles' : c.id === 'stan' ? 'stan-store' : c.id;
            return (
              <Link
                key={c.id}
                href={`/compare/${pageSlug}`}
                className="px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 bg-[#11141a] text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 hover:border-sky-500/30"
              >
                <span>{c.pillLabel}</span>
                <span className="text-[10px] text-sky-400">→</span>
              </Link>
            );
          })}

          <Link
            href="/faq"
            className="px-4 py-3 rounded-xl bg-[#11141a] text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <span>View FAQ</span>
            <span className="text-[10px] opacity-70">→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
