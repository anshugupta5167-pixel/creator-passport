import { resolveRealYouTubeChannel } from '../../src/lib/detection';

export default async function handler(req: any, res: any) {
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

  const bodyData = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const inputUrl = (bodyData.url || bodyData.channelUrl || '').trim();

  if (!inputUrl) {
    return res.status(400).json({ error: 'YouTube channel URL is required' });
  }

  try {
    const ytData = await resolveRealYouTubeChannel(inputUrl);
    const channelItem = {
      id: ytData.channelId,
      channelId: ytData.channelId,
      name: ytData.title,
      handle: ytData.handle,
      url: ytData.url,
      avatarUrl: ytData.avatarUrl,
      subscriberCount: ytData.subscriberCount,
      subscriberCountFormatted: ytData.subscriberCountFormatted,
      compactSubscribers: ytData.compactSubscribers,
      verified: true,
      lastSynced: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      channel: channelItem,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not verify YouTube channel' });
  }
}
