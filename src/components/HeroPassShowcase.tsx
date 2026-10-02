'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/lib/types';
import PassportCard from '@/components/PassportCard';
import { ArrowRight, Sparkles, PlusCircle } from 'lucide-react';

interface HeroPassShowcaseProps {
  initialCreators?: CreatorProfile[];
}

// Pristine "Your Channel" Demo Card shown for general visitors & prospective creators
const DEMO_CHANNEL_TEMPLATE: CreatorProfile = {
  id: 'template_demo',
  passportId: 'yourchannel',
  slug: 'yourchannel',
  handle: '@yourchannel',
  verification_status: 'VERIFIED' as const,
  username: 'yourchannel',
  displayName: 'Your Channel Name',
  avatarUrl: '/icon.svg',
  category: 'Gaming & Tech Creator',
  country: 'Global',
  location: 'Global',
  bio: 'Authenticate your YouTube channel & Discord community to mint your sovereign verified Creator Pass.',
  isVerified: true,
  isFounding: true,
  tierName: 'Founding Member #000001',
  profileCompletion: 100,
  contactEmail: 'business@yourchannel.com',
  issuedAt: '2026-09-30',
  lastVerifiedAt: '2026-09-30',
  digitalSignature: '0x0000000000000000000000000000000000000001',
  isSuspended: false,
  connections: {
    youtube: {
      platform: 'YOUTUBE',
      connected: true,
      username: 'YourChannel',
      metricLabel: 'subscribers',
      metricValue: '100K+ Subscribers',
      verified: true,
      profileUrl: 'https://youtube.com',
      lastSynced: '2026-09-30',
    },
    discord: {
      platform: 'DISCORD',
      connected: true,
      username: 'YourCommunity',
      metricLabel: 'members',
      metricValue: '10K+ Members',
      verified: true,
      profileUrl: 'https://discord.gg',
      lastSynced: '2026-09-30',
    },
  },
  skills: ['Content Creation', 'Audited Metrics', 'Brand Deals'],
  achievements: [],
  collaborations: [],
  portfolio: [],
};

export default function HeroPassShowcase({ initialCreators = [] }: HeroPassShowcaseProps) {
  const [activeCreator, setActiveCreator] = useState<CreatorProfile>(DEMO_CHANNEL_TEMPLATE);
  const [hasRealCreator, setHasRealCreator] = useState(false);

  useEffect(() => {
    // 1. Only show real card if the current viewer is the actual owner (saved on their device)
    try {
      const saved = localStorage.getItem('creatorhq_user_card');
      if (saved) {
        const parsed: CreatorProfile = JSON.parse(saved);
        if (parsed && (parsed.displayName || parsed.username)) {
          setActiveCreator(parsed);
          setHasRealCreator(true);
          return;
        }
      }
    } catch (e) {}

    // 2. For all other visitors and users, show the "Your Channel" Demo Card
    setActiveCreator(DEMO_CHANNEL_TEMPLATE);
    setHasRealCreator(false);
  }, []);

  return (
    <div className="pt-10 flex flex-col items-center justify-center">
      <div className="relative">
        <PassportCard
          creator={activeCreator}
          interactive={true}
          size="hero"
          showControls={true}
          allowFreeze={true}
          allowThemes={true}
        />
      </div>

      {!hasRealCreator && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-200 font-sans shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
            <span className="font-semibold text-white tracking-tight">Founding Member Pass</span>
            <span className="text-slate-500">•</span>
            <span className="text-sky-300 font-medium">Ready to Mint</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>Claim in Studio</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
