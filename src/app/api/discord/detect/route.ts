import { NextRequest, NextResponse } from 'next/server';
import { fetchDiscordServer } from '@/lib/discord';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passportId, guildId } = body;
    const inviteUrl = body.inviteUrl || body.url;

    if (!inviteUrl && !guildId) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Discord invite link or server code is required' },
        { status: 400 }
      );
    }

    const input = String(inviteUrl || guildId).trim();
    const auth = await getAuthenticatedUser(request);

    let existingCreator = null;
    if (auth?.creator) {
      existingCreator = auth.creator;
    } else if (passportId) {
      const found = await getCreatorByIdDB(passportId);
      if (found && auth?.user.id === found.userId) {
        existingCreator = found;
      }
    }

    const serverResult = await fetchDiscordServer(input);

    if (existingCreator && auth && (auth.user.id === existingCreator.userId || auth.user.role === 'ADMIN')) {
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
      { error: 'DETECT_FAILED', message: err.message || 'Failed to detect Discord server' },
      { status: 400 }
    );
  }
}
