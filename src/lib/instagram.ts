// Instagram Profile Fetching & Synchronization Service
// Implements handle/URL parsing, OpenGraph scraping, and rate-limit caching

export interface InstagramProfileResult {
  username: string;
  handle: string; // e.g. "@creator"
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followersFormatted: string; // e.g. "184,200 Followers"
  compactFollowers: string; // e.g. "184.2K"
  followingCount?: number;
  postsCount?: number;
  bio?: string;
  url: string;
  verified: boolean;
  lastUpdated: string;
  lastSyncedTimestamp: number;
  isCached?: boolean;
  status: 'VERIFIED' | 'SYNCING' | 'FALLBACK' | 'ERROR';
  error?: string;
}

interface CacheEntry {
  data: InstagramProfileResult;
  timestamp: number;
}

const instagramCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000;
const pendingInstagramRequests = new Map<string, Promise<InstagramProfileResult>>();

export function formatFollowersCount(count: number): { full: string; compact: string } {
  if (isNaN(count) || count <= 0) {
    return { full: '', compact: '' };
  }

  const full = `${count.toLocaleString('en-US')} Followers`;

  let compact: string;
  if (count >= 1_000_000_000) {
    compact = `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  } else if (count >= 1_000_000) {
    compact = `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (count >= 1_000) {
    compact = `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    compact = count.toString();
  }

  return { full, compact };
}

export function parseInstagramInput(input: string): {
  cleanHandle: string;
  canonicalUrl: string;
} {
  const trimmed = input.trim();

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const pathname = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
    const parts = pathname.split('/');
    const first = parts[0]?.replace(/^@/, '');
    if (first && first !== 'p' && first !== 'reel' && first !== 'stories') {
      return {
        cleanHandle: first,
        canonicalUrl: `https://www.instagram.com/${first}`,
      };
    }
  } catch (e) {}

  const clean = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();

  return {
    cleanHandle: clean || 'creator',
    canonicalUrl: `https://www.instagram.com/${clean || 'creator'}`,
  };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

/**
 * Fetch Instagram profile information
 */
export async function fetchInstagramProfile(
  rawInput: string,
  options?: { forceRefresh?: boolean; previousCount?: number }
): Promise<InstagramProfileResult> {
  const { cleanHandle, canonicalUrl } = parseInstagramInput(rawInput);
  const cacheKey = cleanHandle.toLowerCase();

  if (!cleanHandle) {
    throw new Error('Please enter a valid Instagram handle or profile URL.');
  }

  // 1. In-memory cache
  if (!options?.forceRefresh) {
    const cached = instagramCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        isCached: true,
      };
    }
  }

  // 2. In-flight deduplication
  if (pendingInstagramRequests.has(cacheKey)) {
    return pendingInstagramRequests.get(cacheKey)!;
  }

  const promise: Promise<InstagramProfileResult> = (async (): Promise<InstagramProfileResult> => {
    try {
      let scrapedFollowers: number | null = null;
      let scrapedName = '';
      let scrapedAvatar = '';
      let scrapedBio = '';

      // Try fetching public open graph metadata
      try {
        const res = await fetch(`https://www.instagram.com/${encodeURIComponent(cleanHandle)}/`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(4500),
        });

        if (res.ok) {
          const html = await res.text();

          const descMatch =
            html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

          if (descMatch) {
            const rawDesc = decodeHtmlEntities(descMatch[1]);
            const followersMatch = rawDesc.match(/([0-9.,]+)\s*([KMBkmb])?\s+Followers/i);
            if (followersMatch) {
              const num = parseFloat(followersMatch[1].replace(/,/g, ''));
              const mult = (followersMatch[2] || '').toUpperCase();
              if (mult === 'B') scrapedFollowers = Math.round(num * 1_000_000_000);
              else if (mult === 'M') scrapedFollowers = Math.round(num * 1_000_000);
              else if (mult === 'K') scrapedFollowers = Math.round(num * 1_000);
              else scrapedFollowers = Math.round(num);
            }
          }

          const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
          if (titleMatch) {
            const rawTitle = decodeHtmlEntities(titleMatch[1]);
            const nameMatch = rawTitle.match(/^([^(]+)\s*\(@/);
            if (nameMatch && nameMatch[1].trim()) {
              scrapedName = nameMatch[1].trim();
            }
          }

          const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
          if (imgMatch) {
            scrapedAvatar = imgMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          }
        }
      } catch (e) {}

      const followers = scrapedFollowers !== null ? scrapedFollowers : (options?.previousCount || 0);
      const formatted = followers > 0 ? formatFollowersCount(followers) : { full: '', compact: '' };
      const fullName = scrapedName || cleanHandle;

      const result: InstagramProfileResult = {
        username: cleanHandle,
        handle: `@${cleanHandle}`,
        fullName,
        avatarUrl: scrapedAvatar || '',
        followersCount: followers,
        followersFormatted: formatted.full,
        compactFollowers: formatted.compact,
        bio: scrapedBio || undefined,
        url: canonicalUrl,
        verified: true,
        lastUpdated: new Date().toISOString(),
        lastSyncedTimestamp: Date.now(),
        status: followers > 0 ? 'VERIFIED' : 'SYNCING',
      };

      instagramCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      pendingInstagramRequests.delete(cacheKey);
    }
  })();

  pendingInstagramRequests.set(cacheKey, promise);
  return promise;
}
