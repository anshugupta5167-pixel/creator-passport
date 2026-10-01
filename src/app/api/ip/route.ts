import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByIpDB, normalizeIp } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function fetchExternalPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) return data.ip;
    }
  } catch (e) {}

  try {
    const res = await fetch('https://api64.ipify.org?format=json', {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) return data.ip;
    }
  } catch (e) {}

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const clientIpHeader = request.headers.get('x-client-ip');
    const trueClientIp = request.headers.get('true-client-ip');

    let detectedIp = forwarded
      ? forwarded.split(',')[0].trim()
      : (realIp || cfIp || clientIpHeader || trueClientIp || '');
    detectedIp = normalizeIp(detectedIp);

    // If local or loopback (e.g. running in local development), fetch actual external public IP
    const isLoopback = !detectedIp || detectedIp === '127.0.0.1' || detectedIp === '::1' || detectedIp === 'localhost';
    if (isLoopback) {
      const publicIp = await fetchExternalPublicIp();
      if (publicIp) {
        detectedIp = publicIp;
      } else if (!detectedIp) {
        detectedIp = '127.0.0.1';
      }
    }

    // Check if a creator already exists in database with this IP
    const existing = getCreatorByIpDB(detectedIp);

    return NextResponse.json({
      success: true,
      ip: detectedIp,
      hasExistingCard: !!existing,
      existingCreator: existing
        ? {
            id: existing.id,
            displayName: existing.displayName,
            username: existing.username,
            slug: existing.slug,
            passportId: existing.passportId,
            avatarUrl: existing.avatarUrl,
            category: existing.category,
            bio: existing.bio,
            connections: existing.connections,
            registeredIp: existing.registeredIp,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      ip: '127.0.0.1',
      hasExistingCard: false,
      existingCreator: null,
      error: err.message,
    });
  }
}
