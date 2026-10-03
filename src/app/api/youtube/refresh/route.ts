import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeChannel } from '@/lib/youtube';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}

async function handleRefresh(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let passportId = searchParams.get('passportId');
    let channelId = searchParams.get('channelId');
    let url = searchParams.get('url');

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        passportId = passportId || body.passportId;
        channelId = channelId || body.channelId;
        url = url || body.url;
      } catch (e) {}
    }

    const creator = passportId ? await getCreatorByIdDB(passportId) : null;
    const target = url || channelId || creator?.connections.youtube?.profileUrl || creator?.connections.youtube?.username;

    if (!target) {
      return NextResponse.json({ error: 'No channel identifier provided' }, { status: 400 });
    }

    const previousCount = creator?.connections.youtube?.rawCount;
    const previousChannelId = creator?.connections.youtube?.channelId || channelId || undefined;

    const channelResult = await fetchYouTubeChannel(target, {
      forceRefresh: true,
      previousCount,
      previousChannelId,
    });

    if (creator) {
      creator.connections = creator.connections || {};
      creator.connections.youtube = {
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

      await addCreatorDB(creator);
    }

    return NextResponse.json({
      success: true,
      channel: channelResult,
      updatedAt: channelResult.lastUpdated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to refresh YouTube subscriber count' },
      { status: 500 }
    );
  }
}
