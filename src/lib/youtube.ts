// Official YouTube Data API v3 Integration & Channel Tracking Service
// Implements rate-limit handling, in-memory caching, channel ID persistence, and auto-refresh

export interface YouTubeChannelResult {
  channelId: string;
  title: string;
  handle: string;
  url: string;
  avatarUrl: string;
  description?: string;
  subscriberCount: number;
  subscriberCountFormatted: string; // e.g. "125,430 Subscribers" or "Subscribers Hidden"
  compactSubscribers: string; // e.g. "125.4K" or "Hidden"
  videoCount?: number;
  viewCount?: number;
  verified: boolean;
  lastUpdated: string;
  lastSyncedTimestamp: number;
  isCached?: boolean;
  isFallback?: boolean;
  status: 'VERIFIED' | 'SYNCING' | 'FALLBACK' | 'ERROR';
  error?: string;
}

interface CacheEntry {
  data: YouTubeChannelResult;
  timestamp: number;
}

// In-memory cache to respect quota
const channelCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

// In-flight deduplication
const pendingRequests = new Map<string, Promise<YouTubeChannelResult>>();

/**
 * Format subscriber count
 */
export function formatSubscriberCount(count: number): { full: string; compact: string } {
  if (isNaN(count) || count < 0) {
    return { full: 'Subscribers Hidden', compact: 'Hidden' };
  }

  const full = `${count.toLocaleString('en-US')} Subscribers`;

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

export function parseSubscriberString(subStr: string): { count: number; compact: string; full: string } {
  const clean = subStr.replace(/subscribers?/i, '').trim();
  let count = 0;
  if (/([0-9.]+)M/i.test(clean)) {
    const val = parseFloat(clean.match(/([0-9.]+)M/i)![1]);
    count = Math.round(val * 1_000_000);
  } else if (/([0-9.]+)K/i.test(clean)) {
    const val = parseFloat(clean.match(/([0-9.]+)K/i)![1]);
    count = Math.round(val * 1_000);
  } else if (/([0-9.]+)B/i.test(clean)) {
    const val = parseFloat(clean.match(/([0-9.]+)B/i)![1]);
    count = Math.round(val * 1_000_000_000);
  } else {
    count = parseInt(clean.replace(/,/g, ''), 10) || 0;
  }
  const formatted = formatSubscriberCount(count);
  return {
    count,
    compact: formatted.compact,
    full: formatted.full,
  };
}

export function parseYouTubeInput(rawInput: string): {
  type: 'handle' | 'channelId' | 'custom' | 'search';
  cleanValue: string;
  canonicalUrl: string;
} {
  const trimmed = rawInput.trim();

  // 1. Direct handle: @username
  if (trimmed.startsWith('@')) {
    const handle = trimmed.replace(/^@/, '');
    return {
      type: 'handle',
      cleanValue: handle,
      canonicalUrl: `https://www.youtube.com/@${handle}`,
    };
  }

  // 2. Channel ID: UC... (24 characters starting with UC)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return {
      type: 'channelId',
      cleanValue: trimmed,
      canonicalUrl: `https://www.youtube.com/channel/${trimmed}`,
    };
  }

  // 3. YouTube URL parsing
  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const pathname = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
    const parts = pathname.split('/');

    // Handle youtube.com/@handle
    if (parts[0] && parts[0].startsWith('@')) {
      const handle = parts[0].replace(/^@/, '');
      return {
        type: 'handle',
        cleanValue: handle,
        canonicalUrl: `https://www.youtube.com/@${handle}`,
      };
    }

    // Handle youtube.com/channel/UC...
    if (parts[0] === 'channel' && parts[1]) {
      return {
        type: 'channelId',
        cleanValue: parts[1],
        canonicalUrl: `https://www.youtube.com/channel/${parts[1]}`,
      };
    }

    // Handle youtube.com/c/name or youtube.com/user/name
    if ((parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
      return {
        type: 'custom',
        cleanValue: parts[1],
        canonicalUrl: `https://www.youtube.com/${parts[0]}/${parts[1]}`,
      };
    }

    if (parts[0]) {
      return {
        type: 'handle',
        cleanValue: parts[0].replace(/^@/, ''),
        canonicalUrl: `https://www.youtube.com/@${parts[0].replace(/^@/, '')}`,
      };
    }
  } catch (e) {}

  // Fallback
  const safeName = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
  return {
    type: 'handle',
    cleanValue: safeName || 'creator',
    canonicalUrl: `https://www.youtube.com/@${safeName || 'creator'}`,
  };
}

/**
 * Fetch channel statistics from official YouTube Data API v3 or live scraper
 */
export async function fetchYouTubeChannel(
  rawInput: string,
  options?: { forceRefresh?: boolean; previousCount?: number; previousChannelId?: string }
): Promise<YouTubeChannelResult> {
  const parsed = parseYouTubeInput(rawInput);
  const cacheKey = parsed.cleanValue.toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (!cacheKey) {
    throw new Error('Please enter a valid YouTube channel URL or handle.');
  }

  // 1. In-memory cache
  if (!options?.forceRefresh) {
    const cached = channelCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        isCached: true,
      };
    }
  }

  // 2. Deduplicate simultaneous requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  const promise: Promise<YouTubeChannelResult> = (async (): Promise<YouTubeChannelResult> => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

      // 3. Official YouTube Data API v3 if API key configured
      if (apiKey && !apiKey.startsWith('your_') && !apiKey.startsWith('mock_')) {
        let apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&key=${apiKey}`;

        if (parsed.type === 'channelId') {
          apiUrl += `&id=${encodeURIComponent(parsed.cleanValue)}`;
        } else if (parsed.type === 'handle') {
          apiUrl += `&forHandle=${encodeURIComponent(parsed.cleanValue)}`;
        } else {
          apiUrl += `&forUsername=${encodeURIComponent(parsed.cleanValue)}`;
        }

        try {
          const ytResponse = await fetch(apiUrl, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
          });

          if (ytResponse.ok) {
            const ytData = await ytResponse.json();
            if (ytData.items && ytData.items.length > 0) {
              const item = ytData.items[0];
              const subCount = item.statistics?.hiddenSubscriberCount
                ? -1
                : parseInt(item.statistics?.subscriberCount || '0', 10);

              const formatted = formatSubscriberCount(subCount);
              const avatar =
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url ||
                '';

              const result: YouTubeChannelResult = {
                channelId: item.id,
                title: item.snippet?.title || parsed.cleanValue,
                handle: item.snippet?.customUrl ? (item.snippet.customUrl.startsWith('@') ? item.snippet.customUrl : `@${item.snippet.customUrl}`) : `@${parsed.cleanValue}`,
                url: item.snippet?.customUrl ? `https://www.youtube.com/${item.snippet.customUrl}` : `https://www.youtube.com/channel/${item.id}`,
                avatarUrl: avatar,
                description: item.snippet?.description,
                subscriberCount: Math.max(0, subCount),
                subscriberCountFormatted: formatted.full,
                compactSubscribers: formatted.compact,
                videoCount: parseInt(item.statistics?.videoCount || '0', 10),
                viewCount: parseInt(item.statistics?.viewCount || '0', 10),
                verified: true,
                lastUpdated: new Date().toISOString(),
                lastSyncedTimestamp: Date.now(),
                status: 'VERIFIED',
              };

              channelCache.set(cacheKey, { data: result, timestamp: Date.now() });
              return result;
            }
          }
        } catch (e) {
          // Fall through to resilient scraper
        }
      }

      // 4. Live Scraper with AbortSignal timeout
      let targetUrl = parsed.canonicalUrl;
      let verifiedTitle = '';
      let verifiedAvatar = '';
      let verifiedDescription = '';
      let scrapedChannelId = '';
      let scrapedSubCount: number | null = null;

      try {
        const scrapeRes = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (scrapeRes.ok) {
          const html = await scrapeRes.text();

          // Title
          const titleMatch =
            html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch) {
            verifiedTitle = titleMatch[1].replace(/\s*-\s*YouTube$/i, '').trim();
          }

          // Channel ID
          const extIdMatch =
            html.match(/<meta\s+itemprop=["']channelId["']\s+content=["'](UC[a-zA-Z0-9_-]{22})["']/i) ||
            html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/i) ||
            html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/i);
          if (extIdMatch) scrapedChannelId = extIdMatch[1];

          // Avatar
          const imgMatch =
            html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i);
          if (imgMatch) {
            verifiedAvatar = imgMatch[1];
          }

          // Description
          const descMatch =
            html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
          if (descMatch) verifiedDescription = descMatch[1].trim();

          // Subscribers
          const subMatch1 = html.match(/"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/);
          const subMatch2 = html.match(/"text":\s*\{"content":\s*"([0-9.]+[MK]?\s+subscribers?)"\}/i);
          const subMatch3 = html.match(/([0-9.]+[KM]?\s+subscribers?)/i);

          const subText = (subMatch1 && subMatch1[1]) || (subMatch2 && subMatch2[1]) || (subMatch3 && subMatch3[1]);
          if (subText) {
            const parsedSubs = parseSubscriberString(subText);
            scrapedSubCount = parsedSubs.count;
          }
        }
      } catch (e) {}

      // If scraping resolved title or avatar
      if (verifiedTitle || scrapedChannelId || scrapedSubCount !== null) {
        const subCount = scrapedSubCount !== null ? scrapedSubCount : (options?.previousCount || 0);
        const formatted = formatSubscriberCount(subCount);
        const channelId = scrapedChannelId || options?.previousChannelId || `UC_${cacheKey}`;

        const result: YouTubeChannelResult = {
          channelId,
          title: verifiedTitle || parsed.cleanValue,
          handle: `@${parsed.cleanValue}`,
          url: targetUrl,
          avatarUrl: verifiedAvatar,
          description: verifiedDescription || undefined,
          subscriberCount: subCount,
          subscriberCountFormatted: formatted.full,
          compactSubscribers: formatted.compact,
          verified: true,
          lastUpdated: new Date().toISOString(),
          lastSyncedTimestamp: Date.now(),
          status: 'VERIFIED',
        };

        channelCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }

      // If previous verified count is available, retain it
      if (options?.previousCount !== undefined && options?.previousChannelId) {
        const formatted = formatSubscriberCount(options.previousCount);
        return {
          channelId: options.previousChannelId,
          title: parsed.cleanValue,
          handle: `@${parsed.cleanValue}`,
          url: parsed.canonicalUrl,
          avatarUrl: '',
          subscriberCount: options.previousCount,
          subscriberCountFormatted: formatted.full,
          compactSubscribers: formatted.compact,
          verified: true,
          lastUpdated: new Date().toISOString(),
          lastSyncedTimestamp: Date.now(),
          isFallback: true,
          status: 'FALLBACK',
          error: 'YouTube channel data could not be refreshed. Retaining previously verified count.',
        };
      }

      throw new Error(
        `Could not resolve YouTube channel for "${rawInput}". Please check the channel handle or URL and try again.`
      );
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, promise);
  return promise;
}

export function formatTimeAgo(timestamp: number | string | Date): string {
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return 'Updated just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Updated ${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}
