import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyPassword, 
  generateSecureToken, 
  attachSessionCookie, 
  sanitizeUser,
  checkRateLimit, 
  SESSION_DURATION_MS 
} from '@/lib/auth';
import { 
  getUserByEmailDB, 
  getUserByUsernameDB, 
  createSessionDB, 
  getCreatorByUserIdDB, 
  addAuditLogDB 
} from '@/lib/db';
import { Session } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'ip';
    if (!checkRateLimit(`signin_${ip}`, 15, 60000)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const identifier = (body.identifier || body.emailOrUsername || body.email || body.username || body.staffId || '').toString().trim();
    const password = (body.password || body.staffPass || '').toString();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Please provide both your ID / email and password.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase().replace(/^@/, '');

    // Look up by email or username
    let user = getUserByEmailDB(cleanIdentifier) || getUserByUsernameDB(cleanIdentifier);

    if (!user) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Incorrect email/username or password.' },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Incorrect email/username or password.' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = generateSecureToken(32);
    const session: Session = {
      id: `sess_${Date.now()}_${generateSecureToken(8)}`,
      userId: user.id,
      token: sessionToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    };

    createSessionDB(session);

    addAuditLogDB({
      userId: user.id,
      action: 'USER_SIGNED_IN',
      actor: user.email,
      details: { username: user.username, role: user.role },
    });

    const creator = getCreatorByUserIdDB(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully.',
      user: sanitizeUser(user),
      creator: creator || null,
    });

    attachSessionCookie(response, sessionToken);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
