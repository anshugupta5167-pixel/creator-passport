// Real-time Event Broadcaster for CreatorHQ
// Supports Server-Sent Events (SSE) to update verification status, creators, and cards instantly across all clients

type EventListener = (data: string) => void;

class EventBroadcaster {
  private listeners: Set<EventListener> = new Set();

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(event: string, payload: any) {
    const formatted = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const listener of this.listeners) {
      try {
        listener(formatted);
      } catch (err) {
        // Listener might have closed
        this.listeners.delete(listener);
      }
    }
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }
}

// Global singleton across hot reloads in Next.js
const globalForBroadcaster = globalThis as unknown as {
  creatorHqBroadcaster?: EventBroadcaster;
};

export const broadcaster = globalForBroadcaster.creatorHqBroadcaster ?? new EventBroadcaster();

if (process.env.NODE_ENV !== 'production') {
  globalForBroadcaster.creatorHqBroadcaster = broadcaster;
}

export function notifySubscribers(payload: {
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
}) {
  try {
    broadcaster.broadcast('creator_update', {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    });
  } catch (err) {
    console.error('[Events] Error broadcasting event:', err);
  }
}
