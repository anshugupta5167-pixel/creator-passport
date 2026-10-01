'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScreenshotVerificationModalProps {
  platform: 'YOUTUBE' | 'DISCORD';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { platform: string; metric: string; account: string; proofUrl: string }) => void;
}

export default function ScreenshotVerificationModal({
  platform,
  isOpen,
  onClose,
  onSuccess,
}: ScreenshotVerificationModalProps) {
  const [channelUrl, setChannelUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isYouTube = platform === 'YOUTUBE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isYouTube) {
        const res = await fetch('/api/youtube/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: channelUrl.trim() }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'YouTube channel not found. Please check URL.');
        }

        onSuccess({
          platform: 'YOUTUBE',
          metric: data.channel.subscriberCountFormatted,
          account: data.channel.handle || data.channel.title,
          proofUrl: data.channel.url,
        });
      } else {
        const res = await fetch('/api/discord/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteUrl: channelUrl.trim() }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Discord server not found. Ensure the invite is active.');
        }

        onSuccess({
          platform: 'DISCORD',
          metric: data.server.memberCountFormatted,
          account: data.server.guildName,
          proofUrl: data.server.inviteUrl,
        });
      }

      try {
        confetti({ particleCount: 35, spread: 50 });
      } catch (err) {}
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to detect channel. Please check the link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#11141a] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm ${
              isYouTube ? 'bg-red-600' : 'bg-[#5865F2]'
            }`}
          >
            {isYouTube ? (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            )}
          </div>
          <div>
            <span className="text-xs font-mono text-sky-400 uppercase tracking-widest font-semibold">
              AUTOMATIC PLATFORM VERIFICATION
            </span>
            <h3 className="text-xl font-bold text-white font-sans">
              {isYouTube ? 'Connect YouTube Channel' : 'Connect Discord Community'}
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1 font-semibold">
              {isYouTube ? 'YOUTUBE CHANNEL URL OR @HANDLE' : 'DISCORD SERVER INVITE LINK'}
            </label>
            <input
              type="text"
              required
              placeholder={isYouTube ? 'https://youtube.com/@SenpaiSpider or @SenpaiExtra' : 'https://discord.gg/yourcommunity'}
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              The system will automatically detect your {isYouTube ? 'channel' : 'server'} and fetch live authenticated {isYouTube ? 'subscribers' : 'members'} without manual entry.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !channelUrl.trim()}
              className="px-5 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Detecting & Verifying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Detect & Connect</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
