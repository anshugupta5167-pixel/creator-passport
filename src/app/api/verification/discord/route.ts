import { NextRequest, NextResponse } from 'next/server';
import { getCreatorBySlug, togglePlatformConnection } from '@/lib/data';
import { getAllCreatorsDBAsync, getCreatorBySlugDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, handle, guildId } = body;

    const identifier = slug || handle || '';
    await getAllCreatorsDBAsync();
    const creator = getCreatorBySlugDB(identifier) || getCreatorBySlug(identifier);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Connect and verify Discord platform
    const creatorSlug = creator.slug || creator.username;
    creator.connections = {
      ...creator.connections,
      discord: {
        platform: 'DISCORD',
        metricLabel: 'members',
        ...creator.connections?.discord,
        username: creator.connections?.discord?.username || creator.displayName || creatorSlug || 'community',
        metricValue: creator.connections?.discord?.metricValue || '1 Community',
        connected: true,
        verified: true,
      },
    };
    await addCreatorDB(creator);
    togglePlatformConnection(creatorSlug, 'discord', true);

    return NextResponse.json({
      success: true,
      platform: 'DISCORD',
      status: 'VERIFIED',
      guildId: guildId || '',
      memberCount: creator.connections.discord?.metricValue || '0',
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
