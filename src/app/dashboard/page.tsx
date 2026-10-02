'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PassportCard, { CardTheme } from '@/components/PassportCard';
import ImageUploader from '@/components/ImageUploader';
import ScreenshotVerificationModal from '@/components/ScreenshotVerificationModal';
import MoreChannelsCard from '@/components/MoreChannelsCard';
import { CreatorProfile, ChannelItem } from '@/lib/types';
import { resolveYouTubeUrl, resolveDiscordUrl, resolveInstagramUrl, resolveXUrl, getSafeAvatarUrl } from '@/lib/urls';
import {
  Check,
  Copy,
  ExternalLink,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  Share2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Eye,
  Sliders,
  Award,
  Trash2,
  Clock,
  Zap,
  CheckCheck,
  Globe,
  LogOut,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'creatorhq_user_card';

export interface YouTubePublicData {
  avatarUrl: string;
  title: string;
  handle: string;
  subscriberCountFormatted: string;
  channelUrl: string;
  channelId: string;
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasCreatedCard, setHasCreatedCard] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [verificationModalType, setVerificationModalType] = useState<'YOUTUBE' | 'DISCORD' | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form / Card State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('Gaming Creator');
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
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [copiedChannelId, setCopiedChannelId] = useState(false);

  // Discord State
  const [discordUrl, setDiscordUrl] = useState('');
  const [discordGuildId, setDiscordGuildId] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordReach, setDiscordReach] = useState('');
  const [discordProof, setDiscordProof] = useState<string | null>(null);
  const [discordDetecting, setDiscordDetecting] = useState(false);
  const [discordError, setDiscordError] = useState<string | null>(null);

  // Instagram State
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramReach, setInstagramReach] = useState('');
  const [instagramDetecting, setInstagramDetecting] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  // X / Twitter State
  const [xUrl, setXUrl] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [xReach, setXReach] = useState('');
  const [xDetecting, setXDetecting] = useState(false);
  const [xError, setXError] = useState<string | null>(null);

  const [moreChannels, setMoreChannels] = useState<ChannelItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('obsidian');
  const [isVerified, setIsVerified] = useState(false);
  const [passportId, setPassportId] = useState('');

  const [studioTab, setStudioTab] = useState<'editor' | 'showcase'>('editor');

  // Handle Availability Real-Time Check
  const [handleCheckStatus, setHandleCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [handleCheckMessage, setHandleCheckMessage] = useState<string>('');

  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 2) {
      setHandleCheckStatus('idle');
      setHandleCheckMessage('');
      return;
    }

    setHandleCheckStatus('checking');
    const timer = setTimeout(() => {
      const ytParam = youtubeChannelId || youtubeUrl || '';
      fetch(`/api/creators?check=${encodeURIComponent(clean)}&yt=${encodeURIComponent(ytParam)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.claimed) {
            setHandleCheckStatus('taken');
            setHandleCheckMessage(data.message || 'Already taken by another creator');
          } else {
            setHandleCheckStatus('available');
            setHandleCheckMessage('✓ Available');
          }
        })
        .catch(() => {
          setHandleCheckStatus('idle');
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [username, youtubeChannelId, youtubeUrl]);

  // One Person, One Card per IP State
  const [detectedIp, setDetectedIp] = useState<string>('');
  const [ipExistingCard, setIpExistingCard] = useState<any | null>(null);
  const [isIpChecking, setIsIpChecking] = useState<boolean>(true);

  const handleLoadCardFromIp = async (card: any) => {
    if (!card) return;
    try {
      const res = await fetch(`/api/creators?q=${encodeURIComponent(card.username || card.slug)}`);
      const data = await res.json();
      const found = data.creators?.find(
        (c: any) =>
          c.username?.toLowerCase() === (card.username || '').toLowerCase() ||
          c.slug?.toLowerCase() === (card.slug || '').toLowerCase()
      );
      if (found) {
        applyCreatorToState(found);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        setHasCreatedCard(true);
        setToastMessage(`✓ Loaded your registered Creator Pass (@${found.username})`);
      } else {
        applyCreatorToState(card);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
        setHasCreatedCard(true);
      }
    } catch (e) {
      applyCreatorToState(card);
      setHasCreatedCard(true);
    }
  };

  const applyCreatorToState = (active: CreatorProfile) => {
    setHasCreatedCard(true);
    if (active.passportId) setPassportId(active.passportId);
    setDisplayName(active.displayName || '');
    setUsername(active.username || '');
    setCategory(active.category || 'Gaming Creator');
    setBio(active.bio || '');
    setLocation(active.location || active.country || '');
    setContactEmail(active.contactEmail || '');
    setAvatarUrl(active.avatarUrl || null);
    setIsVerified(active.isVerified === true);

    if (active.connections?.youtube) {
      const ytClean = resolveYouTubeUrl(
        active.connections.youtube.profileUrl,
        active.connections.youtube.username,
        active.connections.youtube.channelId,
        active.username
      );
      const cleanUser =
        active.connections.youtube.username && active.connections.youtube.username !== 'channel'
          ? active.connections.youtube.username
          : active.username || '';
      setYoutubeUsername(cleanUser);
      setYoutubeReach(active.connections.youtube.metricValue || '');
      setYoutubeUrl(ytClean);
      setYoutubeChannelId(active.connections.youtube.channelId || '');
      if (active.connections.youtube.proofScreenshot) {
        setYoutubeProof(active.connections.youtube.proofScreenshot);
      }
      if (active.avatarUrl) {
        setIsAvatarFromYouTube(true);
        setYoutubeFetchedData({
          avatarUrl: active.avatarUrl,
          title: active.displayName || cleanUser,
          handle: `@${cleanUser}`,
          subscriberCountFormatted: active.connections.youtube.metricValue || '',
          channelUrl: ytClean,
          channelId: active.connections.youtube.channelId || '',
        });
      }
    }

    if (active.connections?.discord) {
      const dcClean = resolveDiscordUrl(
        active.connections.discord.profileUrl,
        active.connections.discord.guildName || active.connections.discord.username,
        active.connections.discord.guildId,
        active.username
      );
      setDiscordUsername(
        active.connections.discord.username && active.connections.discord.username !== 'community'
          ? active.connections.discord.username
          : active.displayName || ''
      );
      setDiscordReach(active.connections.discord.metricValue || '');
      setDiscordUrl(dcClean);
      setDiscordGuildId(active.connections.discord.guildId || '');
      if (active.connections.discord.proofScreenshot) {
        setDiscordProof(active.connections.discord.proofScreenshot);
      }
    }

    if (active.connections?.instagram) {
      setInstagramUsername(active.connections.instagram.username || '');
      setInstagramReach(active.connections.instagram.metricValue || '');
      setInstagramUrl(
        resolveInstagramUrl(
          active.connections.instagram.profileUrl,
          active.connections.instagram.username,
          active.username
        )
      );
    }

    if (active.connections?.x) {
      setXUsername(active.connections.x.username || '');
      setXReach(active.connections.x.metricValue || '');
      setXUrl(
        resolveXUrl(
          active.connections.x.profileUrl,
          active.connections.x.username,
          active.username
        )
      );
    }

    if (active.moreChannels) {
      setMoreChannels(active.moreChannels);
    }
  };

  // Hydrate from localStorage or database on client mount - NEVER delete on refresh!
  useEffect(() => {
    setIsMounted(true);
    try {
      const isResetUrl = typeof window !== 'undefined' && (
        window.location.search.includes('reset') ||
        window.location.search.includes('clear') ||
        window.location.search.includes('new')
      );

      if (isResetUrl) {
        localStorage.removeItem(STORAGE_KEY);
        setHasCreatedCard(false);
        setIsEditing(false);
        setIsVerified(false);
        setDisplayName('');
        setUsername('');
        setAvatarUrl(null);
        setYoutubeUrl('');
        setYoutubeReach('');
        setYoutubeChannelId('');
        setYoutubeUsername('');
        setYoutubeProof(null);
        setYoutubeFetchedData(null);
        setIsAvatarFromYouTube(false);
        setShowManualUpload(false);
        setDiscordUrl('');
        setDiscordReach('');
        setDiscordGuildId('');
        setDiscordUsername('');
        setDiscordProof(null);
        setInstagramUrl('');
        setInstagramReach('');
        setInstagramUsername('');
        setXUrl('');
        setXReach('');
        setXUsername('');
        fetchNextSequentialId();
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed: CreatorProfile | null = null;
        try {
          parsed = JSON.parse(saved);
        } catch (e) {
          parsed = null;
        }

        if (parsed && (parsed.displayName || parsed.username)) {
          // Immediately apply so creator sees their pass and studio instantly!
          applyCreatorToState(parsed);

          // Verify with server database in background to keep both in sync
          fetch('/api/creators')
            .then((res) => res.json())
            .then((data) => {
              const list: CreatorProfile[] = data.creators || [];
              const inDb = list.find(
                (c) =>
                  c.passportId?.toUpperCase() === parsed!.passportId?.toUpperCase() ||
                  c.username?.toLowerCase() === parsed!.username?.toLowerCase()
              );

              if (inDb) {
                applyCreatorToState(inDb);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(inDb));
              } else {
                // If missing in DB, sync it to server DB so it's permanently stored
                fetch('/api/creators', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(parsed),
                }).catch(() => {});
              }
            })
            .catch(() => {});
          return;
        }
      }

      // Detect client IP and check for any registered card under 1-Person 1-Card policy
      const detectIp = async () => {
        try {
          setIsIpChecking(true);
          const res = await fetch('/api/ip');
          const data = await res.json();
          if (data.ip) {
            let clientIp = data.ip;
            if (clientIp === '127.0.0.1' || clientIp === '::1') {
              try {
                const ext = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) });
                const extData = await ext.json();
                if (extData.ip) clientIp = extData.ip;
              } catch (e) {}
            }
            setDetectedIp(clientIp);
            if (data.hasExistingCard && data.existingCreator) {
              setIpExistingCard(data.existingCreator);
            }
          }
        } catch (err) {
          console.warn('IP detect notice:', err);
        } finally {
          setIsIpChecking(false);
        }
      };
      detectIp();

      // For visitors who have not created an account on this device yet, stay in creation onboarding mode (do not self-create)
      fetchNextSequentialId();
    } catch (err) {
      console.error('Error loading saved pass:', err);
    }
  }, []);

  // Compute live CreatorProfile for PassportCard rendering
  const liveCreator: CreatorProfile = {
    id: hasCreatedCard ? (passportId ? `creator_${passportId}` : 'creator_pass') : 'candidate_demo',
    passportId: passportId || (hasCreatedCard ? (username || 'creator') : 'CHQ-000184'),
    slug: username || (hasCreatedCard ? 'creator' : 'yourchannel'),
    handle: `@${username || (hasCreatedCard ? 'creator' : 'yourchannel')}`,
    verification_status: hasCreatedCard ? (isVerified ? 'VERIFIED' : 'PENDING') : 'PENDING',
    username: username || (hasCreatedCard ? 'creator' : 'yourchannel'),
    displayName: displayName || (hasCreatedCard ? 'Creator' : 'Your Channel Name'),
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    category: category || 'YouTube Creator',
    country: location || 'Global',
    location: location || 'Global',
    bio: bio || (hasCreatedCard ? 'Creator on CreatorHQ Network.' : 'Official YouTube creator & community founder.'),
    isVerified: hasCreatedCard ? isVerified : false,
    isFounding: true,
    tierName: isVerified ? 'Verified Member Tier I' : 'Candidate Member',
    profileCompletion: 95,
    contactEmail: contactEmail || 'creator@creatorhq.fun',
    issuedAt: '2026-09-30',
    lastVerifiedAt: '2026-09-30',
    digitalSignature: '0x8f9b2a71d4e6c0b938501e7492cfa7812be4091a',
    isSuspended: false,
    connections: {
      youtube: {
        platform: 'YOUTUBE',
        connected: hasCreatedCard ? !!(youtubeReach || youtubeUrl) : true,
        username: (youtubeUsername && youtubeUsername !== 'channel') ? youtubeUsername : (username || 'yourchannel'),
        metricLabel: 'subscribers',
        metricValue: youtubeReach || (hasCreatedCard ? (youtubeUrl ? 'Auto-Detecting...' : '') : '125K Subscribers'),
        verified: true,
        profileUrl: resolveYouTubeUrl(youtubeUrl, youtubeUsername, youtubeChannelId, username || 'yourchannel'),
        channelId: youtubeChannelId || 'UC_demo_channel_id',
        rawCount: 125000,
      },
      discord: {
        platform: 'DISCORD',
        connected: hasCreatedCard ? !!(discordReach || discordUrl) : true,
        username: (discordUsername && discordUsername !== 'community') ? discordUsername : (displayName || 'Community'),
        metricLabel: 'members',
        metricValue: discordReach || (hasCreatedCard ? (discordUrl ? 'Auto-Detecting...' : '') : '14.2K Members'),
        verified: true,
        profileUrl: resolveDiscordUrl(discordUrl, discordUsername, discordGuildId, username || 'yourchannel'),
        guildId: discordGuildId,
      },
      instagram: {
        platform: 'INSTAGRAM',
        connected: hasCreatedCard ? !!(instagramReach || instagramUrl || instagramUsername) : true,
        username: (instagramUsername && instagramUsername !== 'creator') ? instagramUsername : (username || 'yourchannel'),
        metricLabel: 'followers',
        metricValue: instagramReach || (hasCreatedCard ? (instagramUrl ? 'Auto-Detecting...' : '') : '48.6K Followers'),
        verified: true,
        profileUrl: resolveInstagramUrl(instagramUrl, instagramUsername, username || 'yourchannel'),
      },
      x: {
        platform: 'X',
        connected: hasCreatedCard ? !!(xReach || xUrl || xUsername) : true,
        username: (xUsername && xUsername !== 'creator') ? xUsername : (username || 'yourchannel'),
        metricLabel: 'followers',
        metricValue: xReach || (hasCreatedCard ? (xUrl ? 'Auto-Detecting...' : '') : '29.3K Followers'),
        verified: true,
        profileUrl: resolveXUrl(xUrl, xUsername, username || 'yourchannel'),
      },
    },
    moreChannels: moreChannels || [],
    skills: ['Content Creation', 'Livestreaming', 'Brand Partnerships', 'Video Production'],
    achievements: [
      {
        id: 'ach_founding',
        slug: 'founding-creator',
        name: 'Founding Member',
        description: 'Verified creator on CreatorHQ Talent Network.',
        badgeIcon: 'shield-check',
        unlockedAt: '2026-09-30',
      },
      {
        id: 'ach_verified',
        slug: 'verified-creator',
        name: 'Dual Platform Verified',
        description: 'Confirmed audience across video and community platforms.',
        badgeIcon: 'badge-check',
        unlockedAt: '2026-09-30',
      },
    ],
    collaborations: [],
    portfolio: [],
  };

  const handleDetectYouTube = async (urlInput?: string): Promise<{ reach: string; handle: string; channelId: string; url: string; avatarUrl: string; title: string } | null> => {
    const targetUrl = urlInput || youtubeUrl;
    if (!targetUrl.trim()) return null;

    setYoutubeDetecting(true);
    setYoutubeError(null);

    try {
      const res = await fetch('/api/youtube/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim(), passportId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'YouTube channel not found');
      }

      const formattedUrl = resolveYouTubeUrl(data.channel.url, data.channel.handle, data.channel.channelId, username);
      const cleanHandle = data.channel.handle.replace(/^@/, '');

      setYoutubeChannelId(data.channel.channelId);
      setYoutubeUsername(cleanHandle);
      setYoutubeReach(data.channel.subscriberCountFormatted);
      setYoutubeUrl(formattedUrl);

      const safeAvatar = getSafeAvatarUrl(data.channel.avatarUrl, data.channel.title);

      // The profile picture on the card must automatically come from YouTube.
      // Do NOT make the creator upload their profile picture manually if YouTube data is available.
      if (data.channel.avatarUrl) {
        setAvatarUrl(safeAvatar);
        setIsAvatarFromYouTube(true);
      }

      // Automatically pre-fill channel name directly from official YouTube title
      if (data.channel.title) {
        setDisplayName(data.channel.title);
      }

      // Automatically pre-fill handle directly from official YouTube handle
      if (cleanHandle) {
        setUsername(cleanHandle.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      }

      // Automatically pre-fill bio/about if available and not custom written
      if (data.channel.description) {
        setBio(data.channel.description.substring(0, 350));
      }

      // Automatically fill category if not specified or generic
      if (!category || category === 'Gaming & Esports' || category === 'CREATOR') {
        setCategory('Tech & Content');
      }

      setYoutubeFetchedData({
        avatarUrl: safeAvatar,
        title: data.channel.title,
        handle: data.channel.handle.startsWith('@') ? data.channel.handle : `@${cleanHandle}`,
        subscriberCountFormatted: data.channel.subscriberCountFormatted,
        channelUrl: formattedUrl,
        channelId: data.channel.channelId,
      });

      setToastMessage(`✓ YouTube Auto-Fetched: ${data.channel.title} (Profile picture synced to pass)`);
      setTimeout(() => setToastMessage(null), 3500);

      return {
        reach: data.channel.subscriberCountFormatted,
        handle: cleanHandle,
        channelId: data.channel.channelId,
        url: formattedUrl,
        avatarUrl: data.channel.avatarUrl,
        title: data.channel.title,
      };
    } catch (err: any) {
      setYoutubeError(err.message || 'Invalid YouTube URL or channel not found');
      return null;
    } finally {
      setYoutubeDetecting(false);
    }
  };

  // Automatically fetch YouTube channel details whenever user types or pastes a channel URL/handle
  useEffect(() => {
    if (!youtubeUrl) return;
    const trimmed = youtubeUrl.trim();
    if (trimmed.length < 3) return;

    // Detect if valid target pattern
    const looksValid =
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be') ||
      trimmed.startsWith('@') ||
      trimmed.startsWith('UC') ||
      (trimmed.length >= 4 && !trimmed.includes(' '));

    if (!looksValid) return;

    const timer = setTimeout(() => {
      // Don't duplicate fetch if already loaded
      if (
        youtubeFetchedData &&
        (youtubeFetchedData.handle.toLowerCase() === trimmed.toLowerCase() ||
          youtubeFetchedData.channelUrl.toLowerCase() === trimmed.toLowerCase() ||
          youtubeUrl === youtubeFetchedData.channelUrl)
      ) {
        return;
      }
      handleDetectYouTube(trimmed);
    }, 650);

    return () => clearTimeout(timer);
  }, [youtubeUrl]);

  const handleDetectDiscord = async (urlInput?: string): Promise<{ reach: string; name: string; guildId: string; url: string } | null> => {
    const targetUrl = urlInput || discordUrl;
    if (!targetUrl.trim()) return null;

    setDiscordDetecting(true);
    setDiscordError(null);

    try {
      const res = await fetch('/api/discord/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteUrl: targetUrl.trim(), passportId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Discord server not found');
      }

      const formattedUrl = resolveDiscordUrl(data.server.inviteUrl, data.server.guildName, data.server.guildId, username);

      setDiscordGuildId(data.server.guildId);
      setDiscordUsername(data.server.guildName);
      setDiscordReach(data.server.memberCountFormatted);
      setDiscordUrl(formattedUrl);
      setToastMessage(`✓ Discord Detected: ${data.server.guildName} (${data.server.memberCountFormatted})`);
      setTimeout(() => setToastMessage(null), 3500);

      return {
        reach: data.server.memberCountFormatted,
        name: data.server.guildName,
        guildId: data.server.guildId,
        url: formattedUrl,
      };
    } catch (err: any) {
      setDiscordError(err.message || 'Invalid Discord invite or server not accessible');
      return null;
    } finally {
      setDiscordDetecting(false);
    }
  };

  const handleDetectInstagram = async (urlInput?: string): Promise<{ username: string; reach: string; url: string; avatarUrl: string } | null> => {
    const targetUrl = urlInput || instagramUrl;
    if (!targetUrl.trim()) return null;

    setInstagramDetecting(true);
    setInstagramError(null);

    try {
      const res = await fetch('/api/instagram/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim(), passportId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Instagram profile not found');
      }

      const p = data.profile;
      const cleanUser = p.username.replace(/^@/, '');
      const reachFormatted = p.compactFollowers?.includes('Followers') ? p.compactFollowers : `${p.compactFollowers || '0'} Followers`;

      setInstagramUsername(cleanUser);
      setInstagramReach(reachFormatted);
      setInstagramUrl(p.url);

      if (!avatarUrl && p.avatarUrl) {
        setAvatarUrl(p.avatarUrl);
      }

      setToastMessage(`✓ Instagram Connected: @${cleanUser} (${reachFormatted})`);
      setTimeout(() => setToastMessage(null), 3500);

      return {
        username: cleanUser,
        reach: reachFormatted,
        url: p.url,
        avatarUrl: p.avatarUrl,
      };
    } catch (err: any) {
      setInstagramError(err.message || 'Could not verify Instagram profile');
      return null;
    } finally {
      setInstagramDetecting(false);
    }
  };

  const handleDetectX = async (urlInput?: string): Promise<{ username: string; reach: string; url: string; avatarUrl: string } | null> => {
    const targetUrl = urlInput || xUrl;
    if (!targetUrl.trim()) return null;

    setXDetecting(true);
    setXError(null);

    try {
      const res = await fetch('/api/x/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim(), passportId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'X / Twitter profile not found');
      }

      const p = data.profile;
      const cleanUser = p.username.replace(/^@/, '');
      const reachFormatted = p.compactFollowers?.includes('Followers') ? p.compactFollowers : `${p.compactFollowers || '0'} Followers`;

      setXUsername(cleanUser);
      setXReach(reachFormatted);
      setXUrl(p.url);

      if (!avatarUrl && p.avatarUrl) {
        setAvatarUrl(p.avatarUrl);
      }

      setToastMessage(`✓ X / Twitter Connected: @${cleanUser} (${reachFormatted})`);
      setTimeout(() => setToastMessage(null), 3500);

      return {
        username: cleanUser,
        reach: reachFormatted,
        url: p.url,
        avatarUrl: p.avatarUrl,
      };
    } catch (err: any) {
      setXError(err.message || 'Could not verify X / Twitter profile');
      return null;
    } finally {
      setXDetecting(false);
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('Please enter your Creator Name.');
      return;
    }

    try {
      let detectedYtReach = youtubeReach;
      let detectedYtUser = youtubeUsername;
      let detectedYtId = youtubeChannelId;
      let detectedYtUrl = youtubeUrl;

      // Auto-detect YouTube if URL provided
      if (youtubeUrl.trim() && (!youtubeReach || youtubeReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectYouTube(youtubeUrl.trim());
        if (detected) {
          detectedYtReach = detected.reach;
          detectedYtUser = detected.handle;
          detectedYtId = detected.channelId;
          detectedYtUrl = detected.url;
        }
      }

      let detectedDcReach = discordReach;
      let detectedDcUser = discordUsername;
      let detectedDcId = discordGuildId;
      let detectedDcUrl = discordUrl;

      // Auto-detect Discord if URL provided
      if (discordUrl.trim() && (!discordReach || discordReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectDiscord(discordUrl.trim());
        if (detected) {
          detectedDcReach = detected.reach;
          detectedDcUser = detected.name;
          detectedDcId = detected.guildId;
          detectedDcUrl = detected.url;
        }
      }

      let detectedIgReach = instagramReach;
      let detectedIgUser = instagramUsername;
      let detectedIgUrl = instagramUrl;

      // Auto-detect Instagram if URL provided
      if (instagramUrl.trim() && (!instagramReach || instagramReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectInstagram(instagramUrl.trim());
        if (detected) {
          detectedIgReach = detected.reach;
          detectedIgUser = detected.username;
          detectedIgUrl = detected.url;
        }
      }

      let detectedXReach = xReach;
      let detectedXUser = xUsername;
      let detectedXUrl = xUrl;

      // Auto-detect X if URL provided
      if (xUrl.trim() && (!xReach || xReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectX(xUrl.trim());
        if (detected) {
          detectedXReach = detected.reach;
          detectedXUser = detected.username;
          detectedXUrl = detected.url;
        }
      }

      let mintedId = passportId;
      if (!mintedId) {
        try {
          const res = await fetch('/api/creators');
          const data = await res.json();
          let maxNum = 0;
          if (data.creators && Array.isArray(data.creators)) {
            data.creators.forEach((c: CreatorProfile) => {
              const match = c.passportId?.match(/^CP-(\d+)$/i);
              if (match) {
                const n = parseInt(match[1], 10);
                if (n > maxNum) maxNum = n;
              }
            });
          }
          mintedId = `CP-${String(maxNum + 1).padStart(6, '0')}`;
        } catch (e) {
          mintedId = `CP-${String(Math.floor(100000 + Math.random() * 900000))}`;
        }
      }
      setPassportId(mintedId);

      const cleanYt = resolveYouTubeUrl(detectedYtUrl, detectedYtUser, detectedYtId, username);
      const cleanDc = resolveDiscordUrl(detectedDcUrl, detectedDcUser, detectedDcId, username);
      const cleanIg = resolveInstagramUrl(detectedIgUrl, detectedIgUser, username);
      const cleanX = resolveXUrl(detectedXUrl, detectedXUser, username);

      const cleanHandle = (username || 'creator').toLowerCase().replace(/^@/, '').trim();
      const uniqueId = `creator_${cleanHandle}_${Date.now()}`;
      let localSecret = '';
      try {
        localSecret = localStorage.getItem(`creatorhq_secret_${cleanHandle}`) || '';
        if (!localSecret) {
          localSecret = 'sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem(`creatorhq_secret_${cleanHandle}`, localSecret);
        }
      } catch (e) {}

      const candidateCreator: CreatorProfile = {
        ...liveCreator,
        id: uniqueId,
        passportId: cleanHandle,
        slug: cleanHandle,
        username: cleanHandle,
        handle: `@${cleanHandle}`,
        creatorSecret: localSecret,
        digitalSignature: `0x${Array.from(cleanHandle + uniqueId).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(40, '0').slice(0, 40)}`,
        avatarUrl: avatarUrl || liveCreator.avatarUrl,
        isVerified: false,
        verification_status: 'PENDING',
        tierName: 'Candidate Member',
        connections: {
          ...liveCreator.connections,
          youtube: {
            platform: 'YOUTUBE' as const,
            connected: !!(detectedYtReach || detectedYtUrl),
            metricLabel: 'subscribers',
            metricValue: detectedYtReach || '',
            verified: true,
            profileUrl: cleanYt,
            username: (detectedYtUser && detectedYtUser !== 'channel') ? detectedYtUser : cleanHandle,
            channelId: detectedYtId,
            proofScreenshot: youtubeProof || undefined,
          },
          discord: {
            platform: 'DISCORD' as const,
            connected: !!(detectedDcReach || detectedDcUrl),
            metricLabel: 'members',
            metricValue: detectedDcReach || '',
            verified: true,
            profileUrl: cleanDc,
            username: (detectedDcUser && detectedDcUser !== 'community') ? detectedDcUser : (displayName || 'Community'),
            guildId: detectedDcId,
            proofScreenshot: discordProof || undefined,
          },
          instagram: {
            platform: 'INSTAGRAM' as const,
            connected: !!(detectedIgReach || detectedIgUrl || detectedIgUser),
            metricLabel: 'followers',
            metricValue: detectedIgReach || '',
            verified: true,
            profileUrl: cleanIg,
            username: (detectedIgUser || '').replace(/^@/, ''),
          },
          x: {
            platform: 'X' as const,
            connected: !!(detectedXReach || detectedXUrl || detectedXUser),
            metricLabel: 'followers',
            metricValue: detectedXReach || '',
            verified: true,
            profileUrl: cleanX,
            username: (detectedXUser || '').replace(/^@/, ''),
          },
        },
        registeredIp: detectedIp || undefined,
        clientIp: detectedIp || undefined,
      };

      // Persist to Server Database and Firebase
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateCreator),
      });
      const data = await res.json();

      if (!res.ok || res.status === 409 || data.error) {
        if (data.error === 'ALREADY_TAKEN') {
          setToastMessage(`⚠️ Already taken! ${data.message || 'Choose a unique handle or channel.'}`);
          alert(
            `⚠️ Already Taken!\n\n` +
            (data.message || 'This Creator ID, channel name, or YouTube channel is already claimed by another creator.\n\nAnother person cannot create or claim this card. Please choose a unique name.')
          );
          return;
        }
        if (data.error === 'ONE_CARD_PER_IP') {
          const existing = data.existingCard;
          if (existing) {
            setIpExistingCard(existing);
          }
          setToastMessage(`⚠️ 1 Person 1 Card Rule: An account already exists for your IP`);
          alert(
            `⚠️ 1 Person, 1 Card Policy Enforced:\n\n` +
            (data.message || 'A Creator Pass is already registered to your IP. Each creator is permitted only 1 card.')
          );
          return;
        }
        setToastMessage(`⚠️ Error: ${data.message || 'Failed to save card'}`);
        alert(`⚠️ Error: ${data.message || 'Failed to save card'}`);
        return;
      }

      if (data.creator) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.creator));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(candidateCreator));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('creatorhq_profile_updated'));
      }

      setHasCreatedCard(true);
      setIsEditing(false);
      setToastMessage('✓ Creator Pass minted & locked in database!');
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error saving pass:', err);
    }
  };

  const handleToggleStaffVerification = () => {
    const nextVerified = !isVerified;
    setIsVerified(nextVerified);
    const updated: CreatorProfile = {
      ...liveCreator,
      isVerified: nextVerified,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Sync verification status to Persistent Database & Firebase
      fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch((e) => console.warn('[API/DB] Verification sync notice:', e));

      if (nextVerified) {
        setToastMessage('Verified by Staff! Verification checkmark is now active on your card.');
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch (err) {}
      } else {
        setToastMessage('Status reverted to Pending Staff Review.');
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error updating verification:', err);
    }
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let detectedYtReach = youtubeReach;
      let detectedYtUser = youtubeUsername;
      let detectedYtId = youtubeChannelId;
      let detectedYtUrl = youtubeUrl;

      // Auto-detect YouTube if URL changed or reach missing
      if (youtubeUrl.trim() && (!youtubeReach || youtubeReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectYouTube(youtubeUrl.trim());
        if (detected) {
          detectedYtReach = detected.reach;
          detectedYtUser = detected.handle;
          detectedYtId = detected.channelId;
          detectedYtUrl = detected.url;
        }
      }

      let detectedDcReach = discordReach;
      let detectedDcUser = discordUsername;
      let detectedDcId = discordGuildId;
      let detectedDcUrl = discordUrl;

      // Auto-detect Discord if URL changed or reach missing
      if (discordUrl.trim() && (!discordReach || discordReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectDiscord(discordUrl.trim());
        if (detected) {
          detectedDcReach = detected.reach;
          detectedDcUser = detected.name;
          detectedDcId = detected.guildId;
          detectedDcUrl = detected.url;
        }
      }

      let detectedIgReach = instagramReach;
      let detectedIgUser = instagramUsername;
      let detectedIgUrl = instagramUrl;

      // Auto-detect Instagram if URL changed or reach missing
      if (instagramUrl.trim() && (!instagramReach || instagramReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectInstagram(instagramUrl.trim());
        if (detected) {
          detectedIgReach = detected.reach;
          detectedIgUser = detected.username;
          detectedIgUrl = detected.url;
        }
      }

      let detectedXReach = xReach;
      let detectedXUser = xUsername;
      let detectedXUrl = xUrl;

      // Auto-detect X if URL changed or reach missing
      if (xUrl.trim() && (!xReach || xReach.includes('Auto-Detecting'))) {
        const detected = await handleDetectX(xUrl.trim());
        if (detected) {
          detectedXReach = detected.reach;
          detectedXUser = detected.username;
          detectedXUrl = detected.url;
        }
      }

      const cleanYt = resolveYouTubeUrl(detectedYtUrl, detectedYtUser, detectedYtId, username);
      const cleanDc = resolveDiscordUrl(detectedDcUrl, detectedDcUser, detectedDcId, username);
      const cleanIg = resolveInstagramUrl(detectedIgUrl, detectedIgUser, username);
      const cleanX = resolveXUrl(detectedXUrl, detectedXUser, username);

      const candidateCreator: CreatorProfile = {
        ...liveCreator,
        avatarUrl: avatarUrl || liveCreator.avatarUrl,
        connections: {
          ...liveCreator.connections,
          youtube: {
            platform: 'YOUTUBE' as const,
            connected: !!(detectedYtReach || detectedYtUrl),
            metricLabel: 'subscribers',
            metricValue: detectedYtReach || '',
            verified: true,
            profileUrl: cleanYt,
            username: (detectedYtUser && detectedYtUser !== 'channel') ? detectedYtUser : (username || 'creator'),
            channelId: detectedYtId,
            proofScreenshot: youtubeProof || undefined,
          },
          discord: {
            platform: 'DISCORD' as const,
            connected: !!(detectedDcReach || detectedDcUrl),
            metricLabel: 'members',
            metricValue: detectedDcReach || '',
            verified: true,
            profileUrl: cleanDc,
            username: (detectedDcUser && detectedDcUser !== 'community') ? detectedDcUser : (displayName || 'Community'),
            guildId: detectedDcId,
            proofScreenshot: discordProof || undefined,
          },
          instagram: {
            platform: 'INSTAGRAM' as const,
            connected: !!(detectedIgReach || detectedIgUrl || detectedIgUser),
            metricLabel: 'followers',
            metricValue: detectedIgReach || '',
            verified: true,
            profileUrl: cleanIg,
            username: (detectedIgUser || '').replace(/^@/, ''),
          },
          x: {
            platform: 'X' as const,
            connected: !!(detectedXReach || detectedXUrl || detectedXUser),
            metricLabel: 'followers',
            metricValue: detectedXReach || '',
            verified: true,
            profileUrl: cleanX,
            username: (detectedXUser || '').replace(/^@/, ''),
          },
        },
      };

      // Persist edits to database
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateCreator),
      });
      const data = await res.json();

      if (!res.ok || res.status === 409 || data.error) {
        if (data.error === 'ALREADY_TAKEN') {
          setToastMessage(`⚠️ Already taken! ${data.message || 'Identity already claimed.'}`);
          alert(`⚠️ Already Taken!\n\n${data.message || 'This Creator ID, channel name, or YouTube channel is already claimed by another creator. Another person cannot claim this identity.'}`);
          return;
        }
        if (data.error === 'ONE_CARD_PER_IP') {
          setToastMessage(`⚠️ 1-Card Rule: An account already exists for your IP`);
          alert(`⚠️ 1 Person, 1 Card Policy Enforced:\n\n${data.message || 'Only one card per IP is allowed.'}`);
          return;
        }
        setToastMessage(`⚠️ Error: ${data.message || 'Failed to update pass'}`);
        alert(`⚠️ Error: ${data.message || 'Failed to update pass'}`);
        return;
      }

      if (data.creator) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.creator));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(candidateCreator));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('creatorhq_profile_updated'));
      }

      setIsEditing(false);
      setToastMessage('✓ Profile & Pass updated and locked in database!');
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch (err) {}
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error updating pass:', err);
    }
  };

  const fetchNextSequentialId = () => {
    fetch('/api/creators')
      .then((res) => res.json())
      .then((data) => {
        let maxNum = 0;
        if (data.creators && Array.isArray(data.creators)) {
          data.creators.forEach((c: CreatorProfile) => {
            const match = c.passportId?.match(/^CP-(\d+)$/i);
            if (match) {
              const n = parseInt(match[1], 10);
              if (n > maxNum) maxNum = n;
            }
          });
        }
        setPassportId(`CP-${String(maxNum + 1).padStart(6, '0')}`);
      })
      .catch(() => {
        setPassportId(`CP-${String(Math.floor(100000 + Math.random() * 900000))}`);
      });
  };

  const handleResetCard = () => {
    if (confirm('Create a new card? This will reset your currently saved Creator Pass.')) {
      localStorage.removeItem(STORAGE_KEY);
      setHasCreatedCard(false);
      setIsEditing(false);
      setIsVerified(false);
      setDisplayName('');
      setUsername('');
      setCategory('Gaming Creator');
      setBio('');
      setLocation('');
      setContactEmail('');
      setAvatarUrl(null);
      setYoutubeUrl('');
      setYoutubeReach('');
      setYoutubeChannelId('');
      setYoutubeUsername('');
      setYoutubeProof(null);
      setDiscordUrl('');
      setDiscordReach('');
      setDiscordGuildId('');
      setDiscordUsername('');
      setDiscordProof(null);
      setMoreChannels([]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('creatorhq_profile_updated'));
      }
      fetchNextSequentialId();
    }
  };

  const handleDeleteMyPass = async () => {
    if (!confirm('Are you sure you want to permanently delete your Creator Pass? This will erase your pass from the database, search directory, and public URL.')) {
      return;
    }

    try {
      if (liveCreator.passportId) {
        await fetch(`/api/creators?passportId=${encodeURIComponent(liveCreator.passportId)}`, {
          method: 'DELETE',
        });
      }
      localStorage.removeItem(STORAGE_KEY);
      setHasCreatedCard(false);
      setIsEditing(false);
      setIsVerified(false);
      setDisplayName('');
      setUsername('');
      setCategory('Gaming Creator');
      setBio('');
      setLocation('');
      setContactEmail('');
      setAvatarUrl(null);
      setYoutubeUrl('');
      setYoutubeReach('');
      setYoutubeChannelId('');
      setYoutubeUsername('');
      setYoutubeProof(null);
      setDiscordUrl('');
      setDiscordReach('');
      setDiscordGuildId('');
      setDiscordUsername('');
      setDiscordProof(null);
      setMoreChannels([]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('creatorhq_profile_updated'));
      }
      fetchNextSequentialId();
      setToastMessage('Your Creator Pass has been permanently deleted.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      alert('Error deleting pass. Check server connection.');
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUser = liveCreator.username || username || 'creator';
    const shareId = liveCreator.passportId || passportId || 'my-pass';
    navigator.clipboard.writeText(`${origin}/${shareUser}/${shareId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasCreatedCard(false);
    setIsEditing(false);
    setIsVerified(false);
    setDisplayName('');
    setUsername('');
    setCategory('Gaming Creator');
    setBio('');
    setLocation('');
    setContactEmail('');
    setAvatarUrl(null);
    setYoutubeUrl('');
    setYoutubeReach('');
    setYoutubeChannelId('');
    setYoutubeUsername('');
    setYoutubeProof(null);
    setYoutubeFetchedData(null);
    setIsAvatarFromYouTube(false);
    setShowManualUpload(false);
    setDiscordUrl('');
    setDiscordReach('');
    setDiscordGuildId('');
    setDiscordUsername('');
    setDiscordProof(null);
    setInstagramUrl('');
    setInstagramReach('');
    setInstagramUsername('');
    setXUrl('');
    setXReach('');
    setXUsername('');
    setMoreChannels([]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('creatorhq_profile_updated'));
    }
    fetchNextSequentialId();
    setToastMessage('Logged out. Displaying demo card preview.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePlatformVerified = (data: { platform: string; metric: string; account: string }) => {
    if (data.platform === 'YOUTUBE') {
      setYoutubeReach(data.metric);
      setYoutubeUsername(data.account);
    } else {
      setDiscordReach(data.metric);
      setDiscordUsername(data.account);
    }
    setToastMessage(`${data.platform} verified: ${data.metric}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 rounded-xl bg-sky-600 text-white font-semibold text-xs flex items-center justify-between shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-black/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================================================
              FLOW A: IF USER HAS NOT CREATED A CARD YET (ONBOARDING STUDIO)
              ========================================================================= */}
          {!hasCreatedCard ? (
            <div className="space-y-10">
              
              {/* Header */}
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-[#11141a] text-xs font-semibold text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CREATOR ONBOARDING</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                  Create Your Creator Pass.<br />
                  <span className="text-sky-400">
                    Your Official Verified Identity.
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Customize your personal pass with your real avatar, custom banner, verified handles, and stats. Preview updates live in real-time.
                </p>
              </div>

              {/* 2-Column Studio Grid: Left Form, Right Live Card Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                     {/* Left Form: 7 Columns */}
                <form onSubmit={handleCreatePass} className="lg:col-span-7 space-y-6">
                  
                  {/* ================= ONE PERSON, ONE CARD PER IP POLICY BADGE ================= */}
                  <div className="p-4 rounded-2xl bg-[#12151c] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block font-sans">One Person, One Card Policy</span>
                        <span className="text-slate-400">Strictly 1 verified Creator Pass permitted per person / IP address.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#161922] px-3.5 py-1.5 rounded-lg border border-white/10 self-start sm:self-auto font-sans">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-400 text-xs">Detected IP:</span>
                      <span className="font-mono text-white font-semibold text-xs">{detectedIp || 'Detecting...'}</span>
                    </div>
                  </div>

                  {/* If an account is already registered from this IP in database */}
                  {ipExistingCard && (
                    <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 space-y-3 animate-fadeIn shadow-md">
                      <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>Pass Already Registered to Your IP</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                        Under our <strong>One Person, One Card</strong> rule, your IP (<span className="font-mono text-white font-semibold">{detectedIp}</span>) is already registered to <strong className="text-white">{ipExistingCard.displayName}</strong> (<span className="text-sky-300 font-mono">@{ipExistingCard.username}</span>). You cannot create a second pass from this IP.
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleLoadCardFromIp(ipExistingCard)}
                          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Open Registered Pass (@{ipExistingCard.username})</span>
                        </button>
                        <Link
                          href={`/${ipExistingCard.username}/${ipExistingCard.passportId || ipExistingCard.slug || 'pass'}`}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Public Card</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* ================= FAST TRACK: 1-CLICK CREATOR DATA AUTO-FETCH ================= */}
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#272727]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center text-[#FF0000]">
                          <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                            <span>YouTube Channel Auto-Fetch</span>
                            <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#272727] text-slate-300 font-semibold border border-white/10">
                              Instant Auto-Fill
                            </span>
                          </h2>
                          <p className="text-xs text-slate-400">Pastes or types URL • Automatically detects name, stats, and profile picture</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium font-sans">✓ No manual photo upload needed</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Enter your YouTube channel link or handle below. CreatorHQ automatically pulls your official channel name, handle, subscriber count, channel ID, and sets your Creator Pass profile picture automatically.
                    </p>

                    {/* Auto-Fetch Input Bar */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 fill-[#FF0000]" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="Paste YouTube channel URL (e.g. https://www.youtube.com/@unrulek or @mrbeast)"
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3ea6ff] font-sans transition-colors shadow-inner"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDetectYouTube()}
                          disabled={youtubeDetecting || !youtubeUrl.trim()}
                          className="px-6 py-3 rounded-xl bg-[#cc0000] hover:bg-[#ff0000] disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                          {youtubeDetecting ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Fetching Data...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-white" />
                              <span>Auto-Fetch Channel Info</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400 font-sans">Quick examples:</span>
                        {[
                          { label: '@unrulek', url: 'https://youtube.com/@unrulek' },
                          { label: '@mrbeast', url: 'https://youtube.com/@mrbeast' },
                          { label: '@mkbhd', url: 'https://youtube.com/@mkbhd' },
                          { label: '@senpaispider', url: 'https://youtube.com/@senpaispider' },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              setYoutubeUrl(chip.url);
                              handleDetectYouTube(chip.url);
                            }}
                            className="px-3 py-1 rounded-full bg-[#222222] hover:bg-[#333333] border border-[#303030] text-xs font-sans text-slate-200 hover:text-white transition-colors"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      {youtubeError && (
                        <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-medium">
                          {youtubeError}
                        </div>
                      )}

                      {/* ================= AUTO-FETCHED PUBLIC INFORMATION DISPLAY ================= */}
                      {(youtubeFetchedData || (youtubeReach && youtubeChannelId)) && (
                        <div className="p-5 rounded-xl bg-[#0d0d0d] border border-[#272727] space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              <span className="text-sm font-bold text-white font-sans">
                                Auto-Fetched YouTube Data
                              </span>
                            </div>
                            <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#1c2218] text-emerald-400 border border-[#2f4f22] font-semibold">
                              ✓ Synced to Pass
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                            {/* Profile Picture */}
                            <div className="sm:col-span-4 flex flex-col items-center sm:items-start space-y-2">
                              <div className="relative">
                                <img
                                  src={getSafeAvatarUrl(avatarUrl || youtubeFetchedData?.avatarUrl, displayName)}
                                  alt="Official YouTube Avatar"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Creator')}&background=141414&color=ffffff&size=256&bold=true`;
                                  }}
                                  className="w-20 h-20 rounded-full object-cover border-2 border-[#2e2e2e] shadow-md ring-2 ring-black"
                                />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0088ff] border-2 border-white flex items-center justify-center text-white shadow-md ring-1 ring-black/40">
                                  <Check className="w-3.5 h-3.5 stroke-[3.5] text-white" />
                                </div>
                              </div>
                              <div className="text-center sm:text-left">
                                <span className="text-xs font-bold text-white block font-sans">
                                  Official YouTube Avatar
                                </span>
                                <span className="text-[11px] text-slate-400 block font-sans">
                                  Applied directly to your Pass
                                </span>
                              </div>
                            </div>

                            {/* Fetched Meta Grid */}
                            <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 rounded-lg bg-[#161616] border border-[#262626] space-y-0.5">
                                <span className="text-[11px] font-semibold text-slate-400 block font-sans">CHANNEL NAME</span>
                                <span className="font-bold text-white text-sm truncate block font-sans">
                                  {youtubeFetchedData?.title || displayName}
                                </span>
                              </div>

                              <div className="p-3 rounded-lg bg-[#161616] border border-[#262626] space-y-0.5">
                                <span className="text-[11px] font-semibold text-slate-400 block font-sans">HANDLE</span>
                                <span className="font-bold text-sky-400 text-sm truncate block font-sans">
                                  {youtubeFetchedData?.handle || `@${youtubeUsername || username}`}
                                </span>
                              </div>

                              <div className="p-3 rounded-lg bg-[#161616] border border-[#262626] space-y-0.5">
                                <span className="text-[11px] font-semibold text-slate-400 block font-sans">SUBSCRIBER COUNT</span>
                                <span className="font-bold text-emerald-400 text-sm block font-sans">
                                  {youtubeReach}
                                </span>
                              </div>

                              <div className="p-3 rounded-lg bg-[#161616] border border-[#262626] space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-slate-400 block font-sans">CHANNEL ID</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(youtubeChannelId);
                                      setCopiedChannelId(true);
                                      setTimeout(() => setCopiedChannelId(false), 2000);
                                    }}
                                    className="text-[11px] text-sky-400 hover:text-white flex items-center gap-1 font-sans"
                                    title="Copy Channel ID"
                                  >
                                    {copiedChannelId ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                    <span>{copiedChannelId ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                                <span className="text-slate-300 text-xs truncate block font-sans" title={youtubeChannelId}>
                                  {youtubeChannelId}
                                </span>
                              </div>

                              <div className="sm:col-span-2 p-3 rounded-lg bg-[#161616] border border-[#262626] flex items-center justify-between">
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-400 block font-sans">CHANNEL URL</span>
                                  <a
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-sky-400 hover:text-sky-300 font-sans truncate flex items-center gap-1.5"
                                  >
                                    <span className="truncate max-w-[280px] sm:max-w-md">{youtubeUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </div>
                                <span className="text-xs text-emerald-400 font-sans font-semibold hidden sm:inline">
                                  Verified
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-[#161616] border border-[#282828] text-xs text-slate-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>
                              Profile picture and details automatically synced. All form fields below have been updated automatically.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Section 1: Visual Identity */}
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">1</span>
                        <span>Visual Identity & Profile Picture</span>
                      </h2>
                      {avatarUrl && (
                        <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#1c2218] text-emerald-400 border border-[#2f4f22] font-semibold">
                          {isAvatarFromYouTube ? '✓ Auto-Sourced from YouTube' : '✓ Active Profile Avatar'}
                        </span>
                      )}
                    </div>

                    {avatarUrl ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                          <div className="relative shrink-0">
                            <img
                              src={getSafeAvatarUrl(avatarUrl, displayName)}
                              alt="Creator Profile Avatar"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Creator')}&background=141414&color=ffffff&size=256&bold=true`;
                              }}
                              className="w-16 h-16 rounded-full object-cover border-2 border-[#2e2e2e] shadow-md ring-2 ring-black"
                            />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0088ff] border-2 border-white flex items-center justify-center text-white shadow-md ring-1 ring-black/40">
                              <Check className="w-3.5 h-3.5 stroke-[3.5] text-white" />
                            </div>
                          </div>
                          <div className="flex-1 text-center sm:text-left space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <h4 className="text-sm font-bold text-white font-sans">
                                Creator Profile Picture: Active & Synced
                              </h4>
                            </div>
                            <p className="text-xs text-slate-400 font-sans">
                              {isAvatarFromYouTube
                                ? 'This avatar was automatically retrieved from your YouTube channel and placed on your Creator Pass. No manual upload is required.'
                                : 'This is the active avatar displayed on your Creator Pass.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowManualUpload(!showManualUpload)}
                            className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4 shrink-0 transition-colors font-sans"
                          >
                            {showManualUpload ? 'Hide Custom Upload' : 'Upload custom photo instead (Optional)'}
                          </button>
                        </div>

                        {showManualUpload && (
                          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#272727] animate-fadeIn">
                            <ImageUploader
                              label="Upload Custom Profile Picture (Optional Override)"
                              description="Override your YouTube avatar with a custom high-resolution photo or logo (PNG, JPG, or WebP)."
                              aspectRatio="avatar"
                              currentImage={avatarUrl || undefined}
                              onImageChange={(img) => {
                                setAvatarUrl(img);
                                setIsAvatarFromYouTube(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 font-sans">
                          Tip: Submit your YouTube channel URL in the auto-fetch box above to automatically pull your profile picture, or upload a photo below.
                        </p>
                        <ImageUploader
                          label="Profile Picture / Avatar"
                          description="Upload a high-resolution photo or creator logo (PNG, JPG, or WebP)."
                          aspectRatio="avatar"
                          currentImage={avatarUrl || undefined}
                          onImageChange={(img) => {
                            setAvatarUrl(img);
                            setIsAvatarFromYouTube(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Section 2: Creator Details */}
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-5">
                    <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">2</span>
                      <span>Creator Details</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                          CREATOR DISPLAY NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. NightHawk"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-bold font-sans"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-200 font-sans">
                            HANDLE / USERNAME *
                          </label>
                          {handleCheckStatus === 'checking' && (
                            <span className="text-[11px] text-slate-400 font-sans animate-pulse">Checking...</span>
                          )}
                          {handleCheckStatus === 'taken' && (
                            <span className="text-[11px] text-red-400 font-semibold font-sans flex items-center gap-1">
                              <span>❌ Already taken</span>
                            </span>
                          )}
                          {handleCheckStatus === 'available' && (
                            <span className="text-[11px] text-emerald-400 font-semibold font-sans flex items-center gap-1">
                              <span>✓ Available</span>
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="e.g. nighthawk"
                          className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border ${
                            handleCheckStatus === 'taken'
                              ? 'border-red-500/80 focus:border-red-400'
                              : handleCheckStatus === 'available'
                              ? 'border-emerald-500/80 focus:border-emerald-400'
                              : 'border-[#2e2e2e] focus:border-[#3ea6ff]'
                          } text-sm text-white focus:outline-none transition-colors font-sans`}
                        />
                        {handleCheckStatus === 'taken' && (
                          <p className="mt-1 text-[11px] text-red-400 font-medium">
                            {handleCheckMessage || 'This Creator ID / handle is already taken by another creator.'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                          NICHE / CATEGORY
                        </label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g. Gaming & Esports"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                          LOCATION
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Los Angeles, CA"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                        ABOUT / BIO
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell sponsors and fans about your content, milestones, and collaborations..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                        BUSINESS CONTACT EMAIL *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. yourname.business@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] font-sans"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">
                        YouTubers add their own personal or business email for sponsors. CreatorHQ does not issue custom email addresses.
                      </p>
                    </div>
                  </div>

                  {/* Card Section 3: Connected Reach via Official APIs */}
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">3</span>
                        <span>Connected Social Platforms</span>
                      </h2>
                      <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#1c2218] text-emerald-400 border border-[#2f4f22] font-semibold">
                        Auto-Verified Platforms
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-sans">
                      Connect your social platforms. CreatorHQ automatically fetches available public profile information from YouTube, Discord, Instagram, and X / Twitter to display cleanly on your Creator Pass.
                    </p>

                    {/* 1. YouTube Channel Auto-Detection */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                          <svg className="w-4 h-4 fill-[#FF0000]" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          <span>YouTube Channel URL / Handle</span>
                        </label>
                        {youtubeChannelId && (
                          <span className="text-[11px] font-sans text-emerald-400">ID: {youtubeChannelId.substring(0, 14)}...</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          onBlur={() => { if (youtubeUrl && !youtubeReach) handleDetectYouTube(); }}
                          placeholder="e.g. https://youtube.com/@example or @channel"
                          className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleDetectYouTube()}
                          disabled={youtubeDetecting || !youtubeUrl.trim()}
                          className="px-4 py-2.5 rounded-lg bg-[#cc0000] hover:bg-[#ff0000] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                        >
                          {youtubeDetecting ? 'Detecting...' : 'Detect Channel'}
                        </button>
                      </div>

                      {youtubeError && (
                        <p className="text-xs text-red-400 font-medium font-sans">{youtubeError}</p>
                      )}

                      {/* Read-Only Verified Subscriber Count Banner */}
                      {youtubeReach && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-slate-300">Official YouTube Count:</span>
                            <span className="font-bold text-white font-sans">{youtubeReach}</span>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-sans font-semibold">✓ Auto-Updating</span>
                        </div>
                      )}

                      {/* YouTube Studio Screenshot Proof */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <label className="text-xs font-bold text-slate-300 block flex items-center justify-between font-sans">
                          <span>YouTube Studio Proof Screenshot</span>
                          <span className="text-[11px] text-amber-400 font-normal">Proof of Channel Ownership</span>
                        </label>
                        <ImageUploader
                          label="Upload YouTube Channel Proof Screenshot"
                          description="Upload a screenshot of your YouTube Studio dashboard or analytics proving ownership."
                          aspectRatio="banner"
                          currentImage={youtubeProof || undefined}
                          onImageChange={(img) => setYoutubeProof(img)}
                        />
                      </div>
                    </div>

                    {/* 2. Discord Server Auto-Detection */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                          <svg className="w-4 h-4 fill-[#5865F2]" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          <span>Discord Server Invite / Link</span>
                        </label>
                        {discordGuildId && (
                          <span className="text-[11px] font-sans text-emerald-400">Guild ID: {discordGuildId.substring(0, 12)}...</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discordUrl}
                          onChange={(e) => setDiscordUrl(e.target.value)}
                          onBlur={() => { if (discordUrl && !discordReach) handleDetectDiscord(); }}
                          placeholder="e.g. https://discord.gg/example"
                          className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#5865F2] font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleDetectDiscord()}
                          disabled={discordDetecting || !discordUrl.trim()}
                          className="px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                        >
                          {discordDetecting ? 'Detecting...' : 'Detect Server'}
                        </button>
                      </div>

                      {discordError && (
                        <p className="text-xs text-red-400 font-medium font-sans">{discordError}</p>
                      )}

                      {/* Read-Only Verified Member Count Banner */}
                      {discordReach && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-slate-300">Official Discord Members:</span>
                            <span className="font-bold text-white font-sans">{discordReach}</span>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-sans font-semibold">✓ Auto-Updating</span>
                        </div>
                      )}

                      {/* Discord Server Screenshot Proof */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <label className="text-xs font-bold text-slate-300 block flex items-center justify-between font-sans">
                          <span>Discord Server Proof Screenshot</span>
                          <span className="text-[11px] text-amber-400 font-normal">Official Proof Required</span>
                        </label>
                        <ImageUploader
                          label="Upload Discord Server Proof Screenshot"
                          description="Upload a screenshot of your Discord Server Settings / Roles proving ownership."
                          aspectRatio="banner"
                          currentImage={discordProof || undefined}
                          onImageChange={(img) => setDiscordProof(img)}
                        />
                      </div>
                    </div>

                    {/* 3. Instagram Profile Auto-Detection */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                          <svg className="w-4 h-4 fill-[#E1306C]" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span>Instagram Profile URL / Handle</span>
                        </label>
                        {instagramUsername && (
                          <span className="text-[11px] font-sans text-pink-400">@{instagramUsername}</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          onBlur={() => { if (instagramUrl && !instagramReach) handleDetectInstagram(); }}
                          placeholder="e.g. https://instagram.com/creator or @handle"
                          className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#E1306C] font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleDetectInstagram()}
                          disabled={instagramDetecting || !instagramUrl.trim()}
                          className="px-4 py-2.5 rounded-lg bg-[#E1306C] hover:bg-[#c12a5b] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                        >
                          {instagramDetecting ? 'Detecting...' : 'Detect Instagram'}
                        </button>
                      </div>

                      {instagramError && (
                        <p className="text-xs text-red-400 font-medium font-sans">{instagramError}</p>
                      )}

                      {/* Verified Instagram Followers Banner */}
                      {instagramReach && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-400" />
                            <span className="text-slate-300">Live Instagram Followers:</span>
                            <span className="font-bold text-white font-sans">{instagramReach}</span>
                          </div>
                          <span className="text-[11px] text-pink-400 font-sans font-semibold">✓ Auto-Fetched</span>
                        </div>
                      )}
                    </div>

                    {/* 4. X / Twitter Profile Auto-Detection */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span>X / Twitter Profile URL / Handle</span>
                        </label>
                        {xUsername && (
                          <span className="text-[11px] font-sans text-slate-300">@{xUsername}</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={xUrl}
                          onChange={(e) => setXUrl(e.target.value)}
                          onBlur={() => { if (xUrl && !xReach) handleDetectX(); }}
                          placeholder="e.g. https://x.com/creator or @handle"
                          className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-white/50 font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleDetectX()}
                          disabled={xDetecting || !xUrl.trim()}
                          className="px-4 py-2.5 rounded-lg bg-[#222222] hover:bg-[#333333] border border-[#333333] text-white disabled:opacity-50 text-xs font-bold font-sans transition-colors shrink-0"
                        >
                          {xDetecting ? 'Detecting...' : 'Detect X Profile'}
                        </button>
                      </div>

                      {xError && (
                        <p className="text-xs text-red-400 font-medium font-sans">{xError}</p>
                      )}

                      {/* Verified X Followers Banner */}
                      {xReach && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            <span className="text-slate-300">Live X / Twitter Followers:</span>
                            <span className="font-bold text-white font-sans">{xReach}</span>
                          </div>
                          <span className="text-[11px] text-slate-300 font-sans font-semibold">✓ Auto-Fetched</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={handleCheckStatus === 'taken'}
                      className="w-full py-4 rounded-xl btn-chq-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{handleCheckStatus === 'taken' ? 'Handle Already Taken — Choose Unique Handle' : 'Create & Claim My Creator Pass'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </form>

                {/* Right Sticky Preview: 5 Columns */}
                <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <span className="font-mono font-semibold text-slate-300 uppercase">
                      Live Pass Preview
                    </span>
                    <span className="text-sky-400 font-mono">
                      Updates instantly
                    </span>
                  </div>

                  {/* Card Container */}
                  <div className="p-6 sm:p-8 rounded-2xl bg-[#11141a] border border-white/10 shadow-xl flex flex-col items-center justify-center">
                    <PassportCard
                      creator={liveCreator}
                      interactive={true}
                      size="hero"
                      showControls={true}
                      allowFreeze={true}
                    />
                  </div>

                  <p className="text-xs text-slate-400 text-center font-mono">
                    Interact with your card: hover to tilt in 3D, flip to see back, or freeze.
                  </p>
                </div>

              </div>

            </div>
          ) : (
            /* =========================================================================
               FLOW B: USER HAS CREATED THEIR PASS (CREATOR STUDIO MODE)
               ========================================================================= */
            <div className="space-y-8">
              
              {/* Top Studio Control Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={displayName}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white/20 shadow-xl ring-2 ring-black/50"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                        {displayName}
                      </h1>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>@{username || 'creator'}</span>
                      <span>•</span>
                      <span className="text-sky-400 font-semibold">{liveCreator.passportId}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        IP Locked Session
                      </span>
                    </div>
                  </div>
                </div>

                {/* Studio Header Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex rounded-xl bg-[#161922] p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStudioTab('editor')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        studioTab === 'editor'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Studio Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioTab('showcase')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        studioTab === 'showcase'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Card Showcase
                    </button>
                  </div>

                  <Link
                    href={`/${liveCreator.username || 'creator'}/${liveCreator.passportId || passportId || 'my-pass'}`}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>View Public Profile</span>
                  </Link>

                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied' : 'Share Pass'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Log out and return to demo preview"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {studioTab === 'editor' ? (
                /* Main Studio Grid: Left Full Form, Right Sticky Live Preview */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  
                  {/* Left Form: 7 Columns */}
                  <form onSubmit={handleSaveEdits} className="lg:col-span-7 space-y-6">
                    <div className="p-4 rounded-xl bg-[#141414] border border-[#272727] text-xs text-slate-300 flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#3ea6ff] shrink-0" />
                        <span>Live Creator Studio • Modify any field below and click Save Changes to persist.</span>
                      </div>
                      <span className="font-sans text-[11px] text-emerald-400 font-bold bg-[#1c2218] px-2.5 py-0.5 rounded-full border border-[#2f4f22]">
                        Active Pass
                      </span>
                    </div>

                    {/* Section 1: Visual Identity */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">1</span>
                          <span>Visual Identity & Profile Picture</span>
                        </h2>
                        {avatarUrl && (
                          <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#1c2218] text-emerald-400 border border-[#2f4f22] font-semibold">
                            {isAvatarFromYouTube ? '✓ Auto-Sourced from YouTube' : '✓ Active Profile Avatar'}
                          </span>
                        )}
                      </div>

                      {avatarUrl ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                            <div className="relative shrink-0">
                              <img
                                src={avatarUrl}
                                alt="Creator Profile Avatar"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Creator')}&background=1a1a1a&color=ffffff&size=256&bold=true`;
                                }}
                                className="w-16 h-16 rounded-full object-cover border-2 border-[#2e2e2e] shadow-md ring-2 ring-black"
                              />
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0088ff] border-2 border-white flex items-center justify-center text-white shadow-md ring-1 ring-black/40">
                                <Check className="w-3.5 h-3.5 stroke-[3.5] text-white" />
                              </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left space-y-1">
                              <h4 className="text-sm font-bold text-white font-sans">
                                Creator Profile Picture: Active & Displayed
                              </h4>
                              <p className="text-xs text-slate-400 font-sans">
                                {isAvatarFromYouTube
                                  ? 'Automatically synced from your YouTube channel. Displayed on the front and back of your Creator Pass.'
                                  : 'Active custom profile picture displayed on your Creator Pass.'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowManualUpload(!showManualUpload)}
                              className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4 shrink-0 transition-colors font-sans"
                            >
                              {showManualUpload ? 'Hide Custom Upload' : 'Change Avatar (Optional)'}
                            </button>
                          </div>

                          {showManualUpload && (
                            <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#272727] animate-fadeIn">
                              <ImageUploader
                                label="Upload Custom Profile Picture (Optional)"
                                description="Upload a high-resolution photo or logo (PNG, JPG, or WebP)."
                                aspectRatio="avatar"
                                currentImage={avatarUrl || undefined}
                                onImageChange={(img) => {
                                  setAvatarUrl(img);
                                  setIsAvatarFromYouTube(false);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <ImageUploader
                          label="Profile Picture / Avatar"
                          description="Upload a high-resolution photo or creator logo (PNG, JPG, or WebP)."
                          aspectRatio="avatar"
                          currentImage={avatarUrl || undefined}
                          onImageChange={(img) => {
                            setAvatarUrl(img);
                            setIsAvatarFromYouTube(false);
                          }}
                        />
                      )}
                    </div>

                    {/* Section 2: Creator Details */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-5">
                      <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">2</span>
                        <span>Creator Details</span>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                            CREATOR DISPLAY NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. NightHawk"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-bold font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                            HANDLE / USERNAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="e.g. nighthawk"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                            NICHE / CATEGORY
                          </label>
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Gaming & Esports"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                            LOCATION
                          </label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Los Angeles, CA"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                          ABOUT / BIO
                        </label>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell sponsors and fans about your content, milestones, and collaborations..."
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] transition-colors font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1.5 font-sans">
                          BUSINESS CONTACT EMAIL *
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="e.g. yourname.business@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] font-sans"
                        />
                      </div>
                    </div>

                    {/* Section 3: Official Platform Synchronization & Proof Screenshots */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">3</span>
                          <span>Official Platform Synchronization & Proofs</span>
                        </h2>
                        <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#1c2218] text-emerald-400 border border-[#2f4f22] font-semibold">
                          Live API • Auto-Verified
                        </span>
                      </div>

                      {/* YouTube Section */}
                      <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                            <svg className="w-4 h-4 fill-[#FF0000]" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span>YouTube Channel URL</span>
                          </label>
                          {youtubeChannelId && (
                            <span className="text-[11px] font-sans text-emerald-400">ID: {youtubeChannelId.substring(0, 12)}...</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="e.g. https://youtube.com/@yourchannel"
                            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#3ea6ff] font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleDetectYouTube()}
                            disabled={youtubeDetecting || !youtubeUrl.trim()}
                            className="px-4 py-2.5 rounded-lg bg-[#cc0000] hover:bg-[#ff0000] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                          >
                            {youtubeDetecting ? 'Detecting...' : 'Detect'}
                          </button>
                        </div>

                        {youtubeError && (
                          <p className="text-xs text-red-400 font-medium font-sans">{youtubeError}</p>
                        )}

                        {youtubeReach && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-slate-300">Live Verified Subscribers:</span>
                              <span className="font-bold text-white font-sans">{youtubeReach}</span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-sans font-semibold">✓ Live Scraper Verified</span>
                          </div>
                        )}

                        {/* YouTube Studio Screenshot Proof */}
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <label className="text-xs font-bold text-slate-300 block flex items-center justify-between font-sans">
                            <span>YouTube Studio Screenshot Proof</span>
                            <span className="text-[11px] text-amber-400 font-normal">Ownership Proof</span>
                          </label>
                          <ImageUploader
                            label="Upload YouTube Studio Proof Screenshot"
                            description="Screenshot of your YouTube Studio dashboard showing analytics or channel customization."
                            aspectRatio="banner"
                            currentImage={youtubeProof || undefined}
                            onImageChange={(img) => setYoutubeProof(img)}
                          />
                        </div>
                      </div>

                      {/* Discord Section */}
                      <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                            <svg className="w-4 h-4 fill-[#5865F2]" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            <span>Discord Server Invite</span>
                          </label>
                          {discordGuildId && (
                            <span className="text-[11px] font-sans text-emerald-400">ID: {discordGuildId.substring(0, 10)}...</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discordUrl}
                            onChange={(e) => setDiscordUrl(e.target.value)}
                            placeholder="e.g. https://discord.gg/yourserver"
                            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#5865F2] font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleDetectDiscord()}
                            disabled={discordDetecting || !discordUrl.trim()}
                            className="px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                          >
                            {discordDetecting ? 'Detecting...' : 'Detect'}
                          </button>
                        </div>

                        {discordError && (
                          <p className="text-xs text-red-400 font-medium font-sans">{discordError}</p>
                        )}

                        {discordReach && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-slate-300">Live Verified Members:</span>
                              <span className="font-bold text-white font-sans">{discordReach}</span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-sans font-semibold">✓ Official Discord API</span>
                          </div>
                        )}

                        {/* Discord Server Screenshot Proof */}
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <label className="text-xs font-bold text-slate-300 block flex items-center justify-between font-sans">
                            <span>Discord Server Screenshot Proof</span>
                            <span className="text-[11px] text-amber-400 font-normal">Ownership Proof</span>
                          </label>
                          <ImageUploader
                            label="Upload Discord Server Proof Screenshot"
                            description="Screenshot of your Discord Server Settings showing Owner role or Server Management."
                            aspectRatio="banner"
                            currentImage={discordProof || undefined}
                            onImageChange={(img) => setDiscordProof(img)}
                          />
                        </div>
                      </div>

                      {/* Instagram Section */}
                      <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                            <svg className="w-4 h-4 fill-[#E1306C]" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            <span>Instagram Profile URL / Handle</span>
                          </label>
                          {instagramUsername && (
                            <span className="text-[11px] font-sans text-pink-400">@{instagramUsername}</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="e.g. https://instagram.com/creator or @handle"
                            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-[#d62976] font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleDetectInstagram()}
                            disabled={instagramDetecting || !instagramUrl.trim()}
                            className="px-4 py-2.5 rounded-lg bg-[#d62976] hover:bg-[#c12764] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                          >
                            {instagramDetecting ? 'Detecting...' : 'Detect'}
                          </button>
                        </div>

                        {instagramError && (
                          <p className="text-xs text-red-400 font-medium font-sans">{instagramError}</p>
                        )}

                        {instagramReach && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-slate-300">Live Verified Followers:</span>
                              <span className="font-bold text-white font-sans">{instagramReach}</span>
                            </div>
                            <span className="text-[11px] text-pink-400 font-sans font-semibold">✓ Auto-Fetched</span>
                          </div>
                        )}
                      </div>

                      {/* X / Twitter Section */}
                      <div className="space-y-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#272727]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 block mb-1 font-sans flex items-center gap-2">
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span>X / Twitter Profile URL / Handle</span>
                          </label>
                          {xUsername && (
                            <span className="text-[11px] font-sans text-slate-300">@{xUsername}</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={xUrl}
                            onChange={(e) => setXUrl(e.target.value)}
                            placeholder="e.g. https://x.com/creator or @handle"
                            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] text-sm text-white focus:outline-none focus:border-white/50 font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleDetectX()}
                            disabled={xDetecting || !xUrl.trim()}
                            className="px-4 py-2.5 rounded-lg bg-[#222222] hover:bg-[#333333] border border-[#303030] disabled:opacity-50 text-white text-xs font-bold font-sans transition-colors shrink-0"
                          >
                            {xDetecting ? 'Detecting...' : 'Detect'}
                          </button>
                        </div>

                        {xError && (
                          <p className="text-xs text-red-400 font-medium font-sans">{xError}</p>
                        )}

                        {xReach && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161616] border border-[#262626] text-xs font-sans">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-slate-300">Live Verified Followers:</span>
                              <span className="font-bold text-white font-sans">{xReach}</span>
                            </div>
                            <span className="text-[11px] text-slate-300 font-sans font-semibold">✓ Auto-Fetched</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 4: More Channels & Platforms */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#272727] shadow-lg space-y-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">4</span>
                          <span>Additional Channels & Platforms</span>
                        </h2>
                        <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#272727] text-slate-300 font-semibold border border-white/10">Optional</span>
                      </div>

                      <MoreChannelsCard
                        passportId={passportId || 'my-pass'}
                        channels={moreChannels}
                        editable={true}
                        onUpdate={(updated: ChannelItem[]) => setMoreChannels(updated)}
                      />
                    </div>

                    {/* Section 5: Save Actions */}
                    <div className="pt-4 space-y-4">
                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-[#cc0000] hover:bg-[#ff0000] text-white font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes & Update Pass</span>
                      </button>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-sans">
                        <button
                          type="button"
                          onClick={handleResetCard}
                          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteMyPass}
                          className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Pass from Network</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Right Live Preview: 5 Columns (Sticky) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#272727] text-xs font-sans">
                      <span className="font-bold text-white uppercase tracking-wider">
                        Live Pass Preview
                      </span>
                      <span className="text-slate-400 font-medium">
                        Updates in Real-Time
                      </span>
                    </div>

                    {/* Passport Card */}
                    <div className="p-6 sm:p-8 rounded-2xl bg-[#141414] border border-[#272727] shadow-xl flex flex-col items-center justify-center">
                      <PassportCard
                        creator={liveCreator}
                        interactive={true}
                        size="hero"
                        showControls={true}
                        allowFreeze={true}
                      />
                    </div>

                    {/* Theme Selector */}
                    <div className="p-4 rounded-xl bg-[#141414] border border-[#272727] space-y-2.5 font-sans">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                        Card Aesthetic Theme
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['obsidian', 'aurora', 'cyber', 'crimson'] as CardTheme[]).map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => setSelectedTheme(theme)}
                            className={`py-2 px-1 rounded-lg text-xs font-bold capitalize transition-all border ${
                              selectedTheme === theme
                                ? 'bg-[#272727] border-white text-white shadow-sm'
                                : 'bg-[#0a0a0a] border-[#2e2e2e] text-slate-400 hover:text-white'
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Public Share Link Card */}
                    <div className="p-4 rounded-xl bg-[#141414] border border-[#272727] space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px] font-bold text-slate-300 uppercase">PUBLIC PASS URL</span>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="text-xs text-[#3ea6ff] hover:text-white font-semibold flex items-center gap-1 font-sans"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] font-sans text-xs text-slate-300 break-all select-all">
                        creatorhq.fun/{liveCreator.username || 'creator'}/{liveCreator.passportId || passportId || 'my-pass'}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Card Showcase Mode */
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="p-8 sm:p-12 rounded-3xl bg-[#141414] border border-[#272727] shadow-2xl flex flex-col items-center justify-center">
                    <PassportCard
                      creator={liveCreator}
                      size="hero"
                      interactive={true}
                      showControls={true}
                      allowFreeze={true}
                    />
                  </div>

                  {/* Showcase Quick Stats & More Channels */}
                  {moreChannels && moreChannels.length > 0 && (
                    <div className="p-6 rounded-2xl bg-[#141414] border border-[#272727]">
                      <MoreChannelsCard
                        passportId={passportId || 'my-pass'}
                        channels={moreChannels}
                        editable={false}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* Platform Verification Modal */}
      {verificationModalType && (
        <ScreenshotVerificationModal
          platform={verificationModalType}
          isOpen={true}
          onClose={() => setVerificationModalType(null)}
          onSuccess={handlePlatformVerified}
        />
      )}

      <Footer />
    </div>
  );
}
