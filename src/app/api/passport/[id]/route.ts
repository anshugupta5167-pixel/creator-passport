import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByIdDBAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const clean = (id || '').replace(/^@/, '').toLowerCase().trim();
  const creator = await getCreatorByIdDBAsync(clean);

  if (!creator) {
    return NextResponse.json(
      { error: 'Creator Passport not found', passportId: id },
      { status: 404 }
    );
  }

  // Return public passport card payload with strictly authentic stats
  return NextResponse.json({
    passportId: creator.passportId || creator.slug,
    slug: creator.slug,
    displayName: creator.displayName,
    username: creator.username,
    avatarUrl: creator.avatarUrl,
    category: creator.category || creator.niche,
    status: creator.verification_status,
    isVerified: creator.isVerified,
    isFounding: creator.isFounding,
    tierName: creator.tierName,
    digitalSignature: creator.digitalSignature,
    issuedAt: creator.issuedAt,
    connectedAccounts: {
      youtube: creator.connections?.youtube?.connected
        ? {
            connected: true,
            username: creator.connections.youtube.username,
            subscribers: creator.connections.youtube.metricValue,
            verified: creator.connections.youtube.verified,
            profileUrl: creator.connections.youtube.profileUrl,
          }
        : null,
      discord: creator.connections?.discord?.connected
        ? {
            connected: true,
            guildName: creator.connections.discord.guildName || creator.connections.discord.username,
            members: creator.connections.discord.metricValue,
            verified: creator.connections.discord.verified,
            profileUrl: creator.connections.discord.profileUrl,
          }
        : null,
      instagram: creator.connections?.instagram?.connected
        ? {
            connected: true,
            username: creator.connections.instagram.username,
            followers: creator.connections.instagram.metricValue,
            verified: creator.connections.instagram.verified,
            profileUrl: creator.connections.instagram.profileUrl,
          }
        : null,
    },
    moreChannels: creator.moreChannels || [],
    qrCodeUrl: `${request.nextUrl.origin}/${creator.slug}`,
    isSuspended: creator.isSuspended,
  });
}
