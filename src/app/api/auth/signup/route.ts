import { NextRequest, NextResponse } from 'next/server';
import { 
  generateSalt, 
  hashPassword, 
  generateSecureToken, 
  generateVerificationCode, 
  attachSessionCookie, 
  sanitizeUser,
  checkRateLimit,
  hasSessionSigningSecret,
} from '@/lib/auth';
import { 
  createUserPersistentDB,
  getUserByEmailPersistentDB,
  getUserByUsernamePersistentDB,
  createSessionDB, 
  addAuditLogDB 
} from '@/lib/db';
import { isFirebaseAdminStoreConfigured } from '@/lib/firebaseAdminStore';
import { User, Session } from '@/lib/types';
import { SESSION_DURATION_MS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'ip';
    if (!checkRateLimit(`signup_${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, username, displayName, password } = body;

    // 1. Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Valid email address is required.' }, { status: 400 });
    }
    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Username is required.' }, { status: 400 });
    }
    const cleanUsername = username.toLowerCase().replace(/^@/, '').trim();
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Username must be between 3 and 30 characters and contain only letters, numbers, hyphens, and underscores.',
      }, { status: 400 });
    }

    const reservedNames = ['admin', 'api', 'dashboard', 'creators', 'brands', 'verification', 'talents', 'settings'];
    if (reservedNames.includes(cleanUsername)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'This username is reserved. Please select another.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long.',
      }, { status: 400 });
    }

    if (process.env.VERCEL && !hasSessionSigningSecret()) {
      return NextResponse.json(
        {
          error: 'SESSION_CONFIGURATION',
          message: 'Sign-in is not configured on this deployment. The site administrator must add SESSION_SECRET in Vercel and redeploy.',
        },
        { status: 503 }
      );
    }

    if (process.env.VERCEL && !isFirebaseAdminStoreConfigured()) {
      return NextResponse.json(
        {
          error: 'ACCOUNT_STORAGE_CONFIGURATION',
          message: 'Creator account storage is not configured. The site administrator must add Firebase Admin credentials in Vercel.',
        },
        { status: 503 }
      );
    }

    // 2. Uniqueness checks
    if (await getUserByEmailPersistentDB(cleanEmail)) {
      return NextResponse.json({
        error: 'EMAIL_IN_USE',
        message: 'An account with this email address already exists. Please sign in instead.',
      }, { status: 409 });
    }

    if (await getUserByUsernamePersistentDB(cleanUsername)) {
      return NextResponse.json({
        error: 'USERNAME_IN_USE',
        message: `The username "@${cleanUsername}" is already claimed. Please choose a different username.`,
      }, { status: 409 });
    }

    // 3. Create User record
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newUser: User = {
      id: `usr_${Date.now()}_${cleanUsername}`,
      email: cleanEmail,
      username: cleanUsername,
      displayName: (displayName && typeof displayName === 'string' && displayName.trim()) ? displayName.trim() : cleanUsername,
      role: 'CREATOR',
      passwordHash,
      passwordSalt: salt,
      emailVerified: false,
      verificationToken: verificationCode,
      verificationExpires,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createUserPersistentDB(newUser);

    // 4. Create persistent Session
    const sessionToken = generateSecureToken(32);
    const newSession: Session = {
      id: `sess_${Date.now()}_${generateSecureToken(8)}`,
      userId: newUser.id,
      token: sessionToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    };

    createSessionDB(newSession);

    addAuditLogDB({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      actor: cleanEmail,
      details: { username: cleanUsername },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account successfully registered.',
      user: sanitizeUser(newUser),
      creator: null,
      verificationCodeNeeded: true,
      // For developer / demo environment display:
      demoVerificationCode: verificationCode,
    });

    attachSessionCookie(response, sessionToken, newUser);
    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Failed to register account' },
      { status: 500 }
    );
  }
}
