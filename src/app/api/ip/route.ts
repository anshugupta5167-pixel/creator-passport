import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const clientIpHeader = request.headers.get('x-client-ip');
    const trueClientIp = request.headers.get('true-client-ip');

    const detectedIp = forwarded
      ? forwarded.split(',')[0].trim()
      : (realIp || cfIp || clientIpHeader || trueClientIp || '127.0.0.1');

    // ONLY return authenticated user's card via secure session, NEVER by IP address!
    const auth = await getAuthenticatedUser(request);

    return NextResponse.json({
      success: true,
      ip: detectedIp,
      authenticated: !!auth,
      user: auth ? { id: auth.user.id, username: auth.user.username, email: auth.user.email } : null,
      hasExistingCard: !!auth?.creator,
      existingCreator: auth?.creator || null,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      ip: '127.0.0.1',
      authenticated: false,
      hasExistingCard: false,
      existingCreator: null,
      error: err.message,
    });
  }
}
