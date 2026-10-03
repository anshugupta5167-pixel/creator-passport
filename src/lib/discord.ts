// Official Discord REST API v10 Integration & Guild Member Count Synchronization Service
// Implements invite parsing, official API querying, rate-limit caching, and guild ID persistence

export interface DiscordServerResult {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  inviteCode: string;
  inviteUrl: string;
  memberCount: number;
  memberCountFormatted: string; // e.g. "24,582 Members"
  compactMembers: string; // e.g. "24.6K"
  presenceCount?: number;
  verified: boolean;
  features: string[];
  lastUpdated: string;
  lastSyncedTimestamp: number;
  isCached?: boolean;
  isFallback?: boolean;
  status: 'VERIFIED' | 'SYNCING' | 'FALLBACK' | 'ERROR';
  error?: string;
}

interface CacheEntry {
  data: DiscordServerResult;
  timestamp: number;
}

const discordCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const pendingDiscordRequests = new Map<string, Promise<DiscordServerResult>>();

export function formatMemberCount(count: number): { full: string; compact: string } {
  if (isNaN(count) || count < 0) {
    return { full: '0 Members', compact: '0' };
  }

  const full = `${count.toLocaleString('en-US')} Members`;

  let compact: string;
  if (count >= 1_000_000) {
    compact = `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (count >= 1_000) {
    compact = `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    compact = count.toString();
  }

  return { full, compact };
}

export function parseDiscordInvite(input: string): {
  inviteCode: string;
  canonicalUrl: string;
} {
  const trimmed = input.trim();

  // A plain invite code is also accepted; don't mistake it for a hostname.
  if (!trimmed.includes('.') && !trimmed.includes('/') && !trimmed.includes(':')) {
    if (!/^[a-z0-9_-]{2,128}$/i.test(trimmed)) {
      throw new Error('Please enter a valid Discord invite code or invite link.');
    }
    return { inviteCode: trimmed, canonicalUrl: `https://discord.gg/${trimmed}` };
  }

  try {
    const urlObj = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const host = urlObj.hostname.toLowerCase();
    if (!['discord.gg', 'www.discord.gg', 'discord.com', 'www.discord.com', 'discordapp.com', 'www.discordapp.com'].includes(host)) {
      throw new Error('Please enter a Discord invite link such as https://discord.gg/your-invite.');
    }
    const pathname = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
    const parts = pathname.split('/');
    const code = parts[parts.length - 1];
    if (code) {
      return {
        inviteCode: code,
        canonicalUrl: `https://discord.gg/${code}`,
      };
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Please enter a Discord invite')) throw e;
  }

  const cleanCode = trimmed
    .replace(/^https?:\/\/(www\.)?discord(\.gg|\.com\/invite)\/?/i, '')
    .replace(/\/.*$/, '')
    .trim();

  if (!/^[a-z0-9_-]{2,128}$/i.test(cleanCode)) {
    throw new Error('Please enter a valid Discord invite code or invite link.');
  }

  return {
    inviteCode: cleanCode,
    canonicalUrl: cleanCode ? `https://discord.gg/${cleanCode}` : 'https://discord.com',
  };
}

/**
 * Fetch real Discord server statistics from official Discord REST API v10
 */
export async function fetchDiscordServer(
  rawInput: string,
  options?: { forceRefresh?: boolean; previousCount?: number; previousGuildId?: string }
): Promise<DiscordServerResult> {
  const { inviteCode, canonicalUrl } = parseDiscordInvite(rawInput);
  const cacheKey = inviteCode.toLowerCase();

  if (!inviteCode) {
    throw new Error('Please enter a valid Discord server invite link or code.');
  }

  // 1. In-memory cache
  if (!options?.forceRefresh) {
    const cached = discordCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        isCached: true,
      };
    }
  }

  // 2. Deduplication
  if (pendingDiscordRequests.has(cacheKey)) {
    return pendingDiscordRequests.get(cacheKey)!;
  }

  const promise: Promise<DiscordServerResult> = (async (): Promise<DiscordServerResult> => {
    try {
      const discordApiUrl = `https://discord.com/api/v10/invites/${encodeURIComponent(inviteCode)}?with_counts=true`;

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'CreatorHQ-Verification/2.0 (+https://creatorhq.fun)',
      };

      if (process.env.DISCORD_BOT_TOKEN && !process.env.DISCORD_BOT_TOKEN.startsWith('mock_')) {
        headers['Authorization'] = `Bot ${process.env.DISCORD_BOT_TOKEN}`;
      }

      const res = await fetch(discordApiUrl, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 429) {
        if (options?.previousCount !== undefined && options?.previousGuildId) {
          const formatted = formatMemberCount(options.previousCount);
          return {
            guildId: options.previousGuildId,
            guildName: 'Discord Community',
            guildIcon: null,
            inviteCode,
            inviteUrl: canonicalUrl,
            memberCount: options.previousCount,
            memberCountFormatted: formatted.full,
            compactMembers: formatted.compact,
            verified: true,
            features: ['COMMUNITY'],
            lastUpdated: new Date().toISOString(),
            lastSyncedTimestamp: Date.now(),
            isFallback: true,
            status: 'FALLBACK',
            error: 'Discord API rate limited. Showing previous verified count.',
          };
        }
        throw new Error('Discord API is temporarily rate limited. Please try again shortly.');
      }

      if (res.status === 404) {
        throw new Error(
          `Discord server invite "${inviteCode}" not found or expired. Please provide a valid, active server invite link.`
        );
      }

      if (!res.ok) {
        throw new Error(`Discord API returned status ${res.status}. Could not resolve server.`);
      }

      const json = await res.json();
      if (!json.guild) {
        throw new Error(`Invite does not point to a valid Discord guild.`);
      }

      const guild = json.guild;
      const countValue = json.approximate_member_count;
      if (!Number.isInteger(countValue) || countValue < 0) {
        throw new Error('Discord resolved the invite but did not return a member count. Use an active server invite with public preview enabled.');
      }
      const memberCount = countValue;
      const presenceCount = json.approximate_presence_count || 0;
      const iconUrl = guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : null;

      const formatted = formatMemberCount(memberCount);
      const isVerified = true;

      const result: DiscordServerResult = {
        guildId: guild.id,
        guildName: guild.name || 'Discord Community',
        guildIcon: iconUrl,
        inviteCode,
        inviteUrl: canonicalUrl,
        memberCount,
        memberCountFormatted: formatted.full,
        compactMembers: formatted.compact,
        presenceCount,
        verified: isVerified,
        features: guild.features || [],
        lastUpdated: new Date().toISOString(),
        lastSyncedTimestamp: Date.now(),
        status: 'VERIFIED',
      };

      discordCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      pendingDiscordRequests.delete(cacheKey);
    }
  })();

  pendingDiscordRequests.set(cacheKey, promise);
  return promise;
}
