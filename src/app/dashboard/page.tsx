'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PassportCard from '@/components/PassportCard';
import MoreChannelsCard from '@/components/MoreChannelsCard';
import ImageUploader from '@/components/ImageUploader';
import AuthCard from '@/components/AuthCard';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import { CreatorProfile, ChannelItem, PlatformConnection } from '@/lib/types';
import { 
  Sparkles, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  User, 
  Upload, 
  Share2, 
  Eye, 
  Lock, 
  CheckCircle2, 
  Loader2,
  FileCheck,
  Palette,
  Settings,
  HelpCircle
} from 'lucide-react';

const CATEGORIES = [
  'Gaming Creator',
  'Tech & Development',
  'AI & Machine Learning',
  'Entertainment & Comedy',
  'Education & Tutorials',
  'Music & Audio',
  'Finance & Crypto',
  'Lifestyle & Travel',
  'Fitness & Sports',
];

const THEME_COLORS = [
  { name: 'Cobalt Sky', color: '#0284c7' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Crimson', color: '#ef4444' },
  { name: 'Amethyst', color: '#a855f7' },
  { name: 'Amber Gold', color: '#f59e0b' },
  { name: 'Matte Graphite', color: '#334155' },
];

export default function DashboardPage() {
  // Session & Auth state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'editor' | 'platforms' | 'channels' | 'verification' | 'settings'>('editor');

  // Creator Card State
  const [hasExistingCard, setHasExistingCard] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('Global');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [cardColor, setCardColor] = useState(THEME_COLORS[0].color);

  // Platform Links & Stats
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState<PlatformConnection | null>(null);
  const [youtubeDetecting, setYoutubeDetecting] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const [discordInput, setDiscordInput] = useState('');
  const [discordServer, setDiscordServer] = useState<PlatformConnection | null>(null);
  const [discordDetecting, setDiscordDetecting] = useState(false);
  const [discordError, setDiscordError] = useState<string | null>(null);

  const [instagramInput, setInstagramInput] = useState('');
  const [instagramProfile, setInstagramProfile] = useState<PlatformConnection | null>(null);
  const [instagramDetecting, setInstagramDetecting] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  // More channels
  const [moreChannels, setMoreChannels] = useState<ChannelItem[]>([]);

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');
  const [proofFileBase64, setProofFileBase64] = useState<string | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // Save & UI feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Load session & creator card
  const loadUserAndCard = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setUsername(data.user.username);
        setDisplayName(data.user.displayName || data.user.username);

        if (data.creator) {
          const c: CreatorProfile = data.creator;
          setHasExistingCard(true);
          setDisplayName(c.displayName || data.user.displayName || data.user.username);
          setUsername(c.username || data.user.username);
          setCategory(c.category || c.niche || CATEGORIES[0]);
          setBio(c.bio || '');
          setCountry(c.country || 'Global');
          setAvatarUrl(c.avatarUrl || '');
          setCardColor(c.cardColor || THEME_COLORS[0].color);
          setVerificationStatus(c.verification_status || 'PENDING');
          setMoreChannels(c.moreChannels || []);

          if (c.connections?.youtube?.connected) {
            setYoutubeChannel(c.connections.youtube);
            setYoutubeInput(c.connections.youtube.profileUrl || c.connections.youtube.username || '');
          }
          if (c.connections?.discord?.connected) {
            setDiscordServer(c.connections.discord);
            setDiscordInput(c.connections.discord.profileUrl || c.connections.discord.guildName || '');
          }
          if (c.connections?.instagram?.connected) {
            setInstagramProfile(c.connections.instagram);
            setInstagramInput(c.connections.instagram.profileUrl || c.connections.instagram.username || '');
          }
        } else {
          setHasExistingCard(false);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndCard();
  }, []);

  // Detect YouTube
  const handleDetectYouTube = async () => {
    if (!youtubeInput.trim()) return;
    setYoutubeDetecting(true);
    setYoutubeError(null);

    try {
      const res = await fetch('/api/youtube/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to detect channel');
      }

      const ch = data.channel;
      const conn: PlatformConnection = {
        platform: 'YOUTUBE',
        connected: true,
        username: ch.handle.replace(/^@/, ''),
        metricLabel: 'subscribers',
        metricValue: ch.subscriberCountFormatted,
        verified: true,
        profileUrl: ch.url,
        channelId: ch.channelId,
        rawCount: ch.subscriberCount,
        avatarUrl: ch.avatarUrl,
        lastSynced: ch.lastUpdated,
      };

      setYoutubeChannel(conn);
      // Auto-set avatar if user doesn't have a custom one
      if (!avatarUrl && ch.avatarUrl) {
        setAvatarUrl(ch.avatarUrl);
      }
    } catch (err: any) {
      setYoutubeError(err.message || 'Could not verify YouTube channel.');
    } finally {
      setYoutubeDetecting(false);
    }
  };

  // Detect Discord
  const handleDetectDiscord = async () => {
    if (!discordInput.trim()) return;
    setDiscordDetecting(true);
    setDiscordError(null);

    try {
      const res = await fetch('/api/discord/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteUrl: discordInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to detect Discord server');
      }

      const s = data.server;
      const conn: PlatformConnection = {
        platform: 'DISCORD',
        connected: true,
        username: s.guildName,
        guildName: s.guildName,
        guildId: s.guildId,
        guildIcon: s.guildIcon,
        metricLabel: 'members',
        metricValue: s.memberCountFormatted,
        verified: true,
        profileUrl: s.inviteUrl,
        rawCount: s.memberCount,
        lastSynced: s.lastUpdated,
      };

      setDiscordServer(conn);
    } catch (err: any) {
      setDiscordError(err.message || 'Could not resolve Discord server invite.');
    } finally {
      setDiscordDetecting(false);
    }
  };

  // Detect Instagram
  const handleDetectInstagram = async () => {
    if (!instagramInput.trim()) return;
    setInstagramDetecting(true);
    setInstagramError(null);

    try {
      const res = await fetch('/api/instagram/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to detect Instagram');
      }

      const p = data.profile;
      const conn: PlatformConnection = {
        platform: 'INSTAGRAM',
        connected: true,
        username: p.username,
        metricLabel: 'followers',
        metricValue: p.followersFormatted || `${p.username}`,
        verified: true,
        profileUrl: p.url,
        rawCount: p.followersCount,
        lastSynced: p.lastUpdated,
      };

      setInstagramProfile(conn);
    } catch (err: any) {
      setInstagramError(err.message || 'Could not verify Instagram profile.');
    } finally {
      setInstagramDetecting(false);
    }
  };

  // Save Card to Database
  const handleSaveCard = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const cleanSlug = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const payload: Partial<CreatorProfile> = {
        displayName: displayName.trim() || username,
        username: cleanSlug,
        slug: cleanSlug,
        category,
        niche: category,
        bio: bio.trim(),
        country,
        avatarUrl: avatarUrl || '',
        cardColor,
        connections: {
          youtube: youtubeChannel || undefined,
          discord: discordServer || undefined,
          instagram: instagramProfile || undefined,
        },
        moreChannels: moreChannels || [],
      };

      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to save Creator Card');
      }

      setHasExistingCard(true);
      setSaveSuccess('Creator Card saved and published to the CreatorHQ network!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Verification Proofs
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFileBase64) {
      alert('Please upload an image screenshot of your YouTube Studio or Discord server settings.');
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorSlug: username,
          creatorName: displayName,
          proofFiles: [
            {
              filename: 'audit_proof.png',
              base64: proofFileBase64,
              platform: youtubeChannel ? 'YOUTUBE' : 'DISCORD',
              notes: proofNotes || 'Proof submitted via CreatorHQ Dashboard',
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to submit verification');
      }

      setVerificationStatus('PENDING');
      alert('Verification proof submitted! CreatorHQ staff will review your application within 24-48 hours.');
      setProofFileBase64(null);
      setProofNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Permanent Delete Creator Card
  const handleDeleteCard = async () => {
    try {
      const res = await fetch(`/api/creators?slug=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to delete card');
      }

      setHasExistingCard(false);
      setDeleteConfirmOpen(false);
      alert('Your Creator Card has been permanently deleted.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to delete creator pass.');
    }
  };

  // Preview Creator Object for 3D Card
  const previewCreator: CreatorProfile = {
    id: `creator_${username || 'creator'}`,
    userId: currentUser?.id || 'usr_curr',
    slug: username || 'creator',
    handle: `@${username || 'creator'}`,
    username: username || 'creator',
    displayName: displayName || 'Your Name',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    category,
    niche: category,
    country,
    bio,
    isVerified: verificationStatus === 'VERIFIED',
    verification_status: (verificationStatus as any) || 'PENDING',
    isFounding: true,
    tierName: verificationStatus === 'VERIFIED' ? 'Founding Member Tier I' : 'Candidate Member',
    profileCompletion: 95,
    contactEmail: currentUser?.email || 'creator@creatorhq.fun',
    issuedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString().split('T')[0],
    digitalSignature: '0x' + (username || 'creator').split('').reduce((a, b) => a + b.charCodeAt(0).toString(16), ''),
    isSuspended: false,
    cardColor,
    connections: {
      youtube: youtubeChannel || undefined,
      discord: discordServer || undefined,
      instagram: instagramProfile || undefined,
    },
    moreChannels,
    skills: ['Content Creation'],
    achievements: [],
    collaborations: [],
    portfolio: [],
  };

  // Copy Public Link
  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://creatorhq.fun';
    const link = `${origin}/${username || 'creator'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-xs font-mono tracking-wider text-slate-400">AUTHENTICATING SESSION...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Auth Card
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans pt-20 relative overflow-hidden">
        <Navbar />
        <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none overflow-hidden">
          <CamouflageBannerBg />
        </div>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 py-16">
          <AuthCard onSuccess={() => loadUserAndCard()} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans pt-20 relative selection:bg-sky-500/30 selection:text-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-7xl space-y-8">
        
        {/* DASHBOARD TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#11141c] border border-white/10 shadow-xl">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-14 h-14 rounded-2xl object-cover border border-sky-400/30 shadow-md ring-2 ring-black"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white font-black flex items-center justify-center text-xl shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
                  {displayName}
                </h1>
                {verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold font-mono">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 text-[10px] font-bold font-mono">
                    <Clock className="w-3 h-3" /> CANDIDATE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span>@{username}</span>
                <span>•</span>
                <span className="text-sky-400">{currentUser.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Public Link'}</span>
            </button>

            <Link
              href={`/${username}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>View Profile</span>
            </Link>

            <button
              onClick={handleSaveCard}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl btn-chq-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
        )}

        {/* MAIN STUDIO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 5 COLS: INTERACTIVE 3D CREATOR CARD PREVIEW */}
          <div className="lg:col-span-5 space-y-6 sticky top-28">
            <div className="p-6 rounded-3xl bg-[#11141c] border border-white/10 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  LIVE INTERACTIVE CARD
                </span>
                <span className="text-[11px] text-sky-400 font-mono">
                  3D Tilt & Flip Active
                </span>
              </div>

              {/* 3D Card Display */}
              <div className="flex justify-center py-2">
                <PassportCard creator={previewCreator} interactive={true} />
              </div>

              {/* Card Color Selector */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Card Accent Palette</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {THEME_COLORS.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setCardColor(t.color)}
                      style={{ backgroundColor: t.color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        cardColor === t.color ? 'border-white ring-2 ring-sky-400 shadow-md scale-110' : 'border-black/50'
                      }`}
                      title={t.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: EDIT STUDIO CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#11141c] border border-white/10 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'editor' ? 'bg-sky-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Identity & Avatar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('platforms')}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'platforms' ? 'bg-sky-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Platforms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('channels')}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'channels' ? 'bg-sky-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                3. More Channels
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'verification' ? 'bg-sky-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                4. Verification
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-sky-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Settings
              </button>
            </div>

            {/* TAB 1: IDENTITY & AVATAR */}
            {activeTab === 'editor' && (
              <div className="p-6 rounded-3xl bg-[#11141c] border border-white/10 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-sans">Creator Profile & Custom Avatar</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Customize your public CreatorHQ name, niche, and avatar.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. ItsUniquePlayz"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Primary Niche / Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Creator Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short description of your content, audience, and achievements..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  />
                </div>

                {/* Avatar Picker & Upload */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="text-xs font-bold text-slate-300 block font-sans">
                    Profile Avatar
                  </label>

                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-md shrink-0 bg-black/40"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <ImageUploader
                        label="Upload Custom Avatar"
                        description="Drag and drop or select PNG/JPG image (max 8MB)."
                        currentImage={avatarUrl}
                        onImageChange={(dataUrl) => setAvatarUrl(dataUrl || '')}
                      />
                    </div>
                  </div>

                  {youtubeChannel?.avatarUrl && youtubeChannel.avatarUrl !== avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(youtubeChannel.avatarUrl || '')}
                      className="text-xs text-sky-400 hover:text-sky-300 underline font-semibold flex items-center gap-1.5"
                    >
                      <span>Use avatar from linked YouTube channel</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PLATFORM CONNECTIONS */}
            {activeTab === 'platforms' && (
              <div className="p-6 rounded-3xl bg-[#11141c] border border-white/10 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-sans">Social Platform Auto-Fetching</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Link your real channels. CreatorHQ auto-fetches authentic subscriber counts and member statistics.
                  </p>
                </div>

                {/* YouTube Connection */}
                <div className="p-4 rounded-2xl bg-[#0b0d11] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 fill-red-500" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span className="text-xs font-bold text-white">YouTube Primary Channel</span>
                    </div>
                    {youtubeChannel?.connected && (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        {youtubeChannel.metricValue}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      placeholder="https://youtube.com/@handle or @channelName"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#141820] border border-white/10 text-white text-xs font-mono focus:border-red-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleDetectYouTube}
                      disabled={youtubeDetecting || !youtubeInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {youtubeDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>{youtubeDetecting ? 'Detecting...' : 'Detect Channel'}</span>
                    </button>
                  </div>

                  {youtubeError && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{youtubeError}</span>
                    </p>
                  )}
                </div>

                {/* Discord Connection */}
                <div className="p-4 rounded-2xl bg-[#0b0d11] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 fill-[#5865F2]" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      <span className="text-xs font-bold text-white">Discord Community Server</span>
                    </div>
                    {discordServer?.connected && (
                      <span className="text-[10px] font-bold text-indigo-400 font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/40">
                        {discordServer.metricValue}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={discordInput}
                      onChange={(e) => setDiscordInput(e.target.value)}
                      placeholder="https://discord.gg/yourserver or invite code"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#141820] border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleDetectDiscord}
                      disabled={discordDetecting || !discordInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {discordDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>{discordDetecting ? 'Detecting...' : 'Detect Server'}</span>
                    </button>
                  </div>

                  {discordError && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{discordError}</span>
                    </p>
                  )}
                </div>

                {/* Instagram Connection */}
                <div className="p-4 rounded-2xl bg-[#0b0d11] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 fill-[#E1306C]" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span className="text-xs font-bold text-white">Instagram Profile</span>
                    </div>
                    {instagramProfile?.connected && (
                      <span className="text-[10px] font-bold text-pink-400 font-mono bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/40">
                        {instagramProfile.metricValue}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={instagramInput}
                      onChange={(e) => setInstagramInput(e.target.value)}
                      placeholder="https://instagram.com/handle or @handle"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#141820] border border-white/10 text-white text-xs font-mono focus:border-pink-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleDetectInstagram}
                      disabled={instagramDetecting || !instagramInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {instagramDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>{instagramDetecting ? 'Detecting...' : 'Detect Instagram'}</span>
                    </button>
                  </div>

                  {instagramError && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{instagramError}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: MORE CHANNELS */}
            {activeTab === 'channels' && (
              <MoreChannelsCard
                passportId={username}
                channels={moreChannels}
                editable={true}
                onUpdate={(updated) => setMoreChannels(updated)}
              />
            )}

            {/* TAB 4: VERIFICATION PROOFS */}
            {activeTab === 'verification' && (
              <div className="p-6 rounded-3xl bg-[#11141c] border border-white/10 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-sans">Verification & Proof Documents</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submit authentic proof documents (e.g. YouTube Studio analytics, Discord ownership) to earn the verified badge.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0d11] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Current Application Status:</span>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase ${
                      verificationStatus === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                      verificationStatus === 'REJECTED' ? 'bg-red-950 text-red-400 border border-red-500/40' :
                      'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}>
                      {verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verified profiles receive the verified shield, priority placement in the Talents directory, and verified digital stamps that brand sponsors trust.
                  </p>
                </div>

                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <ImageUploader
                    label="Upload Studio Proof Screenshot"
                    description="Upload a screenshot showing your channel dashboard or Discord guild management page."
                    currentImage={proofFileBase64 || undefined}
                    onImageChange={(val) => setProofFileBase64(val)}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Auditor Notes (Optional)</label>
                    <input
                      type="text"
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      placeholder="e.g. YouTube Studio screenshot showing 50k subs milestone"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProof || !proofFileBase64}
                    className="px-6 py-3 rounded-xl btn-chq-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {submittingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                    <span>Submit Proof for Staff Audit</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: ACCOUNT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="p-6 rounded-3xl bg-[#11141c] border border-white/10 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-sans">Account & Security Settings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your authenticated credentials and ownership.</p>
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-[#0b0d11] border border-white/10 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 font-medium">Username:</span>
                    <span className="font-mono text-white font-bold">@{username}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-white/5">
                    <span className="text-slate-400 font-medium">Email:</span>
                    <span className="font-mono text-white font-bold">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-white/5">
                    <span className="text-slate-400 font-medium">Account Role:</span>
                    <span className="font-mono text-sky-400 font-bold uppercase">{currentUser.role}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-white/5">
                    <span className="text-slate-400 font-medium">Email Verification:</span>
                    <span className={`font-bold ${currentUser.emailVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentUser.emailVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                    Danger Zone
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Permanently delete your Creator Card and unbind all platform channels. This action cannot be undone.
                  </p>
                  
                  {deleteConfirmOpen ? (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 space-y-3">
                      <p className="text-xs text-white font-semibold">
                        Are you absolutely sure you want to delete your Creator Card?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteCard}
                          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                        >
                          Yes, Delete My Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOpen(false)}
                          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Creator Pass</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
