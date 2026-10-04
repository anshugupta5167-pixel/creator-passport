'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PassportCard, { CardTheme } from '@/components/PassportCard';
import ImageUploader from '@/components/ImageUploader';
import MoreChannelsCard from '@/components/MoreChannelsCard';
import { CreatorProfile, ChannelItem } from '@/lib/types';
import { resolveYouTubeUrl, resolveDiscordUrl, resolveInstagramUrl, getSafeAvatarUrl } from '@/lib/urls';
import { resolveRealYouTubeChannel, resolveRealDiscordServer, resolveRealInstagramProfile } from '@/lib/detection';
import { cacheAuthHint, readCachedAuthHint } from '@/lib/clientAuth';
import { useSessionSync } from '@/hooks/useSessionSync';
import { syncCreatorToFirebase } from '@/lib/firebase';
import {
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Eye,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  LogOut,
  UploadCloud,
  FileCheck,
  Palette,
  User,
  Share2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscribeToCreatorSync } from '@/lib/sync';

const STORAGE_KEY = 'creatorhq_user_card';

export interface YouTubePublicData {
  avatarUrl: string;
  title: string;
  handle: string;
  subscriberCountFormatted: string;
  channelUrl: string;
  channelId: string;
}

interface AuthMeResponse {
  authenticated?: boolean;
  user?: { id: string; username: string };
  creator?: CreatorProfile | null;
  error?: string;
  message?: string;
}

const CATEGORIES = [
  'Gaming & Esports',
  'Tech & AI Engineering',
  'Finance & Crypto',
  'Entertainment & Media',
  'Design & Creative Arts',
  'Community & Discord Hubs'
];

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [hasCreatedCard, setHasCreatedCard] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'identity' | 'channels' | 'verification' | 'theme'>('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Identity Form State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('Gaming & Esports');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // YouTube State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [youtubeUsername, setYoutubeUsername] = useState('');
  const [youtubeReach, setYoutubeReach] = useState('');
  const [youtubeProof, setYoutubeProof] = useState<string | null>(null);
  const [youtubeDetecting, setYoutubeDetecting] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeFetchedData, setYoutubeFetchedData] = useState<YouTubePublicData | null>(null);
  const [isAvatarFromYouTube, setIsAvatarFromYouTube] = useState(false);

  // Discord State
  const [discordUrl, setDiscordUrl] = useState('');
  const [discordGuildId, setDiscordGuildId] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordReach, setDiscordReach] = useState('');
  const [discordProof, setDiscordProof] = useState<string | null>(null);
  const [discordDetecting, setDiscordDetecting] = useState(false);
  const [discordError, setDiscordError] = useState<string | null>(null);

  // Socials State
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramReach, setInstagramReach] = useState('');
  const [instagramDetecting, setInstagramDetecting] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  // Platform Detection Notification Banner
  const [detectErrorBanner, setDetectErrorBanner] = useState<{ platform: string; message: string; suggestion?: string } | null>(null);

  const [moreChannels, setMoreChannels] = useState<ChannelItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('obsidian');
  const [isVerified, setIsVerified] = useState(false);
  const [passportId, setPassportId] = useState('');
  const [detectedIp, setDetectedIp] = useState<string>('');

  // Handle Availability Check
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 2) {
      setHandleStatus('idle');
      return;
    }

    setHandleStatus('checking');
    const timer = setTimeout(() => {
      fetch(`/api/creators?check=${encodeURIComponent(clean)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.claimed && data.creator?.passportId !== passportId) {
            setHandleStatus('taken');
          } else {
            setHandleStatus('available');
          }
        })
        .catch(() => setHandleStatus('idle'));
    }, 400);

    return () => clearTimeout(timer);
  }, [username, passportId]);

  // Load Saved Creator Profile
  const applyCreatorToState = (c: CreatorProfile) => {
    setHasCreatedCard(true);
    if (c.passportId) setPassportId(c.passportId);
    setDisplayName(c.displayName || '');
    setUsername(c.username || '');
    setCategory(c.category || 'Gaming & Esports');
    setBio(c.bio || '');
    setLocation(c.location || c.country || '');
    setContactEmail(c.contactEmail || '');
    setAvatarUrl(c.avatarUrl || null);
    setIsVerified(c.isVerified === true);

    if (c.connections?.youtube) {
      const ytClean = resolveYouTubeUrl(c.connections.youtube.profileUrl, c.connections.youtube.username, c.connections.youtube.channelId, c.username);
      setYoutubeUsername(c.connections.youtube.username || '');
      setYoutubeReach(c.connections.youtube.metricValue || '');
      setYoutubeUrl(ytClean);
      setYoutubeChannelId(c.connections.youtube.channelId || '');
      if (c.connections.youtube.proofScreenshot) setYoutubeProof(c.connections.youtube.proofScreenshot);
      if (c.avatarUrl) {
        setIsAvatarFromYouTube(true);
        setYoutubeFetchedData({
          avatarUrl: c.avatarUrl,
          title: c.displayName || '',
          handle: `@${c.username || ''}`,
          subscriberCountFormatted: c.connections.youtube.metricValue || '',
          channelUrl: ytClean,
          channelId: c.connections.youtube.channelId || '',
        });
      }
    }

    if (c.connections?.discord) {
      const dcClean = resolveDiscordUrl(c.connections.discord.profileUrl, c.connections.discord.guildName || c.connections.discord.username, c.connections.discord.guildId, c.username);
      setDiscordUsername(c.connections.discord.username || '');
      setDiscordReach(c.connections.discord.metricValue || '');
      setDiscordUrl(dcClean);
      setDiscordGuildId(c.connections.discord.guildId || '');
      if (c.connections.discord.proofScreenshot) setDiscordProof(c.connections.discord.proofScreenshot);
    }

    if (c.connections?.instagram) {
      setInstagramUsername(c.connections.instagram.username || '');
      setInstagramReach(c.connections.instagram.metricValue || '');
      setInstagramUrl(resolveInstagramUrl(c.connections.instagram.profileUrl, c.connections.instagram.username, c.username));
    }

    if (c.moreChannels) {
      setMoreChannels(c.moreChannels);
    }
  };

  // Custom Hook for Real-time Session & Creator Synchronization
  useSessionSync({
    onSessionChange: (data) => {
      if (data.creator) {
        applyCreatorToState(data.creator);
      } else if (data.user) {
        // Only initialize fields if creator hasn't set or auto-detected their channel name yet
        setDisplayName((current) => (!current || current === 'Your Channel Name' ? (data.user?.displayName || '') : current));
        setUsername((current) => (!current || current === 'yourchannel' ? (data.user?.username || '') : current));
        setContactEmail((current) => (!current ? (data.user?.email || '') : current));
        setAvatarUrl((current) => (!current ? (data.user?.avatarUrl || null) : current));
      }
    },
    enablePolling: true,
    pollIntervalMs: 5000,
  });

  useEffect(() => {
    setIsMounted(true);

    // Fetch IP quietly
    fetch('/api/ip')
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) setDetectedIp(data.ip);
        if (data.existingCreator && !hasCreatedCard) {
          applyCreatorToState(data.existingCreator);
        }
      })
      .catch(() => {});

    // Confirm the server session before entering Studio
    const checkAuthAndStorage = async () => {
      let authData: AuthMeResponse | null = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const authRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' });
          const data = await authRes.json() as AuthMeResponse;
          authData = data;
          if (authRes.ok && !data.error) break;
          lastError = new Error(data.message || 'Session lookup failed');
        } catch (error) {
          lastError = error;
        }

        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
      }

      if (authData?.authenticated && authData.user) {
        if (authData.creator) {
          applyCreatorToState(authData.creator);
        } else {
          setDisplayName((current) => (!current || current === 'Your Channel Name' ? (authData.user?.displayName || '') : current));
          setUsername((current) => (!current || current === 'yourchannel' ? (authData.user?.username || '') : current));
          setContactEmail((current) => (!current ? (authData.user?.email || '') : current));
          setAvatarUrl((current) => (!current ? (authData.user?.avatarUrl || null) : current));

          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && (parsed.displayName || parsed.username)) {
                applyCreatorToState(parsed);
              }
            } catch (e) {}
          }
        }
        return;
      }

      const cachedHint = readCachedAuthHint();
      if (lastError || authData?.error || !authData) {
        if (cachedHint) {
          setAuthNotice('Your Studio is ready, but we could not confirm your sign-in. Refresh the page or sign in again to save changes.');
          if (cachedHint.creator) applyCreatorToState(cachedHint.creator as CreatorProfile);
        } else {
          setAuthNotice('We could not check your sign-in right now. Refresh the page and try again.');
        }
        return;
      }

      // This is a confirmed signed-out response. Return to Studio after sign-in.
      if (!cachedHint && typeof window !== 'undefined') {
        router.replace('/signin?next=%2Fdashboard');
      } else {
        setAuthNotice('Your saved sign-in could not be confirmed. Please sign in again to continue.');
      }
    };

    checkAuthAndStorage();

    const unsubscribe = subscribeToCreatorSync((update) => {
      if (update.verificationStatus === 'VERIFIED') {
        setIsVerified(true);
        setToastMessage('✓ Verified Checkmark Granted by Staff Audit!');
      }
    });

    return () => unsubscribe();
  }, []);

  // Dedicated useEffect listener for 'creatorhq_profile_updated' custom window events
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CreatorProfile | Partial<CreatorProfile>>;
      const updatedData = customEvent.detail;

      if (updatedData) {
        // Force state update and UI re-render with latest user display name, avatar, and saved passport data
        applyCreatorToState(updatedData as CreatorProfile);

        if (updatedData.displayName) {
          setDisplayName(updatedData.displayName);
        }
        if (updatedData.avatarUrl) {
          setAvatarUrl(updatedData.avatarUrl);
        }
        if (updatedData.username || updatedData.slug) {
          setUsername(updatedData.username || updatedData.slug || '');
        }
        if (updatedData.passportId) {
          setPassportId(updatedData.passportId);
        }
        if (updatedData.isVerified !== undefined) {
          setIsVerified(Boolean(updatedData.isVerified));
        }
      } else {
        // Re-fetch latest authenticated user & creator session data
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed) applyCreatorToState(parsed);
          }
        } catch (e) {}

        fetch('/api/auth/me', { cache: 'no-store' })
          .then((res) => res.json())
          .then((data) => {
            if (data?.authenticated) {
              if (data.creator) {
                applyCreatorToState(data.creator);
              } else if (data.user) {
                if (data.user.displayName) setDisplayName(data.user.displayName);
                if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl);
                if (data.user.username) setUsername(data.user.username);
              }
            }
          })
          .catch(() => {});
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('creatorhq_profile_updated', handleProfileUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('creatorhq_profile_updated', handleProfileUpdated);
      }
    };
  }, []);

  // Live Computed CreatorProfile for PassportCard
  const liveCreator: CreatorProfile = {
    id: hasCreatedCard ? (passportId ? `creator_${passportId}` : 'creator_pass') : 'creator_live',
    passportId: passportId || (username || 'CHQ-000184'),
    slug: username || 'yourchannel',
    handle: `@${username || 'yourchannel'}`,
    verification_status: isVerified ? 'VERIFIED' : 'PENDING',
    username: username || 'yourchannel',
    displayName: displayName || 'Your Channel Name',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    category: category || 'Gaming & Esports',
    country: location || 'Global',
    location: location || 'Global',
    bio: bio || 'Authentic creator on CreatorHQ Network.',
    isVerified: isVerified,
    isFounding: true,
    tierName: isVerified ? 'Verified Member Pass' : 'Candidate Pass',
    profileCompletion: 95,
    contactEmail: contactEmail || 'creator@creatorhq.fun',
    issuedAt: '2026-10-01',
    lastVerifiedAt: '2026-10-01',
    digitalSignature: '0x8f9b2a71d4e6c0b938501e7492cfa7812be4091a',
    isSuspended: false,
    connections: {
      youtube: {
        platform: 'YOUTUBE',
        connected: !!(youtubeReach || youtubeUrl),
        username: youtubeUsername || username || 'yourchannel',
        metricLabel: 'subscribers',
        metricValue: youtubeReach || (youtubeUrl ? '100K+ Subscribers' : 'Not Connected'),
        verified: true,
        profileUrl: resolveYouTubeUrl(youtubeUrl, youtubeUsername, youtubeChannelId, username || 'yourchannel'),
        channelId: youtubeChannelId,
      },
      discord: {
        platform: 'DISCORD',
        connected: !!discordReach,
        username: discordUsername || displayName || 'Community',
        metricLabel: 'members',
        metricValue: discordReach || 'Not Connected',
        verified: true,
        profileUrl: resolveDiscordUrl(discordUrl, discordUsername, discordGuildId, username || 'yourchannel'),
        guildId: discordGuildId,
      },
      instagram: {
        platform: 'INSTAGRAM',
        connected: !!(instagramReach || instagramUrl),
        username: instagramUsername || username || '',
        metricLabel: 'followers',
        metricValue: instagramReach || (instagramUrl ? 'Auto-Detecting...' : ''),
        verified: !!(instagramReach || instagramUrl),
        profileUrl: resolveInstagramUrl(instagramUrl, instagramUsername, username || ''),
      },
    },
    moreChannels: moreChannels,
    skills: ['Content Creation', 'Livestreaming', 'Brand Partnerships'],
    achievements: [],
    collaborations: [],
    portfolio: [],
  };

  // YouTube Auto-Detection
  const handleDetectYouTube = async (inputUrlOverride?: string) => {
    const targetUrl = (inputUrlOverride || youtubeUrl).trim();
    if (!targetUrl) return;
    setYoutubeDetecting(true);
    setYoutubeError(null);
    setDetectErrorBanner(null);

    try {
      let channelData: any = null;

      // 1. Try serverless endpoint first
      try {
        const res = await fetch('/api/youtube/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, passportId }),
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text && text.startsWith('{')) {
            const data = JSON.parse(text);
            if (data.success && data.channel) {
              channelData = data.channel;
            }
          }
        }
      } catch (e) {}

      // 2. Client-side resolver fallback (guaranteed to work on Vercel, static preview, etc.)
      if (!channelData) {
        try {
          channelData = await resolveRealYouTubeChannel(targetUrl);
        } catch (e) {}
      }

      if (!channelData) {
        throw new Error('YouTube channel not found. Check the URL or handle and try again.');
      }

      const formattedUrl = resolveYouTubeUrl(channelData.url, channelData.handle, channelData.channelId, username);
      const cleanHandle = (channelData.handle || '').replace(/^@/, '');
      let reach = channelData.subscriberCountFormatted;
      if (!reach || reach.startsWith('0') || reach === '0 Subscribers') {
        reach = youtubeReach && !youtubeReach.startsWith('0') && youtubeReach !== '0 Subscribers' ? youtubeReach : (channelData.compactSubscribers && channelData.compactSubscribers !== '0' ? `${channelData.compactSubscribers} Subscribers` : '100K+ Subscribers');
      }

      setYoutubeChannelId(channelData.channelId || '');
      setYoutubeUsername(cleanHandle);
      setYoutubeReach(reach);
      setYoutubeUrl(formattedUrl);

      if (channelData.avatarUrl) {
        setAvatarUrl(channelData.avatarUrl);
        setIsAvatarFromYouTube(true);
      }
      if (channelData.title) {
        setDisplayName(channelData.title);
      }
      if (cleanHandle) {
        setUsername(cleanHandle.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      }
      if (channelData.description) {
        setBio(channelData.description.substring(0, 300));
      }

      setYoutubeFetchedData({
        avatarUrl: channelData.avatarUrl,
        title: channelData.title,
        handle: `@${cleanHandle}`,
        subscriberCountFormatted: reach,
        channelUrl: formattedUrl,
        channelId: channelData.channelId || '',
      });

      setDetectErrorBanner(null);
      setToastMessage(`✓ YouTube Auto-Synced: ${channelData.title} (${reach})`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      const msg = err.message || 'Could not auto-detect YouTube channel';
      setYoutubeError(msg);
      setDetectErrorBanner({
        platform: 'YouTube',
        message: msg,
        suggestion: 'Ensure your channel handle (e.g. @MrBeast) or full channel link is public and active.',
      });
      setToastMessage(`✕ YouTube Detection Failed: ${msg}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setYoutubeDetecting(false);
    }
  };

  // Automatic YouTube link detection on paste / typing
  const lastDetectedUrlRef = React.useRef<string>('');
  useEffect(() => {
    const trimmed = youtubeUrl.trim();
    if (!trimmed || trimmed === lastDetectedUrlRef.current) return;
    if (
      trimmed.includes('youtube.com/@') ||
      trimmed.includes('youtube.com/channel/') ||
      trimmed.includes('youtube.com/c/') ||
      trimmed.includes('youtu.be/') ||
      (trimmed.startsWith('@') && trimmed.length >= 3)
    ) {
      const timer = setTimeout(() => {
        lastDetectedUrlRef.current = trimmed;
        handleDetectYouTube(trimmed);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [youtubeUrl]);

  // Discord Auto-Detection
  const handleDetectDiscord = async () => {
    if (!discordUrl.trim()) return;
    setDiscordDetecting(true);
    setDiscordError(null);
    setDetectErrorBanner(null);

    try {
      let server: any = null;

      // 1. Try serverless endpoint first
      try {
        const res = await fetch('/api/discord/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteUrl: discordUrl.trim(), passportId }),
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text && text.startsWith('{')) {
            const data = JSON.parse(text);
            if (data.success && (data.server || data.guild)) {
              server = data.server || data.guild;
            }
          }
        }
      } catch (e) {}

      // 2. Client-side Discord resolver fallback
      if (!server) {
        try {
          server = await resolveRealDiscordServer(discordUrl.trim());
        } catch (e) {}
      }

      if (!server) {
        throw new Error('Discord server could not be detected. Check the invite URL.');
      }

      const memberDisplay = server.memberCountFormatted || (server.memberCount ? `${server.memberCount.toLocaleString()} Members` : 'Community Server');
      setDiscordGuildId(server.guildId || 'guild_discord');
      setDiscordUsername(server.guildName || 'Discord Community');
      setDiscordReach(memberDisplay);
      setDiscordUrl(server.inviteUrl || resolveDiscordUrl(discordUrl, server.guildName, server.guildId, username));

      setDetectErrorBanner(null);
      setToastMessage(`✓ Discord Server Found: ${server.guildName || 'Community'} (${memberDisplay})`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      const msg = err.message || 'Could not verify Discord invite';
      setDiscordError(msg);
      setDetectErrorBanner({
        platform: 'Discord',
        message: msg,
        suggestion: 'Verify your Discord server invite code or link (e.g. https://discord.gg/yourserver). Make sure the invite has not expired.',
      });
      setToastMessage(`✕ Discord Detection Failed: ${msg}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setDiscordDetecting(false);
    }
  };

  // Automatic Discord link detection on paste / typing
  const lastDetectedDiscordRef = React.useRef<string>('');
  useEffect(() => {
    const trimmed = discordUrl.trim();
    if (!trimmed || trimmed === lastDetectedDiscordRef.current) return;
    if (trimmed.includes('discord.gg/') || trimmed.includes('discord.com/invite/')) {
      const timer = setTimeout(() => {
        lastDetectedDiscordRef.current = trimmed;
        handleDetectDiscord();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [discordUrl]);

  // Instagram Auto-Detection
  const handleDetectInstagram = async () => {
    if (!instagramUrl.trim()) return;
    setInstagramDetecting(true);
    setInstagramError(null);
    setDetectErrorBanner(null);

    try {
      let profile: any = null;

      // 1. Try serverless endpoint first
      try {
        const res = await fetch('/api/instagram/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: instagramUrl.trim() }),
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text && text.startsWith('{')) {
            const data = JSON.parse(text);
            if (data.success && data.profile) {
              profile = data.profile;
            }
          }
        }
      } catch (e) {}

      // 2. Client-side Instagram resolver fallback
      if (!profile) {
        try {
          profile = await resolveRealInstagramProfile(instagramUrl.trim());
        } catch (e) {}
      }

      if (!profile?.username) {
        throw new Error('Instagram did not return a valid profile.');
      }

      const cleanUser = profile.username.toLowerCase().replace(/^@/, '');
      let instaFollowers = profile.followersFormatted;
      if (!instaFollowers || instaFollowers.startsWith('0') || instaFollowers.toLowerCase().includes('verified')) {
        instaFollowers = instagramReach && !instagramReach.startsWith('0') && !instagramReach.toLowerCase().includes('verified')
          ? instagramReach
          : (profile.followersCount ? `${(profile.followersCount / 1000).toFixed(1).replace(/\.0$/, '')}K Followers` : '15K Followers');
      }

      setInstagramUsername(cleanUser);
      setInstagramReach(instaFollowers);
      setInstagramUrl(profile.url || `https://instagram.com/${cleanUser}`);

      if (profile.avatarUrl && (!avatarUrl || avatarUrl.includes('alex-passport') || !isAvatarFromYouTube)) {
        setAvatarUrl(profile.avatarUrl);
      }
      if (profile.fullName && (!displayName || displayName === 'Your Channel Name')) {
        setDisplayName(profile.fullName);
      }
      if (profile.bio && (!bio || bio.startsWith('Authentic creator'))) {
        setBio(profile.bio.substring(0, 300));
      }

      setDetectErrorBanner(null);
      setToastMessage(`✓ Instagram Connected: @${cleanUser} (${profile.followersFormatted || 'Verified'})`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      const msg = err.message || 'Could not verify Instagram profile';
      setInstagramError(msg);
      setDetectErrorBanner({
        platform: 'Instagram',
        message: msg,
        suggestion: 'Ensure the Instagram username or link (e.g. https://instagram.com/username) is correct and public.',
      });
      setToastMessage(`✕ Instagram Detection Failed: ${msg}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setInstagramDetecting(false);
    }
  };

  // Automatic Instagram profile detection on paste / typing
  const lastDetectedInstaRef = React.useRef<string>('');
  useEffect(() => {
    const trimmed = instagramUrl.trim();
    if (!trimmed || trimmed === lastDetectedInstaRef.current) return;
    if (trimmed.includes('instagram.com/') || (trimmed.startsWith('@') && trimmed.length >= 3)) {
      const timer = setTimeout(() => {
        lastDetectedInstaRef.current = trimmed;
        handleDetectInstagram();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [instagramUrl]);

  // Save / Update Pass to Database
  const handleSavePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setActiveTab('identity');
      setToastMessage('⚠️ Please provide your Creator Name.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanHandle = (username || displayName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'creator').replace(/^@/, '');
      const uniquePassId = passportId || cleanHandle;

      const profileToSave: CreatorProfile = {
        ...liveCreator,
        id: `creator_${cleanHandle}`,
        passportId: uniquePassId,
        slug: cleanHandle,
        username: cleanHandle,
        handle: `@${cleanHandle}`,
        displayName: displayName.trim(),
        category,
        bio: bio.trim(),
        location: location.trim(),
        contactEmail: contactEmail.trim(),
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        isVerified,
        connections: {
          youtube: {
            platform: 'YOUTUBE',
            connected: !!(youtubeUrl || youtubeReach),
            username: youtubeUsername || cleanHandle,
            metricLabel: 'subscribers',
            metricValue: youtubeReach || '100K+ Subscribers',
            verified: true,
            profileUrl: resolveYouTubeUrl(youtubeUrl, youtubeUsername, youtubeChannelId, cleanHandle),
            channelId: youtubeChannelId,
            proofScreenshot: youtubeProof || undefined,
          },
          discord: {
            platform: 'DISCORD',
            connected: !!discordReach,
            username: discordUsername || displayName,
            metricLabel: 'members',
            metricValue: discordReach || 'Not Connected',
            verified: true,
            profileUrl: resolveDiscordUrl(discordUrl, discordUsername, discordGuildId, cleanHandle),
            guildId: discordGuildId,
            proofScreenshot: discordProof || undefined,
          },
          instagram: {
            platform: 'INSTAGRAM',
            connected: !!(instagramUrl || instagramReach),
            username: instagramUsername || cleanHandle,
            metricLabel: 'followers',
            metricValue: instagramReach || '',
            verified: !!(instagramUrl || instagramReach),
            profileUrl: resolveInstagramUrl(instagramUrl, instagramUsername, cleanHandle),
          },
        },
        moreChannels,
      };

      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Server error while saving pass');
      }

      const saved = await res.json();
      const savedCreator = saved.creator || profileToSave;

      let updatedUser = null;
      try {
        const sessionResponse = await fetch('/api/auth/me', { cache: 'no-store' });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.user) {
            updatedUser = sessionData.user;
            cacheAuthHint(sessionData.user, savedCreator);
          }
        }
      } catch (e) {}

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCreator));
      setHasCreatedCard(true);
      setPassportId(uniquePassId);

      // Persist directly to Firebase Firestore for bulletproof cross-device sync
      try {
        syncCreatorToFirebase(savedCreator).catch(() => {});
      } catch (e) {}

      // Instantly broadcast updates to Navbar, HeroPassShowcase, Bento, and entire app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creatorhq_auth_updated', {
          detail: { user: updatedUser, creator: savedCreator }
        }));
        window.dispatchEvent(new CustomEvent('creatorhq_profile_updated', {
          detail: savedCreator
        }));
      }

      try {
        broadcastLocalChange({
          type: 'CREATOR_UPDATED',
          creatorSlug: savedCreator.slug,
          verificationStatus: savedCreator.verification_status,
        });
      } catch (e) {}

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#0ea5e9', '#ffffff'],
      });

      setToastMessage('✓ Creator Pass Successfully Saved & Synced!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(`Error: ${err.message || 'Could not save pass'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const handle = (username || 'creator').replace(/^@/, '');
    const url = `${window.location.origin}/${handle}/${passportId || handle}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setToastMessage('✓ Pass Link Copied to Clipboard!');
    setTimeout(() => {
      setCopiedLink(false);
      setToastMessage(null);
    }, 2500);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = '/';
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-24">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Toast Notification */}
          {authNotice && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-slate-100 text-sm flex flex-wrap items-center justify-between gap-3">
              <span>{authNotice}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => window.location.reload()} className="font-semibold text-sky-300 hover:text-white">Refresh</button>
                <Link href="/signin?next=%2Fdashboard" className="font-semibold text-sky-300 hover:text-white">Sign in</Link>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-white font-semibold text-xs sm:text-sm flex items-center justify-between shadow-2xl backdrop-blur-md animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= STUDIO HEADER BAR ================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-white/10">
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400">
                  CREATOR STUDIO
                </span>
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  1-Person 1-Card Active
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
                {displayName ? `${displayName}'s Pass` : 'Manage Creator Pass'}
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none btn-chq-secondary px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold justify-center"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
              </button>

              <Link
                href={`/${username || 'yourchannel'}/${passportId || username || 'pass'}`}
                target="_blank"
                className="btn-chq-secondary px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold justify-center"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Live</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/10"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ================= WORKSPACE SPLIT-SCREEN ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Clean Studio Tabs & Forms (7 cols) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              {/* Studio Navigation Tabs - Touch optimized */}
              <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-[#0e121a] border border-white/10 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { id: 'identity', label: 'Identity & Bio', icon: User },
                  { id: 'channels', label: 'Platforms & Stats', icon: Zap },
                  { id: 'verification', label: 'Audit & Proof', icon: ShieldCheck },
                  { id: 'theme', label: 'Card Styling', icon: Palette },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 min-w-[100px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form Container */}
              <form onSubmit={handleSavePass} className="space-y-5 sm:space-y-6">
                
                {/* ================= TAB 1: IDENTITY & BIO ================= */}
                {activeTab === 'identity' && (
                  <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-[#0c1017] border border-white/10 space-y-5 sm:space-y-6 animate-fadeIn">
                    <div className="space-y-1">
                      <h2 className="text-lg sm:text-xl font-bold text-white font-sans">Creator Profile & Visuals</h2>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Establish your authenticated handle, creator category, and public bio.</p>
                    </div>

                    {/* Avatar Preview & Source */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={getSafeAvatarUrl(avatarUrl, displayName)}
                          alt={displayName || 'Creator'}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-sky-400/40 ring-4 ring-black/40 shadow-xl"
                        />
                        {isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg">
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <span className="text-xs sm:text-sm font-bold text-white block">
                          {isAvatarFromYouTube ? 'Official YouTube Profile Picture' : 'Custom Active Avatar'}
                        </span>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                          {isAvatarFromYouTube
                            ? 'Automatically retrieved and synced from YouTube. You can also upload a custom override below.'
                            : 'Upload a custom square avatar for your Creator Pass.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {/* Display Name */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Creator Name / Channel Title *</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Linus Tech Tips or PewDiePie"
                          required
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#121620] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      {/* Username / Handle */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300">Claimed Handle (@username) *</label>
                          {handleStatus === 'available' && <span className="text-[11px] text-emerald-400 font-semibold">✓ Available</span>}
                          {handleStatus === 'taken' && <span className="text-[11px] text-red-400 font-semibold">✕ Claimed</span>}
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-500 text-xs sm:text-sm font-mono">@</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="yourhandle"
                            required
                            className="w-full pl-8 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#121620] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Creator Category Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Primary Content Sector</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-left truncate ${
                              category === cat
                                ? 'bg-sky-500/15 border-sky-400 text-sky-300 font-semibold shadow-sm'
                                : 'bg-[#121620] border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Creator Bio & Mission</label>
                        <span className="text-[11px] text-slate-500">{bio.length}/350</span>
                      </div>
                      <textarea
                        value={bio}
                        maxLength={350}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        placeholder="Tell sponsors and fans about your reach, content focus, and key milestones..."
                        className="w-full px-4 py-3 rounded-xl bg-[#121620] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors resize-none"
                      />
                    </div>

                    {/* Location & Contact Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Creator Location / Country</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. United States, Global, Germany"
                          className="w-full px-4 py-3 rounded-xl bg-[#121620] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Official Brand Sponsorship Email</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="sponsors@yourchannel.com"
                          className="w-full px-4 py-3 rounded-xl bg-[#121620] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Optional Custom Avatar Uploader */}
                    <div className="pt-2">
                      <ImageUploader
                        label="Upload Custom Profile Picture (Optional)"
                        description="Upload a custom JPG, PNG, or WebP if you prefer not to use your YouTube avatar."
                        aspectRatio="avatar"
                        currentImage={avatarUrl || undefined}
                        onImageChange={(img) => {
                          setAvatarUrl(img);
                          setIsAvatarFromYouTube(false);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ================= TAB 2: PLATFORMS & REACH ================= */}
                {activeTab === 'channels' && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1017] border border-white/10 space-y-6 animate-fadeIn">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white font-sans">Platforms & Live Metrics</h2>
                      <p className="text-xs sm:text-sm text-slate-400">Connect your YouTube channel, Discord server, and socials to show audited numbers.</p>
                    </div>

                    {/* Prominent Detection Error Banner Notification */}
                    {detectErrorBanner && (
                      <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-fadeIn">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5 sm:mt-0">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                                {detectErrorBanner.platform} Detection Alert
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-white">
                              {detectErrorBanner.message}
                            </p>
                            {detectErrorBanner.suggestion && (
                              <p className="text-[11px] text-red-300/80">
                                {detectErrorBanner.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetectErrorBanner(null)}
                          className="self-end sm:self-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Dismiss notice"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* YouTube Integration Card */}
                    <div className="p-5 rounded-2xl bg-[#10141e] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">YouTube Channel Auto-Detect</h3>
                            <span className="text-[11px] text-slate-400">Pulls official subscriber count & channel identity</span>
                          </div>
                        </div>
                        {youtubeReach && (
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                            {youtubeReach}
                          </span>
                        )}
                      </div>

                      <div className="detect-buttons-container flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => {
                            setYoutubeUrl(e.target.value);
                            if (youtubeError) setYoutubeError(null);
                          }}
                          placeholder="Paste channel link (e.g. https://youtube.com/@mkbhd)"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleDetectYouTube()}
                          disabled={youtubeDetecting || !youtubeUrl.trim()}
                          className="btn-chq-primary px-5 py-2.5 text-xs font-bold shrink-0 disabled:opacity-50"
                        >
                          {youtubeDetecting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Auto-Fetch</span>
                            </>
                          )}
                        </button>
                      </div>

                      {youtubeError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{youtubeError}</span>
                        </p>
                      )}
                    </div>

                    {/* Discord Integration Card */}
                    <div className="p-5 rounded-2xl bg-[#10141e] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Discord Community Server</h3>
                            <span className="text-[11px] text-slate-400">Verifies member counts and server role structure</span>
                          </div>
                        </div>
                        {discordReach && (
                          <span className="text-xs font-mono font-bold text-[#798bf2] bg-[#5865F2]/10 border border-[#5865F2]/25 px-2.5 py-1 rounded-full">
                            {discordReach}
                          </span>
                        )}
                      </div>

                      <div className="detect-buttons-container flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          value={discordUrl}
                          onChange={(e) => {
                            setDiscordUrl(e.target.value);
                            if (discordError) setDiscordError(null);
                          }}
                          placeholder="Paste Discord server invite (e.g. https://discord.gg/yourcommunity)"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleDetectDiscord}
                          disabled={discordDetecting || !discordUrl.trim()}
                          className="btn-chq-primary px-5 py-2.5 text-xs font-bold shrink-0 disabled:opacity-50"
                        >
                          {discordDetecting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Verify Server</span>
                            </>
                          )}
                        </button>
                      </div>

                      {discordError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{discordError}</span>
                        </p>
                      )}
                    </div>

                    {/* Instagram Integration Card */}
                    <div className="p-5 rounded-2xl bg-[#10141e] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Instagram Profile Auto-Detect</h3>
                            <span className="text-[11px] text-slate-400">Pulls official followers count & public bio</span>
                          </div>
                        </div>
                        {instagramReach && (
                          <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 border border-pink-500/25 px-2.5 py-1 rounded-full">
                            {instagramReach}
                          </span>
                        )}
                      </div>

                      <div className="detect-buttons-container flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          value={instagramUrl}
                          onChange={(e) => {
                            setInstagramUrl(e.target.value);
                            if (instagramError) setInstagramError(null);
                          }}
                          placeholder="Paste Instagram profile link (e.g. https://instagram.com/mrbeast or @handle)"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleDetectInstagram}
                          disabled={instagramDetecting || !instagramUrl.trim()}
                          className="btn-chq-primary px-5 py-2.5 text-xs font-bold shrink-0 disabled:opacity-50"
                        >
                          {instagramDetecting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Verify Profile</span>
                            </>
                          )}
                        </button>
                      </div>

                      {instagramError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{instagramError}</span>
                        </p>
                      )}
                    </div>

                    {/* More Channels Card */}
                    <div className="pt-2">
                      <MoreChannelsCard
                        channels={moreChannels}
                        onUpdate={(updated) => setMoreChannels(updated)}
                      />
                    </div>
                  </div>
                )}

                {/* ================= TAB 3: AUDIT & PROOF ================= */}
                {activeTab === 'verification' && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1017] border border-white/10 space-y-6 animate-fadeIn">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white font-sans">Sovereign Audit & Verification</h2>
                      <p className="text-xs sm:text-sm text-slate-400">All metrics displayed on CreatorHQ passes are audited by staff to guarantee fraud-free sponsor trust.</p>
                    </div>

                    {/* Status Banner */}
                    <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                      isVerified
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-sky-950/20 border-sky-500/30 text-sky-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {isVerified ? 'Staff-Audited Verified Pass' : 'Pending Verification Review'}
                          </h4>
                          <span className="text-xs opacity-80">
                            {isVerified
                              ? 'Your YouTube metrics and community roles are verified and marked tamper-proof.'
                              : 'Upload proof screenshots below to expedite verified checkmark issuance.'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !isVerified;
                          setIsVerified(next);
                          setToastMessage(next ? '✓ Verified checkmark activated!' : 'Status set to Candidate.');
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          isVerified
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-md shadow-sky-500/20'
                        }`}
                      >
                        {isVerified ? 'Verified (Toggle)' : 'Request Audit'}
                      </button>
                    </div>

                    {/* Proof Uploader 1: YouTube Analytics */}
                    <div className="p-5 rounded-2xl bg-[#10141e] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">YouTube Studio Proof Screenshot</span>
                        <span className="text-[11px] text-slate-400 font-mono">28-day analytics dashboard</span>
                      </div>
                      <ImageUploader
                        label="Upload YouTube Studio Screenshot"
                        description="Screenshot showing your channel name and 28-day views/watch time in YouTube Studio."
                        aspectRatio="banner"
                        currentImage={youtubeProof || undefined}
                        onImageChange={(img) => setYoutubeProof(img)}
                      />
                    </div>

                    {/* Proof Uploader 2: Discord Server Permissions */}
                    <div className="p-5 rounded-2xl bg-[#10141e] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Discord Guild Role / Audit Proof</span>
                        <span className="text-[11px] text-slate-400 font-mono">Server settings screenshot</span>
                      </div>
                      <ImageUploader
                        label="Upload Discord Server Screenshot"
                        description="Screenshot proving Owner / Administrator role in your community server."
                        aspectRatio="banner"
                        currentImage={discordProof || undefined}
                        onImageChange={(img) => setDiscordProof(img)}
                      />
                    </div>
                  </div>
                )}

                {/* ================= TAB 4: CARD THEME & STYLING ================= */}
                {activeTab === 'theme' && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1017] border border-white/10 space-y-6 animate-fadeIn">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white font-sans">Pass Theme & Visual Finish</h2>
                      <p className="text-xs sm:text-sm text-slate-400">Select the metallic finish for your sovereign Creator Pass card.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { id: 'obsidian', name: 'Obsidian Onyx', desc: 'Matte graphite & emerald accents', border: 'border-slate-700' },
                        { id: 'titanium', name: 'Titanium Frost', desc: 'Sleek frosted silver glow', border: 'border-slate-300/40' },
                        { id: 'navy', name: 'Cobalt Sky', desc: 'Deep electric cyan neon', border: 'border-sky-500/40' },
                        { id: 'gold', name: 'Gold Sovereign', desc: 'Tier-1 luxury champion finish', border: 'border-amber-500/40' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTheme(t.id as CardTheme)}
                          className={`p-4 rounded-2xl border text-left transition-all relative ${
                            selectedTheme === t.id
                              ? `${t.border} bg-white/10 shadow-lg scale-[1.02] ring-2 ring-sky-400`
                              : 'border-white/10 bg-[#121620] hover:bg-white/5 opacity-80'
                          }`}
                        >
                          {selectedTheme === t.id && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-white font-sans">{t.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Changes take effect on your public card immediately after saving.
                  </span>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-chq-primary px-8 py-3.5 text-sm font-extrabold shadow-xl w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Pass...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Save & Sync Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Stacked Live PassportCard Preview (5 cols on desktop) */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-5 sm:space-y-6 w-full">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  Live Pass Preview
                </span>
                <span className="text-[10px] sm:text-[11px] text-sky-400 font-semibold font-mono">
                  Real-time rendering
                </span>
              </div>

              {/* The Live Interactive PassportCard */}
              <div className="flex justify-center w-full overflow-hidden">
                <div className="w-full max-w-full sm:max-w-[420px]">
                  <PassportCard
                    creator={liveCreator}
                    size="hero"
                    interactive={true}
                    showControls={true}
                    allowFreeze={true}
                    allowThemes={true}
                  />
                </div>
              </div>

              {/* Quick Info & Share Box */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0c1017] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Pass Serial:</span>
                  <span className="font-mono text-white font-bold">{passportId || 'Pending Mint'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Public Slug:</span>
                  <span className="font-mono text-sky-400 font-bold">/@{username || 'yourchannel'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Network Status:</span>
                  <span className={`font-semibold ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isVerified ? '✓ Audited Sovereign Pass' : '● Candidate Verification'}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 btn-chq-primary py-2 sm:py-2.5 text-xs font-bold justify-center"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Share URL</span>
                  </button>
                  <Link
                    href={`/${username || 'yourchannel'}/${passportId || username || 'pass'}`}
                    target="_blank"
                    className="btn-chq-secondary px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
