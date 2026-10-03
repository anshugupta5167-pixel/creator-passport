import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionByTokenDB, getUserByIdDB, getCreatorByUserIdDB } from './db';
import { User, Session, CreatorProfile } from './types';

export const SESSION_COOKIE_NAME = 'chq_session';
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generate cryptographically secure salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash password with PBKDF2 (100,000 iterations, SHA-512)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Verify password with constant-time equality check
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computedHash = hashPassword(password, salt);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(expectedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}

/**
 * Generate random secure alphanumeric token
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generate 6-digit email verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Set HTTP-only, secure session cookie on NextResponse
 */
export function attachSessionCookie(response: NextResponse, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

/**
 * Clear session cookie on NextResponse
 */
export function removeSessionCookie(response: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Extract authenticated user & creator profile from NextRequest
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: User;
  session: Session;
  creator: CreatorProfile | null;
} | null> {
  // Check cookie first
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Fallback to Bearer token in Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  const session = getSessionByTokenDB(token);
  if (!session) return null;

  // Check session expiration
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return null;
  }

  const user = getUserByIdDB(session.userId);
  if (!user) return null;

  const creator = getCreatorByUserIdDB(user.id);

  return {
    user,
    session,
    creator,
  };
}

/**
 * Helper to enforce authentication. Returns 401 if unauthenticated.
 */
export async function requireAuth(request: NextRequest): Promise<{
  auth: { user: User; session: Session; creator: CreatorProfile | null } | null;
  response?: NextResponse;
}> {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return {
      auth: null,
      response: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in to perform this action.' },
        { status: 401 }
      ),
    };
  }
  return { auth };
}

/**
 * Helper to enforce admin role. Returns 403 if not admin.
 */
export async function requireAdmin(request: NextRequest): Promise<{
  auth: { user: User; session: Session; creator: CreatorProfile | null } | null;
  response?: NextResponse;
}> {
  const { auth, response } = await requireAuth(request);
  if (response) return { auth: null, response };

  if (auth?.user.role !== 'ADMIN') {
    return {
      auth: null,
      response: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrative privileges required.' },
        { status: 403 }
      ),
    };
  }

  return { auth };
}

/**
 * In-memory rate limiter for authentication routes
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Sanitize User object for safe client responses (removes password hashes, salts, and private tokens)
 */
export function sanitizeUser(user: User): Omit<User, 'passwordHash' | 'passwordSalt' | 'verificationToken' | 'resetToken'> {
  const { passwordHash, passwordSalt, verificationToken, resetToken, ...sanitized } = user;
  return sanitized;
}
