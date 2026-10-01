import { NextRequest, NextResponse } from 'next/server';
import { fetchXProfile } from '@/lib/x';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, handle, passportId } = body;

    const input = url || handle;
    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: 'X / Twitter profile URL or handle is required' },
        { status: 400 }
      );
    }

    let existingCreator = passportId ? getCreatorByIdDB(passportId) : null;
    const previousCount = existingCreator?.connections?.x?.rawCount;

    const profile = await fetchXProfile(input.trim(), {
      previousCount,
    });

    // If passportId provided, persist to creator's record in DB
    if (existingCreator) {
      existingCreator.connections = existingCreator.connections || {};
      existingCreator.connections.x = {
        platform: 'X',
        connected: true,
        username: profile.username,
        metricLabel: 'followers',
        metricValue: profile.compactFollowers.includes('Followers') ? profile.compactFollowers : `${profile.compactFollowers} Followers`,
        verified: true,
        profileUrl: profile.url,
        rawCount: profile.followersCount,
        lastSynced: profile.lastUpdated,
        lastSyncedTimestamp: profile.lastSyncedTimestamp,
        syncStatus: profile.status,
      };

      await addCreatorDB(existingCreator);
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to detect X / Twitter profile' },
      { status: 400 }
    );
  }
}
