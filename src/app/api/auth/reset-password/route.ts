import { NextRequest, NextResponse } from 'next/server';
import { generateSalt, hashPassword } from '@/lib/auth';
import { getUsersDB, updateUserDB, deleteUserSessionsDB, addAuditLogDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Reset token is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const allUsers = getUsersDB();
    const user = allUsers.find(
      (u) =>
        u.resetToken &&
        u.resetToken === cleanToken &&
        u.resetExpires &&
        new Date(u.resetExpires).getTime() > Date.now()
    );

    if (!user) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'This password reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);

    updateUserDB(user.id, {
      passwordHash,
      passwordSalt: salt,
      resetToken: null,
      resetExpires: null,
    });

    // Invalidate all active sessions for security
    deleteUserSessionsDB(user.id);

    addAuditLogDB({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      actor: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset. Please sign in with your new password.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
