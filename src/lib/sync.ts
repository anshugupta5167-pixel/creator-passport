'use client';

// Client-side real-time synchronization manager for CreatorHQ
// Bridges Server-Sent Events (SSE), BroadcastChannel, and DOM CustomEvents

export interface SyncPayload {
  type: 'VERIFICATION_UPDATED' | 'CREATOR_CREATED' | 'CREATOR_UPDATED' | 'CREATOR_DELETED';
  slug?: string;
  status?: string;
  isVerified?: boolean;
  creator?: any;
  verification?: any;
  timestamp?: number;
  creatorSlug?: string;
  passportId?: string;
  verificationStatus?: string;
}

let eventSource: EventSource | null = null;
let broadcastChannel: BroadcastChannel | null = null;
const listeners = new Set<(payload: SyncPayload) => void>();
let backgroundMetricsTimer: any = null;

function initEventSource() {
  if (typeof window === 'undefined') return;

  if (!broadcastChannel && typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel('creatorhq_sync_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data) {
          notifyLocalListeners(event.data);
        }
      };
    } catch (e) {}
  }

  // Start periodic background metrics validator
  startBackgroundMetricsValidator();

  if (eventSource) return;

  try {
    eventSource = new EventSource('/api/events');

    eventSource.addEventListener('creator_update', (e) => {
      try {
        const payload: SyncPayload = JSON.parse(e.data);
        notifyLocalListeners(payload);
      } catch (err) {}
    });

    eventSource.onerror = () => {
      // Reconnection handled automatically by browser EventSource
    };
  } catch (err) {
    console.warn('[Sync] EventSource initialization failed:', err);
  }
}

function notifyLocalListeners(payload: SyncPayload) {
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (err) {}
  }
}

export function subscribeToCreatorSync(callback: (payload: SyncPayload) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  listeners.add(callback);
  initEventSource();

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      callback(detail);
    }
  };

  window.addEventListener('creatorhq_sync', handleCustomEvent);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('creatorhq_sync', handleCustomEvent);
  };
}

export function broadcastLocalChange(payload: SyncPayload) {
  if (typeof window === 'undefined') return;

  // 1. Notify listeners in current window
  notifyLocalListeners(payload);

  // 2. Broadcast to other tabs on same device
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {}
  }

  // 3. Dispatch standard DOM event
  try {
    window.dispatchEvent(new CustomEvent('creatorhq_sync', { detail: payload }));
  } catch (e) {}
}

/**
 * Background Task: Periodically re-fetches and validates YouTube subscriber metrics for verified creators
 */
export async function validateCreatorYouTubeMetrics() {
  if (typeof window === 'undefined') return;

  try {
    const lastValidatedKey = 'creatorhq_last_metrics_validation';
    const lastTime = parseInt(localStorage.getItem(lastValidatedKey) || '0', 10);
    const now = Date.now();

    // Throttle validation runs to once every 5 minutes per client session
    if (now - lastTime < 5 * 60 * 1000) {
      return;
    }
    localStorage.setItem(lastValidatedKey, now.toString());

    // Trigger server-side validation / cron job
    fetch('/api/cron/sync-metrics', { method: 'POST' }).catch(() => {});

    // Check active saved card in localStorage
    const savedCardRaw = localStorage.getItem('creatorhq_user_card');
    if (savedCardRaw) {
      const savedCard = JSON.parse(savedCardRaw);
      const ytConn = savedCard?.connections?.youtube;
      if (ytConn && (ytConn.profileUrl || ytConn.username || ytConn.channelId)) {
        const target = ytConn.profileUrl || ytConn.channelId || ytConn.username;
        const res = await fetch('/api/youtube/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: target, passportId: savedCard.passportId || savedCard.slug }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.channel) {
            const newReach = data.channel.subscriberCountFormatted || `${data.channel.compactSubscribers} Subscribers`;
            if (newReach && newReach !== ytConn.metricValue) {
              savedCard.connections.youtube.metricValue = newReach;
              savedCard.connections.youtube.verified = true;
              savedCard.connections.youtube.lastValidated = new Date().toISOString();
              localStorage.setItem('creatorhq_user_card', JSON.stringify(savedCard));

              // Broadcast update to all live cards and UI views
              broadcastLocalChange({
                type: 'CREATOR_UPDATED',
                creatorSlug: savedCard.slug,
                creator: savedCard,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    // Non-blocking background worker
  }
}

function startBackgroundMetricsValidator() {
  if (typeof window === 'undefined' || backgroundMetricsTimer) return;

  // Run initial check after 3 seconds
  setTimeout(() => {
    validateCreatorYouTubeMetrics();
  }, 3000);

  // Set recurring interval every 10 minutes
  backgroundMetricsTimer = setInterval(() => {
    validateCreatorYouTubeMetrics();
  }, 10 * 60 * 1000);
}
