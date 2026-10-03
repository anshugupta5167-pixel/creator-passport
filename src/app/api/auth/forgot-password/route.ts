import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken, checkRateLimit } from '@/lib/auth';
import { getUserByEmailPersistentDB, updateUserPersistentDB, addAuditLogDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'ip';
    if (!checkRateLimit(`forgot_${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await getUserByEmailPersistentDB(cleanEmail);

    // Always respond with success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.',
      });
    }

    const resetToken = generateSecureToken(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await updateUserPersistentDB(user.id, {
      resetToken,
      resetExpires,
    });

    addAuditLogDB({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      actor: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been created.',
      // Provided for user convenience in local / demo environment
      resetToken,
      resetUrl: `/dashboard?resetToken=${resetToken}`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
