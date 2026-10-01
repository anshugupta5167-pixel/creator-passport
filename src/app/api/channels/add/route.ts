import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeChannel } from '@/lib/youtube';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';
import { ChannelItem } from '@/lib/types';

import { resolveYouTubeUrl } from '@/lib/urls';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passportId, url } = body;

    if (!url) {
      return NextResponse.json({ error: 'YouTube channel URL is required' }, { status: 400 });
    }

    const creator = passportId ? getCreatorByIdDB(passportId) : null;
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Detect channel via official YouTube Data API or live scraper
    const yt = await fetchYouTubeChannel(url);
    const cleanUrl = resolveYouTubeUrl(yt.url, yt.handle, yt.channelId, yt.title);

    const newChannel: ChannelItem = {
      id: yt.channelId,
      name: yt.title,
      handle: yt.handle,
      url: cleanUrl,
      subscribers: `${yt.compactSubscribers} subscribers`,
      numericSubscribers: yt.subscriberCount,
      verified: true,
      lastSynced: yt.lastUpdated,
      avatarUrl: yt.avatarUrl,
    };

    creator.moreChannels = creator.moreChannels || [];
    
    // Remove if already exists to update
    const existingIndex = creator.moreChannels.findIndex(
      (c) => c.id === newChannel.id || c.handle.toLowerCase() === newChannel.handle.toLowerCase()
    );

    if (existingIndex >= 0) {
      creator.moreChannels[existingIndex] = newChannel;
    } else {
      creator.moreChannels.push(newChannel);
    }

    await addCreatorDB(creator);

    return NextResponse.json({
      success: true,
      channel: newChannel,
      moreChannels: creator.moreChannels,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to add YouTube channel' },
      { status: 400 }
    );
  }
}
