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
