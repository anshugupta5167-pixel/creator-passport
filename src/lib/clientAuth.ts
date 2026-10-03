'use client';

const AUTH_CACHE_KEY = 'creatorhq_signed_in_hint';

export interface CachedAuthHint {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    role?: string;
  };
  creator: {
    id?: string;
    slug: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
    verification_status?: string;
  } | null;
}

// This is only a paint-time UI hint. The HTTP-only session cookie and /api/auth/me
// remain the authority for every protected action.
export function readCachedAuthHint(): CachedAuthHint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuthHint;
    return parsed?.user?.id && parsed.user.username ? parsed : null;
  } catch {
    return null;
  }
}

export function cacheAuthHint(user: any, creator?: any): void {
  if (typeof window === 'undefined' || !user?.id || !user?.username) return;
  const hint: CachedAuthHint = {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    creator: creator?.slug || creator?.username
      ? {
          id: creator.id,
          slug: creator.slug || creator.username,
          username: creator.username || creator.slug,
          displayName: creator.displayName || creator.username || creator.slug,
          avatarUrl: creator.avatarUrl,
          isVerified: creator.isVerified,
          verification_status: creator.verification_status,
        }
      : null,
  };
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(hint));
  } catch {
    // Storage may be disabled; the server session still works normally.
  }
}

export function clearCachedAuthHint(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
