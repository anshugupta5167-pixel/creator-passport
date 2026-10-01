import { NextRequest, NextResponse } from 'next/server';
import { fetchDiscordServer } from '@/lib/discord';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteUrl, passportId, guildId } = body;

    if (!inviteUrl && !guildId) {
      return NextResponse.json(
        { error: 'Discord invite link or code is required' },
        { status: 400 }
      );
    }

    const input = inviteUrl || guildId;
    let existingCreator = passportId ? getCreatorByIdDB(passportId) : null;

    const previousCount = existingCreator?.connections.discord?.rawCount;
    const previousGuildId = existingCreator?.connections.discord?.guildId || guildId;

    const serverResult = await fetchDiscordServer(input, {
      previousCount,
      previousGuildId,
    });

    // If passportId provided, persist to creator's record in DB
    if (existingCreator) {
      existingCreator.connections = existingCreator.connections || {};
      existingCreator.connections.discord = {
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

      await addCreatorDB(existingCreator);
    }

    return NextResponse.json({
      success: true,
      server: serverResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to detect Discord server' },
      { status: 400 }
    );
  }
}
