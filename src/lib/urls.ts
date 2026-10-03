/**
 * Centralized URL Resolution and Sanitization Utility
 * Ensures that social links (especially YouTube and Discord) are always canonical,
 * valid HTTP/HTTPS URLs and NEVER resolve to bare `https://youtube.com/@` or `https://discord.gg`.
 */

export function getSafeAvatarUrl(url?: string | null, fallbackName: string = 'Creator'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=141414&color=ffffff&size=256&bold=true`;
  }
  const cleanUrl = url.trim();
  // If already proxied or base64 data URI
  if (cleanUrl.startsWith('/api/avatar-proxy') || cleanUrl.startsWith('data:image')) {
    return cleanUrl;
  }
  // If hosted on Google / YouTube user content (yt3.googleusercontent.com, yt3.ggpht.com, etc.)
  if (
    cleanUrl.includes('googleusercontent.com') ||
    cleanUrl.includes('ggpht.com') ||
    cleanUrl.includes('youtube.com')
  ) {
    return `/api/avatar-proxy?url=${encodeURIComponent(cleanUrl)}`;
  }
  return cleanUrl;
}

export function resolveYouTubeUrl(
  profileUrl?: string | null,
  username?: string | null,
  channelId?: string | null,
  fallbackHandle: string = ''
): string {
  // 1. If profileUrl is provided and is a valid specific URL
  if (profileUrl) {
    const trimmed = profileUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const clean = trimmed.replace(/\/$/, '');
      if (
        clean !== 'https://youtube.com/@' &&
        clean !== 'https://www.youtube.com/@' &&
        clean !== 'https://youtube.com' &&
        clean !== 'https://www.youtube.com' &&
        clean !== 'http://youtube.com' &&
        clean !== 'http://www.youtube.com' &&
        !clean.endsWith('/@')
      ) {
        return trimmed;
      }
    } else if (trimmed.startsWith('@') && trimmed.length > 1 && trimmed !== '@channel') {
      return `https://www.youtube.com/${trimmed}`;
    }
  }

  // 2. If channelId is an official YouTube channel ID (UC...)
  if (channelId && channelId.startsWith('UC') && channelId.length >= 10) {
    return `https://www.youtube.com/channel/${channelId}`;
  }

  // 3. If username is a meaningful handle
  const cleanUser = (username || '').replace(/^@/, '').trim();
  if (
    cleanUser &&
    cleanUser !== 'channel' &&
    cleanUser !== 'example' &&
    cleanUser !== 'null' &&
    cleanUser !== 'undefined'
  ) {
    return `https://www.youtube.com/@${cleanUser}`;
  }

  // 4. Fallback to fallbackHandle
  const cleanFallback = fallbackHandle.replace(/^@/, '').trim();
  if (cleanFallback && cleanFallback !== 'channel' && cleanFallback !== 'null') {
    return `https://www.youtube.com/@${cleanFallback}`;
  }

  return 'https://www.youtube.com';
}

export function resolveDiscordUrl(
  profileUrl?: string | null,
  usernameOrGuild?: string | null,
  guildId?: string | null,
  fallback: string = ''
): string {
  // 1. If profileUrl is provided and is a valid specific invite
  if (profileUrl) {
    const trimmed = profileUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const clean = trimmed.replace(/\/$/, '');
      if (
        clean !== 'https://discord.gg' &&
        clean !== 'https://discord.gg/' &&
        clean !== 'https://discord.com' &&
        clean !== 'https://discord.com/invite' &&
        clean !== 'http://discord.gg' &&
        !clean.endsWith('.gg') &&
        !clean.endsWith('.gg/')
      ) {
        return trimmed;
      }
    } else if (trimmed.length > 2 && !trimmed.includes(' ')) {
      return `https://discord.gg/${trimmed.replace(/^\//, '')}`;
    }
  }

  // 2. Derive canonical vanity or community link
  const clean = (usernameOrGuild || fallback || '').replace(/^@/, '').trim();
  if (
    clean &&
    clean !== 'community' &&
    clean !== 'Verified Guild' &&
    clean !== 'null' &&
    clean !== 'undefined'
  ) {
    return `https://discord.gg/${clean.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;
  }

  return 'https://discord.gg';
}

export function resolveInstagramUrl(
  profileUrl?: string | null,
  username?: string | null,
  fallback: string = ''
): string {
  if (profileUrl) {
    const trimmed = profileUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const clean = trimmed.replace(/\/$/, '');
      if (
        clean !== 'https://instagram.com' &&
        clean !== 'https://www.instagram.com' &&
        !clean.endsWith('instagram.com/@')
      ) {
        return trimmed;
      }
    } else if (trimmed.startsWith('@')) {
      return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
    }
  }

  const clean = (username || fallback || '').replace(/^@/, '').trim();
  if (clean && clean !== 'null' && clean !== 'undefined') {
    return `https://instagram.com/${clean}`;
  }

  return 'https://instagram.com';
}
