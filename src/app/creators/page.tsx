'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import { CreatorProfile } from '@/lib/types';
import { subscribeToCreatorSync } from '@/lib/sync';
import {
  Search,
  Filter,
  Check,
  BadgeCheck,
  ArrowRight,
  ShieldCheck,
  Compass,
  X
} from 'lucide-react';

export default function CreatorsDirectoryPage() {
  const [creatorsList, setCreatorsList] = useState<CreatorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Load from DB API and listen to real-time events
  React.useEffect(() => {
    let isMounted = true;

    async function loadCreators() {
      try {
        const res = await fetch('/api/creators', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.creators && isMounted) {
            setCreatorsList(data.creators);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load creators from API:', e);
      }
      if (isMounted) setIsLoading(false);
    }

    loadCreators();

    // Subscribe to real-time updates from admin actions and minting
    const unsubscribe = subscribeToCreatorSync((payload) => {
      if (payload.type === 'VERIFICATION_UPDATED') {
        setCreatorsList((prev) =>
          prev.map((c) => {
            const s = (c.slug || c.username || c.passportId || '').toLowerCase().replace(/^@/, '');
            const targetSlug = (payload.slug || (payload.creator && (payload.creator.slug || payload.creator.username)) || '').toLowerCase().replace(/^@/, '');
            if (s === targetSlug) {
              if (payload.creator) return payload.creator;
              const isV = payload.isVerified ?? payload.status === 'VERIFIED';
              return {
                ...c,
                isVerified: isV,
                verification_status: (payload.status || (isV ? 'VERIFIED' : 'PENDING')) as any,
                tierName: isV
                  ? (c.tierName && c.tierName !== 'Candidate Member' ? c.tierName : 'Founding Member Tier I')
                  : 'Candidate Member',
              };
            }
            return c;
          })
        );
      } else if (payload.type === 'CREATOR_CREATED' || payload.type === 'CREATOR_UPDATED') {
        if (payload.creator) {
          setCreatorsList((prev) => {
            const cleanSlug = (payload.creator.slug || payload.creator.username || '').toLowerCase();
            const exists = prev.some((c) => (c.slug || c.username || '').toLowerCase() === cleanSlug);
            if (exists) {
              return prev.map((c) =>
                (c.slug || c.username || '').toLowerCase() === cleanSlug ? payload.creator : c
              );
            }
            return [payload.creator, ...prev];
          });
        } else {
          loadCreators();
        }
      } else if (payload.type === 'CREATOR_DELETED') {
        if (payload.slug) {
          const cleanSlug = payload.slug.toLowerCase().replace(/^@/, '');
          setCreatorsList((prev) =>
            prev.filter((c) => (c.slug || c.username || '').toLowerCase().replace(/^@/, '') !== cleanSlug)
          );
        } else {
          loadCreators();
        }
      }
    });

    // Periodic sync polling as resilient fallback
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadCreators();
      }
    }, 6000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const categories = [
    'ALL',
    'Gaming Creator',
    'Tech & AI Creator',
    'Music & Audio',
    '3D Motion & VFX',
    'Software & Systems',
    'Design & UX'
  ];

  // Strictly ONLY YouTube and Discord everywhere per user specification
  const platforms = ['ALL', 'YOUTUBE', 'DISCORD', 'INSTAGRAM', 'X'];

  const filteredCreators = useMemo(() => {
    return creatorsList.filter((creator) => {
      // Search matching name, handle, passportId, skills
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = creator.displayName.toLowerCase().includes(q);
        const matchesUsername = creator.username.toLowerCase().includes(q);
        const matchesId = (creator.passportId || '').toLowerCase().includes(q);
        const matchesCategory = creator.category.toLowerCase().includes(q);
        const matchesSkill = creator.skills.some((s) => s.toLowerCase().includes(q));

        if (!matchesName && !matchesUsername && !matchesId && !matchesCategory && !matchesSkill) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && creator.category !== selectedCategory) {
        return false;
      }

      // Platform filter (Only YouTube and Discord)
      if (selectedPlatform === 'YOUTUBE' && !creator.connections.youtube?.connected) return false;
      if (selectedPlatform === 'DISCORD' && !creator.connections.discord?.connected) return false;

      // Tier filter
      if (selectedTier === 'FOUNDING' && !creator.isFounding) return false;
      if (selectedTier === 'VERIFIED' && !creator.isVerified) return false;

      return true;
    });
  }, [creatorsList, searchQuery, selectedCategory, selectedPlatform, selectedTier]);

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col relative overflow-hidden pt-20">
      <Navbar />

      {/* Camouflaged Luxury Tech Banner Background & Grid */}
      <div className="absolute top-0 inset-x-0 h-[650px] pointer-events-none overflow-hidden">
        <CamouflageBannerBg />
      </div>

      <main className="flex-1 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="max-w-3xl mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#11141a] shadow-sm">
              <Compass className="w-4 h-4 text-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                OFFICIAL DIRECTORY
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
              Creator Directory.<br />
              <span className="text-sky-400">
                Verified Credentials.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
              Explore authentic online creators holding verified Creator IDs across Gaming, Tech, Music, 3D, and Systems.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="rounded-2xl border border-white/10 bg-[#11141a] p-5 sm:p-6 shadow-md space-y-5 mb-12">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-sky-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators by name, @handle, category, or skill..."
                className="w-full pl-11 pr-11 py-3.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10 text-xs">
              
              {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sky-400 font-mono mr-1 font-bold">Category:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                        selectedCategory === cat
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-[#161922] text-slate-300 hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                {/* Platform Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-mono font-bold">Platform:</span>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-slate-200 focus:outline-none focus:border-sky-400 font-medium"
                  >
                    <option value="ALL">All Platforms</option>
                    <option value="YOUTUBE">YouTube Verified</option>
                    <option value="DISCORD">Discord Verified</option>
                  </select>
                </div>

              </div>

            </div>

          {/* Results Count Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 text-xs font-mono text-slate-400">
            <span>
              Showing {filteredCreators.length} of {creatorsList.length} Creator Passes
            </span>
            {(searchQuery || selectedCategory !== 'ALL' || selectedPlatform !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedPlatform('ALL');
                  setSelectedTier('ALL');
                }}
                className="text-sky-400 hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Creator Cards Grid or Empty States */}
          {creatorsList.length === 0 ? (
            <div className="p-12 sm:p-20 rounded-2xl bg-[#12151c] border border-white/15 text-center space-y-6 max-w-2xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <Compass className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                  No Creator Passes Minted Yet
                </h3>
                <p className="text-base text-slate-200 max-w-md mx-auto leading-relaxed font-sans font-normal">
                  All demo profiles have been cleared. Be the first sovereign creator to mint your verified Tier Card on CreatorHQ.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-chq-primary text-sm font-semibold shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Mint Your Creator Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#12151c] border border-white/15 text-center space-y-3 shadow-lg">
              <Compass className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-xl font-bold text-white font-sans">No creators match your query</h3>
              <p className="text-base text-slate-200 font-sans font-normal">
                Try searching with different terms or resetting filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedPlatform('ALL');
                  setSelectedTier('ALL');
                }}
                className="mt-3 px-5 py-2.5 rounded-lg bg-[#161922] border border-white/15 text-sm font-semibold text-sky-400 hover:bg-white/5 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="rounded-2xl border border-white/15 bg-[#12151c] p-6 sm:p-7 hover:border-sky-400/60 transition-all flex flex-col justify-between h-full space-y-5 shadow-lg"
                >
                  <div className="space-y-5">
                    
                    {/* Top Row: Avatar + Name + Creator ID */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-bold text-white leading-tight font-sans">
                              {creator.displayName}
                            </h3>
                            {creator.isVerified && (
                              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-sm font-mono text-slate-300 block mt-0.5 font-medium">
                            @{creator.username}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-sky-400 block">
                          @{creator.slug || creator.username}
                        </span>
                        <span className={`text-[10px] uppercase font-semibold ${
                          (creator.isVerified || creator.verification_status === 'VERIFIED')
                            ? 'text-emerald-400'
                            : (creator.verification_status === 'REJECTED' ? 'text-red-400' : 'text-amber-400')
                        }`}>
                          {(creator.isVerified || creator.verification_status === 'VERIFIED')
                            ? (creator.isFounding ? 'FOUNDING' : 'VERIFIED')
                            : (creator.verification_status === 'REJECTED' ? 'REJECTED' : 'PENDING')}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <div className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
                        CATEGORY
                      </div>
                      <div className="text-base font-bold text-white mt-0.5 font-sans">
                        {creator.category}
                      </div>
                    </div>

                    {/* Platform Badges with Stats */}
                    <div className="p-4 rounded-xl bg-[#161922] border border-white/10 space-y-2.5 text-sm">
                      {creator.connections.youtube?.connected && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 flex items-center gap-2 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span>YouTube</span>
                          </span>
                          <span className="font-mono text-white font-bold text-sm sm:text-base">
                            {creator.connections.youtube.metricValue} subscribers
                          </span>
                        </div>
                      )}
                      {creator.connections.discord?.connected && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 flex items-center gap-2 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#5865F2]" />
                            <span>Discord</span>
                          </span>
                          <span className="font-mono text-white font-bold text-sm sm:text-base">
                            {creator.connections.discord.metricValue} members
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verification Status Pill */}
                    <div className="flex items-center justify-between pt-1">
                      {(creator.isVerified || creator.verification_status === 'VERIFIED') ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>VERIFIED CREATOR</span>
                        </span>
                      ) : creator.verification_status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold shadow-sm">
                          <span>REJECTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
                          <span>PENDING REVIEW</span>
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-300 font-medium">
                        {creator.country || creator.location || 'Global'}
                      </span>
                    </div>

                  </div>

                    {/* View Creator Pass Action Button */}
                    <div className="pt-5 mt-4 border-t border-white/10">
                      <Link
                        href={`/${(creator.slug || creator.username || creator.passportId || '').replace(/^@/, '')}`}
                        className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg btn-chq-primary text-sm font-semibold transition-all shadow-sm"
                      >
                        <span>View Creator Pass</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
