import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramProfile } from '@/lib/instagram';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, handle, passportId } = body;

    if (!url && !handle) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Instagram profile URL or handle is required' },
        { status: 400 }
      );
    }

    const input = (url || handle).trim();
    const auth = await getAuthenticatedUser(request);

    let existingCreator = null;
    if (auth?.creator) {
      existingCreator = auth.creator;
    } else if (passportId) {
      const found = getCreatorByIdDB(passportId);
      if (found && auth?.user.id === found.userId) {
        existingCreator = found;
      }
    }

    const previousCount = existingCreator?.connections.instagram?.rawCount;

    const profileResult = await fetchInstagramProfile(input, {
      previousCount,
    });

    if (existingCreator && auth && (auth.user.id === existingCreator.userId || auth.user.role === 'ADMIN')) {
      existingCreator.connections = existingCreator.connections || {};
      existingCreator.connections.instagram = {
        platform: 'INSTAGRAM',
        connected: true,
        username: profileResult.username,
        metricLabel: 'followers',
        metricValue: profileResult.followersFormatted,
        verified: true,
        profileUrl: profileResult.url,
        rawCount: profileResult.followersCount,
        lastSynced: profileResult.lastUpdated,
        lastSyncedTimestamp: profileResult.lastSyncedTimestamp,
        syncStatus: profileResult.status,
      };

      await addCreatorDB(existingCreator);
    }

    return NextResponse.json({
      success: true,
      profile: profileResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DETECT_FAILED', message: err.message || 'Failed to detect Instagram profile' },
      { status: 400 }
    );
  }
}
