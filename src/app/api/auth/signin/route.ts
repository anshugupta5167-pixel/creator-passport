import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyPassword, 
  generateSecureToken, 
  attachSessionCookie, 
  sanitizeUser,
  checkRateLimit, 
  SESSION_DURATION_MS,
  hasSessionSigningSecret,
} from '@/lib/auth';
import { 
  getUserByEmailPersistentDB,
  getUserByUsernamePersistentDB,
  createSessionDB, 
  getCreatorByUserIdDB, 
  addAuditLogDB 
} from '@/lib/db';
import { isFirebaseAdminStoreConfigured } from '@/lib/firebaseAdminStore';
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
    const user = await getUserByEmailPersistentDB(cleanIdentifier) || await getUserByUsernamePersistentDB(cleanIdentifier);

    if (!user) {
      if (process.env.VERCEL && !isFirebaseAdminStoreConfigured()) {
        return NextResponse.json(
          {
            error: 'ACCOUNT_STORAGE_CONFIGURATION',
            message: 'Creator accounts are not connected to persistent storage. Configure Firebase Admin credentials in Vercel.',
          },
          { status: 503 }
        );
      }
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

    if (process.env.VERCEL && !hasSessionSigningSecret()) {
      console.error('[Auth] Sign-in is disabled because no shared session signing secret is configured.');
      return NextResponse.json(
        {
          error: 'SESSION_CONFIGURATION',
          message: 'Sign-in is not configured on this deployment. The site administrator must add SESSION_SECRET in Vercel and redeploy.',
        },
        { status: 503 }
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

    const creator = await getCreatorByUserIdDB(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully.',
      user: sanitizeUser(user),
      creator: creator || null,
    });

    attachSessionCookie(response, sessionToken, user);
    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
