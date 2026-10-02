import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramProfile } from '@/lib/instagram';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, handle, passportId } = body;

    const input = url || handle;
    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: 'Instagram profile URL or handle is required' },
        { status: 400 }
      );
    }

    let existingCreator = passportId ? getCreatorByIdDB(passportId) : null;
    const previousCount = existingCreator?.connections?.instagram?.rawCount;

    const profile = await fetchInstagramProfile(input.trim(), {
      previousCount,
    });

    // If passportId provided, persist to creator's record in DB
    if (existingCreator) {
      existingCreator.connections = existingCreator.connections || {};
      existingCreator.connections.instagram = {
        platform: 'INSTAGRAM',
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
      { error: err.message || 'Failed to detect Instagram profile' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('url') || searchParams.get('handle') || searchParams.get('username') || searchParams.get('q');
    const passportId = searchParams.get('passportId');

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: 'Instagram profile URL or handle is required' },
        { status: 400 }
      );
    }

    let existingCreator = passportId ? getCreatorByIdDB(passportId) : null;
    const previousCount = existingCreator?.connections?.instagram?.rawCount;

    const profile = await fetchInstagramProfile(input.trim(), {
      previousCount,
    });

    if (existingCreator) {
      existingCreator.connections = existingCreator.connections || {};
      existingCreator.connections.instagram = {
        platform: 'INSTAGRAM',
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
      { error: err.message || 'Failed to detect Instagram profile' },
      { status: 400 }
    );
  }
}

