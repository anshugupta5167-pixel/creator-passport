import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeChannel } from '@/lib/youtube';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, passportId, channelId } = body;

    if (!url && !channelId) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'YouTube channel URL or handle is required' },
        { status: 400 }
      );
    }

    const input = (url || channelId).trim();
    const auth = await getAuthenticatedUser(request);

    let existingCreator = null;
    if (auth?.creator) {
      existingCreator = auth.creator;
    } else if (passportId) {
      const found = await getCreatorByIdDB(passportId);
      // ONLY allow updating if caller is the owner
      if (found && auth?.user.id === found.userId) {
        existingCreator = found;
      }
    }

    const previousCount = existingCreator?.connections.youtube?.rawCount;
    const previousChannelId = existingCreator?.connections.youtube?.channelId || channelId;

    const channelResult = await fetchYouTubeChannel(input, {
      previousCount,
      previousChannelId,
    });

    // If caller owns the creator card, persist update
    if (existingCreator && auth && (auth.user.id === existingCreator.userId || auth.user.role === 'ADMIN')) {
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
        avatarUrl: channelResult.avatarUrl,
        lastSynced: channelResult.lastUpdated,
        lastSyncedTimestamp: channelResult.lastSyncedTimestamp,
        syncStatus: channelResult.status,
      };

      // Also update creator avatar if not customized
      if (!existingCreator.avatarUrl && channelResult.avatarUrl) {
        existingCreator.avatarUrl = channelResult.avatarUrl;
      }

      await addCreatorDB(existingCreator);
    }

    return NextResponse.json({
      success: true,
      channel: channelResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DETECT_FAILED', message: err.message || 'Failed to detect YouTube channel' },
      { status: 400 }
    );
  }
}
