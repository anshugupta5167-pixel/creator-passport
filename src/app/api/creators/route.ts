import { NextRequest, NextResponse } from 'next/server';
import { getAllCreatorsDB, addCreatorDB, deleteCreatorDB, getCreatorByIpDB, getCreatorByIdDB, normalizeIp, isSameIp } from '@/lib/db';
import { CreatorProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const platform = searchParams.get('platform');
  const query = searchParams.get('q');

  let creators = getAllCreatorsDB();

  if (query) {
    const q = query.toLowerCase().trim().replace(/^@/, '');
    creators = creators.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.passportId && c.passportId.toLowerCase().includes(q)) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '').includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'ALL') {
    creators = creators.filter((c) => c.category === category);
  }

  if (platform) {
    const p = platform.toUpperCase();
    if (p === 'YOUTUBE') {
      creators = creators.filter((c) => c.connections.youtube?.connected);
    } else if (p === 'DISCORD') {
      creators = creators.filter((c) => c.connections.discord?.connected);
    } else if (p === 'INSTAGRAM') {
      creators = creators.filter((c) => c.connections.instagram?.connected);
    } else if (p === 'X' || p === 'TWITTER') {
      creators = creators.filter((c) => c.connections.x?.connected);
    }
  }

  return NextResponse.json(
    {
      count: creators.length,
      creators: creators,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatorProfile = await request.json();

    // 1. Resolve client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const clientIpHeader = request.headers.get('x-client-ip');
    const trueClientIp = request.headers.get('true-client-ip');

    let detectedIp = forwarded
      ? forwarded.split(',')[0].trim()
      : (realIp || cfIp || clientIpHeader || trueClientIp || '');
    detectedIp = normalizeIp(detectedIp);

    // If client supplied verified clientIp and detectedIp is local/empty, use client's verified IP
    if ((!detectedIp || isSameIp(detectedIp, '127.0.0.1')) && body.clientIp && !isSameIp(body.clientIp, '127.0.0.1')) {
      detectedIp = normalizeIp(body.clientIp);
    }

    if (!detectedIp) {
      detectedIp = '127.0.0.1';
    }

    // 2. Check if this is an admin request or an update to an already existing card
    const isAdminRequest = request.headers.get('x-admin-request') === 'true' || (body as any).isAdmin === true;
    const targetSlug = (body.slug || body.username || body.passportId || '').toLowerCase().replace(/^@/, '');
    const existingInDb = targetSlug ? getCreatorByIdDB(targetSlug) : null;
    const isExistingCardUpdate = !!existingInDb;

    // Enforce ONE PERSON, ONE CARD PER IP POLICY (only for new registrations from non-admin)
    if (!isAdminRequest && !isExistingCardUpdate) {
      const existingByIp = getCreatorByIpDB(detectedIp);

      if (existingByIp) {
        // Check if this is an update to their OWN existing card
        const existingSlug = (existingByIp.slug || existingByIp.username || existingByIp.passportId || '').toLowerCase().replace(/^@/, '');
        const isSameCreator =
          (body.id && body.id === existingByIp.id) ||
          (targetSlug && targetSlug === existingSlug) ||
          (body.passportId && body.passportId.toLowerCase() === (existingByIp.passportId || '').toLowerCase());

        if (!isSameCreator) {
          // Block creation of duplicate card on the same IP
          return NextResponse.json(
            {
              error: 'ONE_CARD_PER_IP',
              message: `One Person, One Card Policy: A Creator Pass is already registered to your IP address (${detectedIp}) for @${existingByIp.username} (${existingByIp.displayName}). Only one card per IP is allowed.`,
              clientIp: detectedIp,
              existingCard: {
                id: existingByIp.id,
                displayName: existingByIp.displayName,
                username: existingByIp.username,
                slug: existingByIp.slug,
                passportId: existingByIp.passportId,
                avatarUrl: existingByIp.avatarUrl,
              },
            },
            { status: 409 }
          );
        }
      }
    }

    // Bind IP to the card, preserving original IP if updating an existing card
    if (existingInDb) {
      body.registeredIp = existingInDb.registeredIp || body.registeredIp || detectedIp;
      body.clientIp = existingInDb.clientIp || body.clientIp || detectedIp;
    } else {
      if (!body.registeredIp) {
        body.registeredIp = detectedIp;
      }
      body.clientIp = detectedIp;
    }

    const saved = await addCreatorDB(body);
    return NextResponse.json({ success: true, creator: saved, clientIp: detectedIp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error saving creator' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Accept slug, handle, or identifier — not CP-IDs
    let identifier = searchParams.get('slug') || searchParams.get('passportId') || searchParams.get('handle');
    if (!identifier) {
      try {
        const body = await request.json();
        identifier = body.slug || body.passportId || body.handle;
      } catch (e) {}
    }

    if (!identifier) {
      return NextResponse.json({ error: 'Creator slug or handle required for deletion' }, { status: 400 });
    }

    const deleted = await deleteCreatorDB(identifier);
    return NextResponse.json({ success: true, deleted, identifier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting creator' }, { status: 500 });
  }
}
