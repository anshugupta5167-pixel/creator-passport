'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/lib/types';
import PassportCard from '@/components/PassportCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { subscribeToCreatorSync } from '@/lib/sync';
import { readCachedAuthHint } from '@/lib/clientAuth';

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

  const makeAccountPreview = (user: any): CreatorProfile => {
    const username = String(user?.username || 'creator').toLowerCase().replace(/^@/, '');
    const displayName = user?.displayName || username;
    const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0284c7&color=ffffff&size=256&bold=true`;
    return {
      ...DEMO_CHANNEL_TEMPLATE,
      id: `preview_${user?.id || username}`,
      passportId: username,
      slug: username,
      handle: `@${username}`,
      username,
      displayName,
      avatarUrl,
      bio: 'Your Creator Pass preview. Finish your profile in Studio to make it yours.',
      contactEmail: user?.email || '',
      verification_status: 'PENDING',
      isVerified: false,
      isFounding: false,
      tierName: 'Creator Preview',
      profileCompletion: 10,
      issuedAt: user?.createdAt || '',
      lastVerifiedAt: '',
      digitalSignature: '',
      connections: {},
      skills: [],
      achievements: [],
      collaborations: [],
      portfolio: [],
    };
  };

  useEffect(() => {
    let isMounted = true;
    let hasActiveSession = false;

    // Check cached auth hint or local storage card for instant zero-latency paint
    if (typeof window !== 'undefined') {
      try {
        const cached = readCachedAuthHint();
        if (cached?.creator) {
          setActiveCreator(cached.creator as CreatorProfile);
          hasActiveSession = true;
        } else if (cached?.user) {
          setActiveCreator(makeAccountPreview(cached.user));
          hasActiveSession = true;
        } else {
          const stored = localStorage.getItem('creatorhq_user_card');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.displayName || parsed.username)) {
              setActiveCreator(parsed);
              hasActiveSession = true;
            }
          }
        }
      } catch (e) {}
    }

    // Verify authenticated session with server
    const checkActiveSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            hasActiveSession = true;
            if (data.creator) {
              setActiveCreator(data.creator);
            } else {
              const localCard = typeof window !== 'undefined' ? localStorage.getItem('creatorhq_user_card') : null;
              if (localCard) {
                try {
                  const parsed = JSON.parse(localCard);
                  if (parsed && (parsed.displayName || parsed.username)) {
                    setActiveCreator(parsed);
                    return;
                  }
                } catch (e) {}
              }
              setActiveCreator(makeAccountPreview(data.user));
            }
            return;
          }
        }
      } catch (e) {}

      // If not authenticated, check if visitor has a local card or fallback to demo template
      if (isMounted) {
        const localCard = typeof window !== 'undefined' ? localStorage.getItem('creatorhq_user_card') : null;
        if (localCard) {
          try {
            const parsed = JSON.parse(localCard);
            if (parsed && (parsed.displayName || parsed.username)) {
              setActiveCreator(parsed);
              return;
            }
          } catch (e) {}
        }
        hasActiveSession = false;
        setActiveCreator(DEMO_CHANNEL_TEMPLATE);
      }
    };

    checkActiveSession();
    const refreshAuthAndPass = window.setInterval(() => {
      if (hasActiveSession) checkActiveSession();
    }, 4000);

    const handleAuthUpdate = (event: any) => {
      if (event.detail?.creator) {
        setActiveCreator(event.detail.creator);
      } else if (event.detail?.user) {
        setActiveCreator(makeAccountPreview(event.detail.user));
      }
    };

    const handleProfileUpdate = (event: any) => {
      if (event.detail && (event.detail.displayName || event.detail.username || event.detail.slug)) {
        setActiveCreator(event.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('creatorhq_auth_updated', handleAuthUpdate);
      window.addEventListener('creatorhq_profile_updated', handleProfileUpdate);
    }

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
      window.clearInterval(refreshAuthAndPass);
      if (typeof window !== 'undefined') {
        window.removeEventListener('creatorhq_auth_updated', handleAuthUpdate);
        window.removeEventListener('creatorhq_profile_updated', handleProfileUpdate);
      }
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
