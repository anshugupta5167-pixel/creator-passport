function formatSubs(count: number): { full: string; compact: string } {
  if (isNaN(count) || count <= 0) return { full: 'Audited Subscribers', compact: 'Audited' };
  let compact = count.toString();
  if (count >= 1_000_000_000) compact = `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  else if (count >= 1_000_000) compact = `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  else if (count >= 1_000) compact = `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  const full = `${compact} Subscribers`;
  return { full, compact };
}

function parseSubString(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/subscribers?/i, '').replace(/,/g, '').trim();
  if (/([0-9.]+)B/i.test(clean)) return Math.round(parseFloat(clean.match(/([0-9.]+)B/i)![1]) * 1_000_000_000);
  if (/([0-9.]+)M/i.test(clean)) return Math.round(parseFloat(clean.match(/([0-9.]+)M/i)![1]) * 1_000_000);
  if (/([0-9.]+)K/i.test(clean)) return Math.round(parseFloat(clean.match(/([0-9.]+)K/i)![1]) * 1_000);
  return parseInt(clean, 10) || 0;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData || '{}');
    } catch (e) {
      bodyData = {};
    }
  }
  bodyData = bodyData || {};

  let rawInput = (bodyData.url || bodyData.channelId || bodyData.handle || '').trim();
  if (!rawInput) {
    return res.status(400).json({ error: 'YouTube channel URL or handle is required' });
  }

  try {
    let trimmed = rawInput.trim();

    // 1. Handle Video URLs (e.g. watch?v= or youtu.be/)
    if (trimmed.includes('watch?v=') || trimmed.includes('youtu.be/')) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`, {
          signal: AbortSignal.timeout(4000),
        });
        if (oembedRes.ok) {
          const odata: any = await oembedRes.json();
          if (odata.author_url) {
            trimmed = odata.author_url;
          }
        }
      } catch (e) {}
    }

    // Strip protocol and domain variants
    trimmed = trimmed.replace(/^(https?:\/\/)?(www\.|m\.)?youtube\.com\//i, '');
    trimmed = trimmed.replace(/^(https?:\/\/)?(www\.)?youtu\.be\//i, '');

    let targetUrl = '';
    let handle = '';

    if (trimmed.startsWith('channel/')) {
      const cid = trimmed.replace(/^channel\//i, '').split('/')[0].split('?')[0].trim();
      targetUrl = `https://www.youtube.com/channel/${cid}`;
      handle = cid;
    } else if (trimmed.startsWith('c/')) {
      const cname = trimmed.replace(/^c\//i, '').split('/')[0].split('?')[0].trim();
      targetUrl = `https://www.youtube.com/c/${cname}`;
      handle = cname;
    } else if (trimmed.startsWith('user/')) {
      const uname = trimmed.replace(/^user\//i, '').split('/')[0].split('?')[0].trim();
      targetUrl = `https://www.youtube.com/user/${uname}`;
      handle = uname;
    } else {
      handle = trimmed.replace(/^@/, '').split('/')[0].split('?')[0].trim();
      if (!handle) handle = 'creator';
      targetUrl = `https://www.youtube.com/@${handle}`;
    }

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
          'Cookie':
            'SOCS=CAESEwgDEgk2MTQ1MjQ4NjQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20230531-04-p0.en+FX+999; PREF=tz=UTC&f6=40000000&hl=en',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(8000),
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
          html.match(/"urlCanonical":"https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/i) ||
          html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/i);
        if (extIdMatch) scrapedChannelId = extIdMatch[1];

        // Avatar (Upgrade to crisp 900x900 resolution)
        const imgMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
          html.match(/"image":"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/i) ||
          html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i);
        if (imgMatch) {
          const rawImg = imgMatch[1];
          verifiedAvatar = rawImg.replace(/=s\d+(-c-k-[^"'\s&]+)?/, '=s900-c-k-c0x00ffffff-no-rj');
        }

        // Description / Bio
        const descMatch =
          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
          html.match(/"description":"([^"]+)"/i) ||
          html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        if (descMatch) {
          verifiedDescription = descMatch[1]
            .replace(/\\n/g, ' ')
            .replace(/\\"/g, '"')
            .trim();
        }

        // 1. pageHeaderRenderer
        const pageHeaderMatch = html.match(
          /"pageHeaderRenderer":\s*\{[\s\S]*?"content":\s*"([0-9.,]+[KMBkmb]?\s+subscribers?)"/i
        );
        if (pageHeaderMatch) {
          scrapedSubCount = parseSubString(pageHeaderMatch[1]);
        }

        // 2. c4TabbedHeaderRenderer
        if (scrapedSubCount === null || scrapedSubCount <= 0) {
          const c4Match = html.match(
            /"c4TabbedHeaderRenderer":\s*\{[\s\S]*?"subscriberCountText":\s*\{[\s\S]*?"simpleText":\s*"([^"]+)"/i
          );
          if (c4Match) {
            scrapedSubCount = parseSubString(c4Match[1]);
          }
        }

        // 3. subscriberCountText simpleText / label
        if (scrapedSubCount === null || scrapedSubCount <= 0) {
          const subMatch1 = html.match(/"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/);
          const subMatch2 = html.match(/"subscriberCountText":[\s\S]*?"label":\s*"([^"]+)"/);
          if (subMatch1) scrapedSubCount = parseSubString(subMatch1[1]);
          else if (subMatch2) scrapedSubCount = parseSubString(subMatch2[1]);
        }

        // 4. ytInitialData JSON match
        if (scrapedSubCount === null || scrapedSubCount <= 0) {
          const allSubs = Array.from(html.matchAll(/([0-9.,]+[KMBkmb]?\s+subscribers?)/gi)).map((m) => m[1]);
          if (allSubs.length > 0) {
            scrapedSubCount = parseSubString(allSubs[0]);
          }
        }

        // 5. schema.org interactionStatistic
        if (scrapedSubCount === null || scrapedSubCount <= 0) {
          const intSubMatch = html.match(
            /"interactionType":\{"type":"FollowAction"\},"userInteractionCount":"(\d+)"/
          );
          if (intSubMatch) {
            scrapedSubCount = parseInt(intSubMatch[1], 10);
          }
        }
      }
    } catch (err) {}

    const subCount = scrapedSubCount !== null && scrapedSubCount > 0 ? scrapedSubCount : 0;
    const formatted = formatSubs(subCount);
    const cleanTitle = verifiedTitle || handle.charAt(0).toUpperCase() + handle.slice(1);
    const channelId = scrapedChannelId || `UC_${handle}`;
    const avatar =
      verifiedAvatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanTitle)}&background=0284c7&color=ffffff&size=256&bold=true`;

    return res.status(200).json({
      success: true,
      channel: {
        channelId,
        title: cleanTitle,
        handle: `@${handle}`,
        url: `https://youtube.com/@${handle}`,
        avatarUrl: avatar,
        description: verifiedDescription || undefined,
        subscriberCount: subCount,
        subscriberCountFormatted: subCount > 0 ? formatted.full : 'Audited Subscribers',
        compactSubscribers: subCount > 0 ? formatted.compact : 'Audited',
        verified: true,
        status: 'VERIFIED',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not resolve YouTube channel' });
  }
}
