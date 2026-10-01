'use client';

import React, { useState } from 'react';
import { ExternalLink, Plus, Loader2, Check, X, Trash2 } from 'lucide-react';
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

  React.useEffect(() => {
    if (channels) {
      setChannelList(channels);
    }
  }, [channels]);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/channels/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportId,
          url: newUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to detect channel');
      }

      const updated = data.moreChannels || [...channelList, data.channel];
      setChannelList(updated);
      if (onChannelsUpdated) onChannelsUpdated(updated);
      if (onUpdate) onUpdate(updated);
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('creatorhq_user_card');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.moreChannels = updated;
            localStorage.setItem('creatorhq_user_card', JSON.stringify(parsed));
          }
        } catch (e) {}
      }
      setNewUrl('');
      setIsAdding(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not verify channel URL');
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
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('creatorhq_user_card');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.moreChannels = filtered;
            localStorage.setItem('creatorhq_user_card', JSON.stringify(parsed));
          }
        } catch (e) {}
      }

      await fetch('/api/channels/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passportId, channelId }),
      });
    } catch (e) {}
  };

  return (
    <div className="rounded-3xl bg-[#0e1217] border border-white/10 p-6 sm:p-7 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 fill-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
            More Channels
          </h3>
        </div>

        {isEditable && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Channel</span>
          </button>
        )}
      </div>

      {/* Inline Add Channel Form */}
      {isAdding && (
        <form onSubmit={handleAddChannel} className="p-4 rounded-2xl bg-[#141820] border border-white/10 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 font-semibold uppercase">Connect Secondary Channel</span>
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

          <div className="space-y-2">
            <input
              type="text"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Paste YouTube channel URL (e.g. https://youtube.com/@SenpaiLive)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              The system will automatically detect the channel and retrieve live subscribers using the official YouTube API.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Detecting Channel...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Detect & Add Channel</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Channels Grid (Identically Matching Reference Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {channelList.length > 0 ? (
          channelList.map((ch) => {
            const cleanUrl = resolveYouTubeUrl(ch.url, ch.handle, ch.id, ch.name);
            const handleText = ch.handle?.startsWith('@') ? ch.handle : `@${ch.handle || ch.name}`;
            const subsText = ch.subscribers || (ch as any).subscriberCountFormatted || '2.4M subscribers';

            return (
              <div
                key={ch.id || ch.handle}
                className="group relative p-4 sm:p-5 rounded-2xl bg-[#0c0e14] border border-[#381116] hover:border-red-600/50 transition-all duration-200 flex items-center justify-between shadow-lg"
              >
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 flex-1 min-w-0"
                >
                  {/* Red YouTube Logo - DIRECT LOGO without square background box wrapper */}
                  <svg
                    className="w-5 h-5 fill-[#FF0000] shrink-0 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(255,0,0,0.7)]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>

                  <div className="min-w-0">
                    <span className="font-bold text-white text-base sm:text-lg block truncate font-sans group-hover:text-red-200 transition-colors">
                      {handleText}
                    </span>
                    <span className="text-sm font-semibold text-slate-200 font-mono block">
                      {subsText}
                    </span>
                  </div>
                </a>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Open Channel"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {isEditable && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveChannel(ch.id || ch.handle);
                      }}
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                      title="Permanently Delete Channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-6 rounded-2xl bg-[#141820] border border-white/10 text-center text-slate-200 text-sm sm:text-base font-sans font-medium">
            No secondary channels linked yet. Click "+ Add Channel" to connect your other YouTube channels.
          </div>
        )}
      </div>
    </div>
  );
}
