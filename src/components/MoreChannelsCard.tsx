'use client';

import React, { useState } from 'react';
import { ExternalLink, Plus, Loader2, Check, X, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { ChannelItem } from '@/lib/types';
import { resolveYouTubeUrl } from '@/lib/urls';

interface MoreChannelsCardProps {
  passportId?: string;
  channels?: ChannelItem[];
  allowAdd?: boolean;
  editable?: boolean;
  onChannelsUpdated?: (channels: ChannelItem[]) => void;
  onUpdate?: (channels: ChannelItem[]) => void;
}

export default function MoreChannelsCard({
  passportId = '',
  channels = [],
  allowAdd,
  editable,
  onChannelsUpdated,
  onUpdate,
}: MoreChannelsCardProps) {
  const isEditable = editable !== undefined ? editable : (allowAdd !== undefined ? allowAdd : true);
  const [channelList, setChannelList] = useState<ChannelItem[]>(channels);
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (channels) {
      setChannelList(channels);
    }
  }, [channels]);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = newUrl.trim();
    if (!cleanUrl) {
      setErrorMsg('Please enter a YouTube channel URL or @handle.');
      return;
    }

    // Basic format validation
    const isYtUrl = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.startsWith('@') || cleanUrl.startsWith('UC');
    if (!isYtUrl) {
      setErrorMsg('Please provide a valid YouTube URL (e.g. https://youtube.com/@handle or @channelName).');
      return;
    }

    // Check for duplicate in current list
    const isDuplicate = channelList.some((c) => {
      const cHandle = (c.handle || '').toLowerCase().replace(/^@/, '');
      const cUrl = (c.url || '').toLowerCase();
      const inputNorm = cleanUrl.toLowerCase().replace(/^@/, '');
      return cHandle === inputNorm || cUrl.includes(inputNorm);
    });

    if (isDuplicate) {
      setErrorMsg('This YouTube channel is already linked to your profile.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s maximum timeout to prevent hanging

    try {
      const res = await fetch('/api/channels/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportId,
          url: cleanUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to detect YouTube channel');
      }

      const updated = data.moreChannels || (data.channel ? [...channelList, data.channel] : channelList);
      setChannelList(updated);
      if (onChannelsUpdated) onChannelsUpdated(updated);
      if (onUpdate) onUpdate(updated);

      setSuccessMsg(`Channel "${data.channel?.name || cleanUrl}" linked!`);
      setTimeout(() => setSuccessMsg(null), 3500);

      setNewUrl('');
      setIsAdding(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMsg('Channel detection timed out. Please verify your link and try again.');
      } else {
        setErrorMsg(err.message || 'Could not detect YouTube channel. Please check the URL.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveChannel = async (channelId: string) => {
    try {
      const cleanTarget = channelId.trim().toLowerCase();
      const cleanTargetNoAt = cleanTarget.replace(/^@/, '');
      const filtered = channelList.filter((c) => {
        const cId = (c.id || '').trim().toLowerCase();
        const cHandle = (c.handle || '').trim().toLowerCase();
        const cHandleNoAt = cHandle.replace(/^@/, '');
        const cUrl = (c.url || '').trim().toLowerCase();
        return cId !== cleanTarget && cHandle !== cleanTarget && cHandleNoAt !== cleanTargetNoAt && cUrl !== cleanTarget;
      });

      setChannelList(filtered);
      if (onChannelsUpdated) onChannelsUpdated(filtered);
      if (onUpdate) onUpdate(filtered);

      await fetch('/api/channels/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passportId, channelId }),
      });
    } catch (e) {}
  };

  return (
    <div className="rounded-2xl bg-[#0e1217] border border-white/10 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 fill-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
            More Channels
          </h3>
        </div>

        {isEditable && !isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setErrorMsg(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 hover:border-red-500 text-red-300 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Channel</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add Channel Working Form */}
      {isAdding && (
        <form onSubmit={handleAddChannel} className="p-4 rounded-xl bg-[#141820] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Link YouTube Channel</span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setErrorMsg(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="e.g. https://youtube.com/@handle or @channelName"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0d11] border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
              disabled={isLoading}
            />
            <p className="text-[11px] text-slate-400">
              Enter your channel handle or full URL. We will auto-fetch your real channel name, avatar, and subscribers.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={handleAddChannel}
                disabled={isLoading}
                className="text-[11px] underline font-semibold text-red-300 hover:text-white shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setErrorMsg(null);
              }}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !newUrl.trim()}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Detecting Channel...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Detect & Add</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channelList.length > 0 ? (
          channelList.map((ch) => {
            const cleanUrl = resolveYouTubeUrl(ch.url, ch.handle, ch.id, ch.name);
            const handleText = ch.handle?.startsWith('@') ? ch.handle : `@${ch.handle || ch.name}`;
            const subsText = ch.subscribers || (ch.numericSubscribers ? `${ch.numericSubscribers.toLocaleString()} subscribers` : 'Subscribers verified');

            return (
              <div
                key={ch.id || ch.handle}
                className="group relative p-3.5 rounded-xl bg-[#11141c] border border-white/10 hover:border-red-500/40 transition-all flex items-center justify-between shadow-md"
              >
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 min-w-0 flex-1 pr-2"
                >
                  {ch.avatarUrl ? (
                    <img
                      src={ch.avatarUrl}
                      alt={ch.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0 bg-black/40"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {ch.name?.charAt(0)?.toUpperCase() || 'Y'}
                    </div>
                  )}

                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors font-sans">
                        {ch.name}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-red-400 shrink-0" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block truncate">
                      {handleText}
                    </span>
                    <span className="text-[10px] text-red-400 font-semibold font-mono mt-0.5 block">
                      {subsText}
                    </span>
                  </div>
                </a>

                {isEditable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveChannel(ch.id || ch.handle);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove channel link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-1 sm:col-span-2 py-6 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <p className="text-xs text-slate-400 font-sans">
              No additional channels linked yet. Click &quot;Add Channel&quot; to connect secondary YouTube channels.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
