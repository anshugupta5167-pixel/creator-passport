import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeChannel } from '@/lib/youtube';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, passportId, channelId } = body;

    if (!url && !channelId) {
      return NextResponse.json(
        { error: 'YouTube channel URL or handle is required' },
        { status: 400 }
      );
    }

    const input = url || channelId;
    let existingCreator = passportId ? getCreatorByIdDB(passportId) : null;

    const previousCount = existingCreator?.connections.youtube?.rawCount;
    const previousChannelId = existingCreator?.connections.youtube?.channelId || channelId;

    const channelResult = await fetchYouTubeChannel(input, {
      previousCount,
      previousChannelId,
    });

    // If passportId provided, persist to creator's record in DB
    if (existingCreator) {
      existingCreator.connections = existingCreator.connections || {};
      existingCreator.connections.youtube = {
        platform: 'YOUTUBE',
        connected: true,
        username: channelResult.handle.replace(/^@/, ''),
        metricLabel: 'subscribers',
        metricValue: channelResult.subscriberCountFormatted,
        verified: true,
        profileUrl: channelResult.url,
        channelId: channelResult.channelId,
        rawCount: channelResult.subscriberCount,
        lastSynced: channelResult.lastUpdated,
        lastSyncedTimestamp: channelResult.lastSyncedTimestamp,
        syncStatus: channelResult.status,
      };

      await addCreatorDB(existingCreator);
    }

    return NextResponse.json({
      success: true,
      channel: channelResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to detect YouTube channel' },
      { status: 400 }
    );
  }
}
