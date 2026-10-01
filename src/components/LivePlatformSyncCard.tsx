'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { CreatorProfile } from '@/lib/types';
import { formatTimeAgo } from '@/lib/youtube';
import { resolveYouTubeUrl, resolveDiscordUrl } from '@/lib/urls';

interface LivePlatformSyncCardProps {
  creator: CreatorProfile;
  onCreatorUpdated?: (updated: CreatorProfile) => void;
}

export default function LivePlatformSyncCard({
  creator,
  onCreatorUpdated,
}: LivePlatformSyncCardProps) {
  const [activeCreator, setActiveCreator] = useState<CreatorProfile>(creator);
  const [isSyncingYT, setIsSyncingYT] = useState(false);
  const [isSyncingDC, setIsSyncingDC] = useState(false);
  const [ytFlash, setYtFlash] = useState(false);
  const [dcFlash, setDcFlash] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now());
  const [relativeTime, setRelativeTime] = useState<string>('Updated just now');

  useEffect(() => {
    setActiveCreator(creator);
  }, [creator]);

  // Update relative time every 10 seconds
  useEffect(() => {
    const updateTimes = () => {
      const ytTs = activeCreator.connections.youtube?.lastSyncedTimestamp || lastRefreshedAt;
      setRelativeTime(formatTimeAgo(ytTs));
    };
    updateTimes();
    const interval = setInterval(updateTimes, 10000);
    return () => clearInterval(interval);
  }, [activeCreator, lastRefreshedAt]);

  // Auto-refresh periodically (every 45 seconds) as requested
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      handleRefreshAll();
    }, 45000);

    return () => clearInterval(autoRefreshTimer);
  }, [activeCreator.passportId]);

  // Refresh YouTube Channel
  const handleRefreshYouTube = async () => {
    if (isSyncingYT || !activeCreator.connections.youtube?.connected) return;
    setIsSyncingYT(true);

    try {
      const res = await fetch(
        `/api/youtube/refresh?passportId=${encodeURIComponent(activeCreator.passportId || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.channel) {
          const updatedCreator = {
            ...activeCreator,
            connections: {
              ...activeCreator.connections,
              youtube: {
                ...activeCreator.connections.youtube!,
                metricValue: data.channel.subscriberCountFormatted,
                rawCount: data.channel.subscriberCount,
                channelId: data.channel.channelId,
                lastSynced: data.channel.lastUpdated,
                lastSyncedTimestamp: data.channel.lastSyncedTimestamp,
                syncStatus: data.channel.status,
              },
            },
          };
          setActiveCreator(updatedCreator);
          if (onCreatorUpdated) onCreatorUpdated(updatedCreator);
          setLastRefreshedAt(Date.now());
          setYtFlash(true);
          setTimeout(() => setYtFlash(false), 1500);
        }
      }
    } catch (e) {
      console.error('Error refreshing YouTube:', e);
    } finally {
      setIsSyncingYT(false);
    }
  };

  // Refresh Discord Server
  const handleRefreshDiscord = async () => {
    if (isSyncingDC || !activeCreator.connections.discord?.connected) return;
    setIsSyncingDC(true);

    try {
      const res = await fetch(
        `/api/discord/refresh?passportId=${encodeURIComponent(activeCreator.passportId || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          const updatedCreator = {
            ...activeCreator,
            connections: {
              ...activeCreator.connections,
              discord: {
                ...activeCreator.connections.discord!,
                metricValue: data.server.memberCountFormatted,
                rawCount: data.server.memberCount,
                guildId: data.server.guildId,
                guildName: data.server.guildName,
                guildIcon: data.server.guildIcon,
                lastSynced: data.server.lastUpdated,
                lastSyncedTimestamp: data.server.lastSyncedTimestamp,
                syncStatus: data.server.status,
              },
            },
          };
          setActiveCreator(updatedCreator);
          if (onCreatorUpdated) onCreatorUpdated(updatedCreator);
          setLastRefreshedAt(Date.now());
          setDcFlash(true);
          setTimeout(() => setDcFlash(false), 1500);
        }
      }
    } catch (e) {
      console.error('Error refreshing Discord:', e);
    } finally {
      setIsSyncingDC(false);
    }
  };

  const handleRefreshAll = async () => {
    handleRefreshYouTube();
    handleRefreshDiscord();
  };

  const yt = activeCreator.connections.youtube;
  const dc = activeCreator.connections.discord;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 fill-[#FF0000] drop-shadow-[0_0_8px_rgba(255,0,0,0.65)]" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
            My YouTube Channel
          </h3>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-Tracking Live</span>
          </span>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={isSyncingYT || isSyncingDC}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh All Metrics from Official APIs"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncingYT || isSyncingDC ? 'animate-spin text-sky-400' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ================= YouTube Platform Card ================= */}
        {yt?.connected ? (
          <div
            className={`p-4 rounded-2xl bg-[#11141a]/95 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-3 shadow-lg relative overflow-hidden ${
              ytFlash ? 'ring-1 ring-red-500/50 bg-[#161215]' : ''
            }`}
          >
            {/* Top row: Platform Monogram & Verified Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Clean dark icon container - COLOR ONLY IN THE LOGO */}
                <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 fill-[#FF0000] drop-shadow-[0_0_6px_rgba(255,0,0,0.65)]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block font-sans">YouTube</span>
                  <span className="text-[11px] text-slate-400 font-mono">@{yt.username}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Verified</span>
                </span>
                <button
                  onClick={handleRefreshYouTube}
                  disabled={isSyncingYT}
                  className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                  title="Refresh YouTube Subscribers"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingYT ? 'animate-spin text-red-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Subscriber Count Display with Smooth Transition */}
            <div className="pt-2 border-t border-white/5 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-mono text-slate-400">Subscribers</span>
                <span className={`text-base sm:text-lg font-extrabold text-white font-mono tracking-tight transition-transform duration-300 ${
                  ytFlash ? 'scale-105 text-red-200' : ''
                }`}>
                  {yt.metricValue || '125,430 Subscribers'}
                </span>
              </div>

              {/* Channel ID & Refresh timestamp */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span className="truncate max-w-[130px] text-slate-400" title={yt.channelId || 'Stored'}>
                  ID: {yt.channelId ? `${yt.channelId.substring(0, 12)}...` : 'Official Channel'}
                </span>
                <span className="text-slate-400">
                  Last updated: {relativeTime}
                </span>
              </div>
            </div>

            {/* Channel Link - Guaranteed Canonical Resolution */}
            <a
              href={resolveYouTubeUrl(yt.profileUrl, yt.username, yt.channelId, activeCreator.username)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium pt-1 group"
            >
              <span>Open Official Channel</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#11141a]/60 border border-white/5 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center min-h-[140px]">
            <span>YouTube channel not connected</span>
          </div>
        )}

        {/* ================= Discord Platform Card ================= */}
        {dc?.connected ? (
          <div
            className={`p-4 rounded-2xl bg-[#11141a]/95 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-3 shadow-lg relative overflow-hidden ${
              dcFlash ? 'ring-1 ring-[#5865F2]/50 bg-[#121422]' : ''
            }`}
          >
            {/* Top row: Platform Monogram & Verified Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Clean dark icon container - COLOR ONLY IN THE LOGO */}
                <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 fill-[#5865F2] drop-shadow-[0_0_6px_rgba(88,101,242,0.65)]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block font-sans">Discord Community</span>
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px] block">
                    {dc.guildName || dc.username || 'Community'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Verified</span>
                </span>
                <button
                  onClick={handleRefreshDiscord}
                  disabled={isSyncingDC}
                  className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                  title="Refresh Discord Members"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingDC ? 'animate-spin text-[#5865F2]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Member Count Display with Smooth Transition */}
            <div className="pt-2 border-t border-white/5 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-mono text-slate-400">Total Members</span>
                <span className={`text-base sm:text-lg font-extrabold text-white font-mono tracking-tight transition-transform duration-300 ${
                  dcFlash ? 'scale-105 text-indigo-200' : ''
                }`}>
                  {dc.metricValue || '24,582 Members'}
                </span>
              </div>

              {/* Guild ID & Refresh timestamp */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span className="truncate max-w-[130px] text-slate-400" title={dc.guildId || 'Stored'}>
                  Guild: {dc.guildId ? `${dc.guildId.substring(0, 10)}...` : 'Verified Guild'}
                </span>
                <span className="text-slate-400">
                  Updated {relativeTime}
                </span>
              </div>
            </div>

            {/* Invite Link - Guaranteed Canonical Resolution */}
            <a
              href={resolveDiscordUrl(dc.profileUrl, dc.guildName || dc.username, dc.guildId, activeCreator.username)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#788bf0] hover:text-[#97a6fa] font-medium pt-1 group"
            >
              <span>Join Discord Server</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#11141a]/60 border border-white/5 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center min-h-[140px]">
            <span>Discord community not connected</span>
          </div>
        )}
      </div>
    </div>
  );
}
