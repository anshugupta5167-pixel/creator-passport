import { NextRequest, NextResponse } from 'next/server';
import { getAllCreatorsDBAsync } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ discordId: string }> }
) {
  const { discordId } = await context.params;
  const creators = await getAllCreatorsDBAsync();
  const creator = creators.find((candidate) => {
    const discord = candidate.connections?.discord;
    return discord?.connected && (
      discord.guildId === discordId ||
      discord.username?.toLowerCase() === discordId.toLowerCase()
    );
  }) || null;

  if (!creator) {
    return NextResponse.json(
      { error: 'No Creator Passport linked to this Discord user', discordId },
      { status: 404 }
    );
  }

  // Response format optimized for Discord embed generation
  return NextResponse.json({
    passportId: creator.passportId,
    displayName: creator.displayName,
    username: creator.username,
    category: creator.category,
    status: creator.isVerified ? 'VERIFIED' : 'PENDING',
    isFounding: creator.isFounding,
    tierName: creator.tierName,
    youtube: {
      connected: !!creator.connections.youtube?.connected,
      subscribers: creator.connections.youtube?.metricValue || '0',
    },
    discord: {
      connected: !!creator.connections.discord?.connected,
      members: creator.connections.discord?.metricValue || '0',
    },
    passportUrl: `${request.nextUrl.origin}/creator/${creator.passportId}`,
  });
}
