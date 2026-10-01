'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/lib/types';
import PassportCard from '@/components/PassportCard';
import { ArrowRight, Sparkles, PlusCircle } from 'lucide-react';

interface HeroPassShowcaseProps {
  initialCreators?: CreatorProfile[];
}

// Pristine Founding Pass Template shown only before any creator has minted their card
const DEFAULT_FOUNDING_TEMPLATE: CreatorProfile = {
  id: 'template_001',
  passportId: 'yourhandle',
  slug: 'yourhandle',
  handle: '@yourhandle',
  verification_status: 'VERIFIED' as const,
  username: 'yourhandle',
  displayName: 'Your Channel Name',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  category: 'Gaming & Tech',
  country: 'Global',
  location: 'Global',
  bio: 'Mint your official Sovereign Creator Pass to establish audited trust with global sponsors.',
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
      metricValue: '100K+',
      verified: true,
      profileUrl: 'https://youtube.com',
      lastSynced: '2026-09-30',
    },
    discord: {
      platform: 'DISCORD',
      connected: true,
      username: 'community#0001',
      metricLabel: 'members',
      metricValue: '10K+',
      verified: true,
      profileUrl: 'https://discord.gg',
      lastSynced: '2026-09-30',
    },
  },
  skills: ['Content Creation', 'Verified Reach'],
  achievements: [],
  collaborations: [],
  portfolio: [],
};

export default function HeroPassShowcase({ initialCreators = [] }: HeroPassShowcaseProps) {
  const [activeCreator, setActiveCreator] = useState<CreatorProfile>(DEFAULT_FOUNDING_TEMPLATE);
  const [hasRealCreator, setHasRealCreator] = useState(false);

  useEffect(() => {
    // 1. Check client localStorage for newly minted user card
    try {
      const saved = localStorage.getItem('creatorhq_user_card');
      if (saved) {
        const parsed: CreatorProfile = JSON.parse(saved);
        if (parsed && parsed.displayName) {
          setActiveCreator(parsed);
          setHasRealCreator(true);
          return;
        }
      }
    } catch (e) {}

    // 2. Otherwise check server/API database
    if (initialCreators && initialCreators.length > 0) {
      setActiveCreator(initialCreators[0]);
      setHasRealCreator(true);
    } else {
      fetch('/api/creators')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.creators && data.creators.length > 0) {
            setActiveCreator(data.creators[0]);
            setHasRealCreator(true);
          }
        })
        .catch(() => {});
    }
  }, [initialCreators]);

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
