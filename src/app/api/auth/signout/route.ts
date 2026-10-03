import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, removeSessionCookie } from '@/lib/auth';
import { deleteSessionDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      deleteSessionDB(token);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully.',
    });

    removeSessionCookie(response);
    return response;
  } catch (err: any) {
    const response = NextResponse.json({
      success: true,
      message: 'Signed out.',
    });
    removeSessionCookie(response);
    return response;
  }
}
