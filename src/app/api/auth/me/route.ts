import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, sanitizeUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        creator: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: sanitizeUser(auth.user),
      creator: auth.creator || null,
    });
  } catch (err: any) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      creator: null,
      error: err.message,
    });
  }
}
