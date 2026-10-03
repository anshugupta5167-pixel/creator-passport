import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, generateVerificationCode, sanitizeUser } from '@/lib/auth';
import { updateUserDB, getUserByEmailDB, addAuditLogDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => ({}));
    const { code, email, action } = body;

    let targetUser = auth?.user || (email ? getUserByEmailDB(String(email).trim().toLowerCase()) : null);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in or provide your registered email.' },
        { status: 401 }
      );
    }

    // Resend code action
    if (action === 'resend') {
      const newCode = generateVerificationCode();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      updateUserDB(targetUser.id, {
        verificationToken: newCode,
        verificationExpires: expires,
      });

      return NextResponse.json({
        success: true,
        message: 'A fresh verification code has been generated.',
        demoVerificationCode: newCode,
      });
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Please enter the 6-digit verification code.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    if (!targetUser.verificationToken || targetUser.verificationToken !== cleanCode) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'The verification code provided is incorrect.' },
        { status: 400 }
      );
    }

    if (targetUser.verificationExpires && new Date(targetUser.verificationExpires).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'CODE_EXPIRED', message: 'This verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const updated = updateUserDB(targetUser.id, {
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null,
    });

    addAuditLogDB({
      userId: targetUser.id,
      action: 'EMAIL_VERIFIED',
      actor: targetUser.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified!',
      user: updated ? sanitizeUser(updated) : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}
