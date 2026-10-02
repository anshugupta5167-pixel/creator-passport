import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByIpDBAsync, getCreatorByIdDBAsync, normalizeIp } from '@/lib/db';
import { CreatorProfile } from '@/lib/types';

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

    // 1. Check if user handle was passed via cookie or query param
    const cookieUser = request.cookies.get('chq_user')?.value || request.cookies.get('creatorhq_user')?.value;
    const { searchParams } = new URL(request.url);
    const paramUser = searchParams.get('user') || searchParams.get('handle') || searchParams.get('creator');
    const targetUser = (paramUser || cookieUser || '').trim();

    let existing: CreatorProfile | null = null;
    if (targetUser) {
      existing = await getCreatorByIdDBAsync(targetUser);
    }

    // 2. If not found by cookie/param, check by detected IP
    if (!existing && detectedIp) {
      existing = await getCreatorByIpDBAsync(detectedIp);
    }

    return NextResponse.json({
      success: true,
      ip: detectedIp,
      hasExistingCard: !!existing,
      existingCreator: existing || null,
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
