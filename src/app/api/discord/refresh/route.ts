import { NextRequest, NextResponse } from 'next/server';
import { fetchDiscordServer } from '@/lib/discord';
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
    let guildId = searchParams.get('guildId');
    let inviteUrl = searchParams.get('inviteUrl');

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        passportId = passportId || body.passportId;
        guildId = guildId || body.guildId;
        inviteUrl = inviteUrl || body.inviteUrl;
      } catch (e) {}
    }

    const creator = passportId ? await getCreatorByIdDB(passportId) : null;
    const target = inviteUrl || guildId || creator?.connections.discord?.profileUrl || creator?.connections.discord?.guildId || 'example';

    const previousCount = creator?.connections.discord?.rawCount;
    const previousGuildId = creator?.connections.discord?.guildId || guildId || undefined;

    const serverResult = await fetchDiscordServer(target, {
      forceRefresh: true,
      previousCount,
      previousGuildId,
    });

    if (creator) {
      creator.connections = creator.connections || {};
      creator.connections.discord = {
        platform: 'DISCORD',
        connected: true,
        username: serverResult.guildName,
        metricLabel: 'members',
        metricValue: serverResult.memberCountFormatted,
        verified: true,
        profileUrl: serverResult.inviteUrl,
        guildId: serverResult.guildId,
        guildName: serverResult.guildName,
        guildIcon: serverResult.guildIcon || undefined,
        rawCount: serverResult.memberCount,
        approximatePresenceCount: serverResult.presenceCount,
        lastSynced: serverResult.lastUpdated,
        lastSyncedTimestamp: serverResult.lastSyncedTimestamp,
        syncStatus: serverResult.status,
      };

      await addCreatorDB(creator);
    }

    return NextResponse.json({
      success: true,
      server: serverResult,
      updatedAt: serverResult.lastUpdated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to refresh Discord member count' },
      { status: 500 }
    );
  }
}
