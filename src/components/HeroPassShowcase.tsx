'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/lib/types';
import PassportCard from '@/components/PassportCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { subscribeToCreatorSync } from '@/lib/sync';

interface HeroPassShowcaseProps {
  initialCreators?: CreatorProfile[];
}

// Pristine "Your Channel Name" Demo Card shown for general visitors & prospective creators
const DEMO_CHANNEL_TEMPLATE: CreatorProfile = {
  id: 'demo_passport',
  passportId: 'yourchannel',
  slug: 'yourchannel',
  handle: '@yourchannel',
  verification_status: 'VERIFIED',
  username: 'yourchannel',
  displayName: 'Your Channel Name',
  avatarUrl: '/icon.svg',
  category: 'Gaming & Tech Creator',
  country: 'Global',
  location: 'Global',
  bio: 'Authenticate your YouTube channel & Discord community to mint your sovereign verified Creator Pass with 0% middleman fees.',
  isVerified: true,
  isFounding: true,
  tierName: 'Founding Member Pass',
  profileCompletion: 100,
  contactEmail: 'sponsors@yourchannel.com',
  issuedAt: '2026-10-01',
  lastVerifiedAt: '2026-10-01',
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
      lastSynced: '2026-10-01',
    },
    discord: {
      platform: 'DISCORD',
      connected: true,
      username: 'YourCommunity',
      metricLabel: 'members',
      metricValue: '10K+ Members',
      verified: true,
      profileUrl: 'https://discord.gg',
      lastSynced: '2026-10-01',
    },
  },
  skills: ['Content Creation', 'Audited Reach', 'Direct Brand Deals'],
  achievements: [],
  collaborations: [],
  portfolio: [],
};

export default function HeroPassShowcase({ initialCreators = [] }: HeroPassShowcaseProps) {
  const [activeCreator, setActiveCreator] = useState<CreatorProfile>(DEMO_CHANNEL_TEMPLATE);
  const [hasRealCreator, setHasRealCreator] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Purge any legacy unrulek card from localStorage to honor clean state
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('creatorhq_user_card');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.username === 'unrulek' || parsed.slug === 'unrulek')) {
            localStorage.removeItem('creatorhq_user_card');
          }
        }
      } catch (e) {}
    }

    // Verify authenticated session first
    const checkActiveSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.creator) {
            setActiveCreator(data.creator);
            setHasRealCreator(true);
            return;
          }
        }
      } catch (e) {}

      // If not authenticated, always display pristine "Your Channel Name" demo card
      if (isMounted) {
        setActiveCreator(DEMO_CHANNEL_TEMPLATE);
        setHasRealCreator(false);
      }
    };

    checkActiveSession();

    const unsubscribe = subscribeToCreatorSync((update) => {
      setActiveCreator((current) => {
        if (!current || current.id === 'demo_passport') return current;
        const currentSlug = (current.slug || current.username || '').toLowerCase();
        const targetSlug = (update.creatorSlug || '').toLowerCase();

        if (currentSlug && targetSlug && currentSlug === targetSlug) {
          const isV = update.verificationStatus === 'VERIFIED';
          return {
            ...current,
            isVerified: isV,
            verification_status: update.verificationStatus,
          };
        }
        return current;
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="pt-8 sm:pt-10 flex flex-col items-center justify-center">
      {/* Interactive Creator Card */}
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
    </div>
  );
}
