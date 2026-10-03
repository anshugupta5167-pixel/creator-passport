// CreatorHQ Live Cloud Database Store (Persistent Across Vercel Serverless Lambdas & Refreshes)
import { CreatorProfile, VerificationSubmission } from './types';

const GIST_ID = '7ae221f82e230d2955ef1048505941b4';

function getAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_DATA_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface CacheState {
  creators: CreatorProfile[] | null;
  verifications: VerificationSubmission[] | null;
  lastFetched: number;
}

const cache: CacheState = {
  creators: null,
  verifications: null,
  lastFetched: 0,
};

const CACHE_TTL_MS = 3000; // 3 seconds TTL for ultra-fast response with real-time freshness

/**
 * Fetch latest creators and verifications from Cloud Gist
 */
export async function fetchFromCloudStore(): Promise<{
  creators: CreatorProfile[];
  verifications: VerificationSubmission[];
}> {
  const now = Date.now();
  if (cache.creators && cache.verifications && now - cache.lastFetched < CACHE_TTL_MS) {
    return {
      creators: cache.creators,
      verifications: cache.verifications,
    };
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'User-Agent': 'CreatorHQ-Network/2.0',
        ...getAuthHeaders(),
        'Accept': 'application/vnd.github.v3+json',
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4500),
    });

    if (res.ok) {
      const data = await res.json();
      const creatorsFile = data.files?.['creators.json']?.content;
      const verificationsFile = data.files?.['verifications.json']?.content;

      if (creatorsFile) {
        try {
          const parsed = JSON.parse(creatorsFile);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cache.creators = parsed;
          }
        } catch (e) {}
      }

      if (verificationsFile) {
        try {
          const parsedV = JSON.parse(verificationsFile);
          if (Array.isArray(parsedV)) {
            cache.verifications = parsedV;
          }
        } catch (e) {}
      }

      cache.lastFetched = now;
    }
  } catch (err) {
    // Non-blocking fallback
  }

  return {
    creators: cache.creators || [],
    verifications: cache.verifications || [],
  };
}

/**
 * Update cloud store creators list in background
 */
export async function pushCreatorsToCloudStore(creators: CreatorProfile[]): Promise<boolean> {
  if (!process.env.GITHUB_DATA_TOKEN) return false;
  cache.creators = creators;
  cache.lastFetched = Date.now();

  try {
    const payload = JSON.stringify({
      description: 'CreatorHQ Cloud Database - Real-Time Synced',
      files: {
        'creators.json': {
          content: JSON.stringify(creators, null, 2),
        },
      },
    });

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'User-Agent': 'CreatorHQ-Network/2.0',
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: payload,
      signal: AbortSignal.timeout(5000),
    });

    return res.ok;
  } catch (err) {
    console.warn('[CloudStore] Notice updating cloud creators:', err);
    return false;
  }
}

/**
 * Update cloud store verifications list in background
 */
export async function pushVerificationsToCloudStore(verifications: VerificationSubmission[]): Promise<boolean> {
  if (!process.env.GITHUB_DATA_TOKEN) return false;
  cache.verifications = verifications;
  cache.lastFetched = Date.now();

  try {
    const payload = JSON.stringify({
      description: 'CreatorHQ Cloud Database - Real-Time Synced',
      files: {
        'verifications.json': {
          content: JSON.stringify(verifications, null, 2),
        },
      },
    });

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'User-Agent': 'CreatorHQ-Network/2.0',
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: payload,
      signal: AbortSignal.timeout(5000),
    });

    return res.ok;
  } catch (err) {
    console.warn('[CloudStore] Notice updating cloud verifications:', err);
    return false;
  }
}
