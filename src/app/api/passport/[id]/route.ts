import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByIdDB, getCreatorByUsernameDB } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const clean = (id || '').replace(/^@/, '');
  const creator = getCreatorByIdDB(clean) || getCreatorByUsernameDB(clean);

  if (!creator) {
    return NextResponse.json(
      { error: 'Creator Passport not found', passportId: id },
      { status: 404 }
    );
  }

  // Return public passport card payload
  return NextResponse.json({
    passportId: creator.passportId,
    displayName: creator.displayName,
    username: creator.username,
    category: creator.category,
    status: creator.isVerified ? 'VERIFIED' : 'PENDING',
    isFounding: creator.isFounding,
    tierName: creator.tierName,
    digitalSignature: creator.digitalSignature,
    issuedAt: creator.issuedAt,
    connectedAccounts: {
      youtube: {
        connected: !!creator.connections.youtube?.connected,
        subscribers: creator.connections.youtube?.metricValue || null,
        verified: !!creator.connections.youtube?.verified,
      },
      discord: {
        connected: !!creator.connections.discord?.connected,
        members: creator.connections.discord?.metricValue || null,
        verified: !!creator.connections.discord?.verified,
      },
    },
    qrCodeUrl: `${request.nextUrl.origin}/creator/${creator.passportId}`,
    isSuspended: creator.isSuspended,
  });
}
