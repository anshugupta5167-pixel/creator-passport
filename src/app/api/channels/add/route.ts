import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeChannel } from '@/lib/youtube';
import { getCreatorByUserIdDB, addCreatorDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { ChannelItem } from '@/lib/types';
import { resolveYouTubeUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in to add channels to your account.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'YouTube channel URL or handle is required' }, { status: 400 });
    }

    const cleanInput = url.trim();

    // 1. Detect channel via YouTube integration with timeout & error handling
    const yt = await fetchYouTubeChannel(cleanInput);
    if (!yt || !yt.channelId) {
      return NextResponse.json(
        { error: 'DETECT_FAILED', message: 'Could not resolve a valid YouTube channel from the provided link.' },
        { status: 400 }
      );
    }

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

    // 2. Fetch authenticated user's card
    let creator = auth.creator || getCreatorByUserIdDB(auth.user.id);
    if (!creator) {
      // User hasn't finished full card, return the channel item so frontend can store in draft state
      return NextResponse.json({
        success: true,
        channel: newChannel,
        moreChannels: [newChannel],
        message: 'Channel detected successfully.',
      });
    }

    creator.moreChannels = creator.moreChannels || [];

    // Duplicate prevention
    const existingIndex = creator.moreChannels.findIndex(
      (c) =>
        (c.id && c.id === newChannel.id) ||
        (c.handle && c.handle.toLowerCase() === newChannel.handle.toLowerCase())
    );

    if (existingIndex >= 0) {
      // Update existing entry
      creator.moreChannels[existingIndex] = newChannel;
    } else {
      creator.moreChannels.push(newChannel);
    }

    await addCreatorDB(creator);

    return NextResponse.json({
      success: true,
      channel: newChannel,
      moreChannels: creator.moreChannels,
      message: `Channel "${newChannel.name}" linked successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'ADD_CHANNEL_ERROR', message: err.message || 'Failed to add YouTube channel' },
      { status: 400 }
    );
  }
}
