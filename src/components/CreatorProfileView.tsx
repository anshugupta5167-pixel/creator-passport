'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PassportCard from '@/components/PassportCard';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import QuickInfoCard from '@/components/QuickInfoCard';
import MoreChannelsCard from '@/components/MoreChannelsCard';
import { CreatorProfile } from '@/lib/types';
import { getSafeAvatarUrl } from '@/lib/urls';
import { subscribeToCreatorSync } from '@/lib/sync';

import {
  ShieldCheck,
  Check,
  Copy,
  Mail,
  ExternalLink,
  Award,
  Sparkles,
  Lock,
  Download,
  Send,
  X,
  ChevronRight,
  TrendingUp,
  Share2,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface CreatorProfileViewProps {
  creator: CreatorProfile | null;
  targetId?: string;
}

// Verification status badge component
function VerificationBadge({ status }: { status: string }) {
  switch (status) {
    case 'VERIFIED':
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]">
          <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>VERIFIED CREATOR</span>
        </span>
      );
    case 'PENDING':
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>PENDING VERIFICATION</span>
        </span>
      );
    case 'UNDER_REVIEW':
    case 'under_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>UNDER REVIEW</span>
        </span>
      );
    case 'REJECTED':
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>VERIFICATION REJECTED</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-600 text-slate-200 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>UNVERIFIED</span>
        </span>
      );
  }
}

export default function CreatorProfileView({ creator, targetId }: CreatorProfileViewProps) {
  const [activeCreator, setActiveCreator] = useState<CreatorProfile | null>(creator);
  const [isSearching, setIsSearching] = useState(!creator);
  const [isMyOwnPass, setIsMyOwnPass] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  // Synchronize creator and subscribe to real-time events
  useEffect(() => {
    if (creator) {
      setActiveCreator(creator);
      setIsSearching(false);
    }

    const currentSlug = (creator?.slug || creator?.username || targetId || '').toLowerCase().replace(/^@/, '');

    // Secure server-side identity check for ownership
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const authUserSlug = (data.creator?.slug || data.creator?.username || data.user.username || '').toLowerCase().replace(/^@/, '');
          if (authUserSlug && currentSlug && authUserSlug === currentSlug) {
            setIsMyOwnPass(true);
          }
        }
      })
      .catch(() => {});

    // If no server creator was provided, fetch from /api/creators
    if (!creator && targetId) {
      setIsSearching(true);
      fetch(`/api/creators?q=${encodeURIComponent(targetId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.creators && Array.isArray(data.creators)) {
            const cleanT = targetId.toLowerCase().replace(/^@/, '');
            const matched = data.creators.find(
              (c: CreatorProfile) =>
                (c.slug && c.slug.toLowerCase().replace(/^@/, '') === cleanT) ||
                (c.username && c.username.toLowerCase().replace(/^@/, '') === cleanT) ||
                (c.passportId && c.passportId.toLowerCase().replace(/^@/, '') === cleanT) ||
                (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanT) ||
                (c.id && c.id.toLowerCase() === cleanT)
            );
            setActiveCreator(matched || null);
          } else {
            setActiveCreator(null);
          }
          setIsSearching(false);
        })
        .catch(() => {
          setActiveCreator(null);
          setIsSearching(false);
        });
    }

    // Subscribe to live SSE status updates
    const unsubscribe = subscribeToCreatorSync((payload) => {
      const targetClean = (activeCreator?.slug || activeCreator?.username || currentSlug).toLowerCase();
      const payloadSlug = (payload.slug || '').toLowerCase();
      if (payloadSlug && (payloadSlug === targetClean || (payload.creator && (payload.creator.slug || '').toLowerCase() === targetClean))) {
        if (payload.creator) {
          setActiveCreator(payload.creator);
        } else if (payload.status) {
          setActiveCreator((prev) =>
            prev
              ? {
                  ...prev,
                  verification_status: payload.status as any,
                  isVerified: payload.isVerified ?? payload.status === 'VERIFIED',
                }
              : null
          );
        }
      }
    });

    return unsubscribe;
  }, [creator, targetId]);

  const handleCopyLink = () => {
    if (!activeCreator) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanSlug = (activeCreator.slug || activeCreator.username || 'creator').replace(/^@/, '');
    const shareUrl = `${origin}/${cleanSlug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setContactModalOpen(false);
      setInquirySent(false);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryMessage('');
    }, 2200);
  };

  if (isSearching) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans pt-20">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono text-slate-400">Locating Creator Profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!activeCreator) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans pt-20 relative overflow-hidden">
        <Navbar />
        <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none">
          <CamouflageBannerBg />
        </div>
        <main className="flex-1 flex items-center justify-center py-24 px-4 relative z-10">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-[#11141a]/95 border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Creator Pass Not Found</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                No active pass exists for {targetId || 'this identifier'}. You can mint your sovereign verified identity in Creator Studio.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-chq-primary text-xs font-semibold text-white shadow-sm"
              >
                <span>Create Pass in Studio</span>
              </Link>
              <Link
                href="/creators"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>Browse Directory</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const yt = activeCreator.connections?.youtube;
  const dc = activeCreator.connections?.discord;
  const isActuallyVerified = Boolean(activeCreator.isVerified || activeCreator.verification_status === 'VERIFIED');
  const isRejected = activeCreator.verification_status === 'REJECTED';
  const verificationStatus = isActuallyVerified
    ? 'VERIFIED'
    : (isRejected ? 'REJECTED' : 'PENDING');

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20 relative overflow-hidden">
      <Navbar />

      {/* Camouflage Tech Atmosphere in Background */}
      <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none overflow-hidden">
        <CamouflageBannerBg />
      </div>

      <main className="flex-1 py-10 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/[0.06] text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Link href="/creators" className="hover:text-white transition-colors text-slate-400">
                Talents
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-semibold">{activeCreator.displayName || activeCreator.username}</span>
            </div>

            {isMyOwnPass && (
              <span className="px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-semibold">
                Your Personal Pass
              </span>
            )}
          </div>

          {/* ================= PROFILE IDENTITY BANNER ================= */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-7 rounded-3xl bg-[#0e1217] border border-white/10 shadow-xl">
            <div className="flex items-center gap-5 sm:gap-6">
              {/* Glowing Circular Avatar */}
              <div className="relative shrink-0">
                <img
                  src={getSafeAvatarUrl(activeCreator.avatarUrl, activeCreator.displayName)}
                  alt={activeCreator.displayName}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCreator.displayName || 'Creator')}&background=141414&color=ffffff&size=256&bold=true`;
                  }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/20 shadow-md ring-2 ring-black"
                />
                {isActuallyVerified && (
                  <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#0088ff] border-2 border-white flex items-center justify-center text-white shadow-md ring-1 ring-black/40" title="Verified Creator">
                    <Check className="w-3.5 h-3.5 stroke-[3.5] text-white" />
                  </span>
                )}
              </div>

              {/* Title, Bio, Tags */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    {activeCreator.displayName}
                  </h1>
                  <span className="text-sm font-bold text-sky-400 font-sans">
                    @{activeCreator.slug || activeCreator.username}
                  </span>
                </div>

                {/* Verification Status Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <VerificationBadge status={verificationStatus} />
                </div>

                <p className="text-base text-slate-200 leading-relaxed max-w-2xl font-normal font-sans">
                  {activeCreator.bio || 'Main gaming channel featuring Minecraft content, playthroughs, and commentary'}
                </p>

                {/* Categories */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="px-3.5 py-0.5 rounded-full bg-[#0c1f38] text-[#58a6ff] border border-[#1f4272] text-xs font-semibold">
                    {activeCreator.niche || activeCreator.category || 'Creator'}
                  </span>
                </div>

                {/* Rejection notice (visible only to the creator) */}
                {verificationStatus === 'REJECTED' && isMyOwnPass && activeCreator.rejectionReason && (
                  <div className="mt-2 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-300">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="font-bold text-red-200">Verification Rejected</span>
                    </div>
                    <p>Reason: {activeCreator.rejectionReason}</p>
                    <p className="mt-1 text-red-400">You can resubmit proof from your dashboard.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions on the Right */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
              {isMyOwnPass && (
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold text-white transition-colors"
                >
                  Edit in Studio
                </Link>
              )}
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/10 text-sm font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>Share Pass</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setContactModalOpen(true)}
                className="px-5 py-2.5 rounded-xl btn-chq-primary text-white text-sm font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </button>
            </div>
          </div>

          {/* ================= CONNECTED PLATFORMS & AUDIENCE STATS ================= */}
          <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* YouTube */}
            {yt?.connected && (
              <a
                href={yt.profileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-[#0e1217] border border-white/10 hover:border-red-500/40 transition-all flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 fill-[#FF0000]" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm text-slate-300 block font-semibold">YouTube</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {(yt.metricValue || '0').replace(/\s*(subscribers|subs)\s*/gi, '')}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">{yt.metricLabel || 'subscribers'}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white ml-auto transition-colors" />
              </a>
            )}

            {/* Discord */}
            {dc?.connected && (
              <a
                href={dc.profileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-[#0e1217] border border-white/10 hover:border-indigo-500/40 transition-all flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 fill-[#5865F2]" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm text-slate-300 block font-semibold">Discord</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {dc.metricValue || '0'}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">{dc.metricLabel || 'members'}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white ml-auto transition-colors" />
              </a>
            )}

            {/* Instagram */}
            {activeCreator.connections?.instagram?.connected && (
              <a
                href={activeCreator.connections?.instagram?.profileUrl || `https://instagram.com/${activeCreator.connections?.instagram?.username || activeCreator.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-[#0e1217] border border-white/10 hover:border-pink-500/40 transition-all flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 fill-[#E1306C]" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm text-slate-300 block font-semibold">Instagram</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {activeCreator.connections?.instagram?.metricValue || `@${activeCreator.connections?.instagram?.username || activeCreator.username}`}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">
                    @{activeCreator.connections?.instagram?.username || activeCreator.username}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white ml-auto transition-colors" />
              </a>
            )}

          </div>

          {/* ================= 3D PASSPORT CARD SHOWCASE ================= */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="w-full max-w-lg">
              <PassportCard
                creator={activeCreator}
                size="hero"
                interactive={true}
                showControls={true}
                allowFreeze={true}
                allowThemes={true}
              />
            </div>
          </div>

          {/* ================= QUICK INFO SECTION ================= */}
          <div className="mb-8">
            <QuickInfoCard creator={activeCreator} />
          </div>

          {/* ================= MORE CHANNELS SECTION ================= */}
          <div className="mb-12">
            <MoreChannelsCard
              passportId={activeCreator.slug || activeCreator.username}
              channels={activeCreator.moreChannels || []}
              allowAdd={isMyOwnPass}
              onChannelsUpdated={(updatedChannels) => {
                setActiveCreator((prev) => {
                  if (!prev) return prev;
                  return { ...prev, moreChannels: updatedChannels };
                });
              }}
            />
          </div>


        </div>
      </main>

      {/* ================= CONTACT / COLLAB MODAL ================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#11141a] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-mono text-sky-400 uppercase tracking-widest font-semibold">
                COLLABORATION INQUIRY
              </span>
              <h3 className="text-xl font-bold text-white mt-1 font-sans">
                Contact {activeCreator.displayName}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your proposal will be delivered securely to {activeCreator.displayName}&apos;s verified creator inbox.
              </p>
            </div>

            {inquirySent ? (
              <div className="p-6 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center space-y-2">
                <Check className="w-8 h-8 text-sky-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Proposal Sent</h4>
                <p className="text-xs text-slate-300">
                  {activeCreator.displayName} has received your inquiry.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">YOUR NAME / BRAND</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Acme Media"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">BUSINESS EMAIL</label>
                  <input
                    type="email"
                    required
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="sponsor@brand.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">PROPOSAL DETAILS</label>
                  <textarea
                    rows={4}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Details about sponsorship, deliverables, timeline, and budget..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
