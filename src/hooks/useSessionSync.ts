'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, CreatorProfile } from '@/lib/types';
import { readCachedAuthHint, cacheAuthHint, CachedAuthHint } from '@/lib/clientAuth';
import { subscribeToCreatorSync } from '@/lib/sync';

interface UseSessionSyncOptions {
  onSessionChange?: (data: { user: User | null; creator: CreatorProfile | null }) => void;
  enablePolling?: boolean;
  pollIntervalMs?: number;
}

export function useSessionSync(options: UseSessionSyncOptions = {}) {
  const { onSessionChange, enablePolling = true, pollIntervalMs = 5000 } = options;
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);
  const onSessionChangeRef = useRef(onSessionChange);

  useEffect(() => {
    onSessionChangeRef.current = onSessionChange;
  }, [onSessionChange]);

  const applySession = useCallback((newUser: User | null, newCreator: CreatorProfile | null) => {
    if (!isMountedRef.current) return;
    setUser(newUser);
    setCreator(newCreator);
    setIsAuthenticated(Boolean(newUser));
    setIsLoading(false);

    if (newUser) {
      cacheAuthHint(newUser, newCreator);
    }

    if (onSessionChangeRef.current) {
      onSessionChangeRef.current({ user: newUser, creator: newCreator });
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<{ user: User | null; creator: CreatorProfile | null }> => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          applySession(data.user, data.creator || null);
          return { user: data.user, creator: data.creator || null };
        }
      }
    } catch (err) {
      console.warn('[useSessionSync] Session check error:', err);
    }

    // If server unreachable, check client cache
    const cached = readCachedAuthHint();
    if (cached?.user) {
      applySession(cached.user as User, cached.creator as CreatorProfile);
      return { user: cached.user as User, creator: cached.creator as CreatorProfile };
    }

    applySession(null, null);
    return { user: null, creator: null };
  }, [applySession]);

  useEffect(() => {
    isMountedRef.current = true;

    // Fast paint from cache
    const cached = readCachedAuthHint();
    if (cached?.user) {
      setUser(cached.user as User);
      if (cached.creator) setCreator(cached.creator as CreatorProfile);
      setIsAuthenticated(true);
      setIsLoading(false);
    }

    // Initial server check
    refreshSession();

    // Listen to custom live events
    const handleAuthUpdate = (e: any) => {
      if (e.detail) {
        const u = e.detail.user || null;
        const c = e.detail.creator || null;
        applySession(u, c);
      } else {
        refreshSession();
      }
    };

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setCreator((prev) => ({
          ...(prev || {} as CreatorProfile),
          ...e.detail,
        }));
        setUser((prev) => prev ? {
          ...prev,
          displayName: e.detail.displayName || prev.displayName,
          avatarUrl: e.detail.avatarUrl || prev.avatarUrl,
        } : prev);
      } else {
        refreshSession();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'creatorhq_signed_in_hint' || e.key === 'creatorhq_user_card') {
        refreshSession();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('creatorhq_auth_updated', handleAuthUpdate);
      window.addEventListener('creatorhq_profile_updated', handleProfileUpdate);
      window.addEventListener('storage', handleStorageChange);
    }

    // Listen to sync broadcast
    const unsubscribeSync = subscribeToCreatorSync((update) => {
      if (update.creator) {
        setCreator(update.creator);
      } else {
        refreshSession();
      }
    });

    // Optional background heartbeat polling
    let intervalId: number | null = null;
    if (enablePolling) {
      intervalId = window.setInterval(() => {
        refreshSession();
      }, pollIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) window.clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('creatorhq_auth_updated', handleAuthUpdate);
        window.removeEventListener('creatorhq_profile_updated', handleProfileUpdate);
        window.removeEventListener('storage', handleStorageChange);
      }
      unsubscribeSync();
    };
  }, [refreshSession, applySession, enablePolling, pollIntervalMs]);

  return {
    user,
    creator,
    isAuthenticated,
    isLoading,
    refreshSession,
    displayName: creator?.displayName || user?.displayName || user?.username || 'Creator',
    avatarUrl: creator?.avatarUrl || user?.avatarUrl || null,
    handle: creator?.slug || creator?.username || user?.username || 'creator',
  };
}
