import { NextRequest, NextResponse } from 'next/server';
import { getAllCreatorsDB, getAllCreatorsDBAsync, addCreatorDB, deleteCreatorDB, getCreatorByIpDB, getCreatorByIdDB, normalizeIp, isSameIp } from '@/lib/db';
import { CreatorProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const platform = searchParams.get('platform');
  const query = searchParams.get('q');

  let creators = await getAllCreatorsDBAsync();

  const checkParam = searchParams.get('check');
  if (checkParam) {
    const cleanCheck = checkParam.toLowerCase().trim().replace(/^@/, '');
    const ytCheck = searchParams.get('yt');
    const existing = creators.find(
      (c) =>
        (c.slug && c.slug.toLowerCase() === cleanCheck) ||
        (c.username && c.username.toLowerCase() === cleanCheck) ||
        (c.displayName && c.displayName.toLowerCase() === cleanCheck) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanCheck) ||
        (ytCheck && c.connections?.youtube?.channelId && c.connections.youtube.channelId === ytCheck && ytCheck !== 'UC_demo_channel_id')
    );
    return NextResponse.json({
      available: !existing,
      claimed: !!existing,
      message: existing ? `Already taken by @${existing.username}` : 'Available',
    });
  }

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
      creators = creators.filter((c) => c.connections?.youtube?.connected);
    } else if (p === 'DISCORD') {
      creators = creators.filter((c) => c.connections?.discord?.connected);
    } else if (p === 'INSTAGRAM') {
      creators = creators.filter((c) => c.connections?.instagram?.connected);
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

    if ((!detectedIp || isSameIp(detectedIp, '127.0.0.1')) && body.clientIp && !isSameIp(body.clientIp, '127.0.0.1')) {
      detectedIp = normalizeIp(body.clientIp);
    }

    if (!detectedIp) {
      detectedIp = '127.0.0.1';
    }

    const isAdminRequest = request.headers.get('x-admin-request') === 'true' || (body as any).isAdmin === true;
    const targetSlug = (body.slug || body.username || body.passportId || '').toLowerCase().replace(/^@/, '').trim();
    const targetUsername = (body.username || body.slug || '').toLowerCase().replace(/^@/, '').trim();
    const targetDisplayName = (body.displayName || '').toLowerCase().trim();
    const allCreators = getAllCreatorsDB();

    // 2. CHECK IF CARD NAME / SLUG / HANDLE IS ALREADY TAKEN BY ANOTHER PERSON
    const existingByName = allCreators.find(
      (c) =>
        (c.slug && c.slug.toLowerCase() === targetSlug) ||
        (c.username && c.username.toLowerCase() === targetUsername) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === targetSlug) ||
        (c.displayName && c.displayName.toLowerCase() === targetDisplayName)
    );

    if (existingByName) {
      // Validate whether requester is the legitimate owner
      const isOwner =
        isAdminRequest ||
        (existingByName.digitalSignature && body.digitalSignature && existingByName.digitalSignature === body.digitalSignature) ||
        (existingByName.creatorSecret && (body as any).creatorSecret && existingByName.creatorSecret === (body as any).creatorSecret) ||
        (isSameIp(existingByName.registeredIp, detectedIp) && !isSameIp(detectedIp, '127.0.0.1') && body.id === existingByName.id && existingByName.id !== 'user_my_pass');

      if (!isOwner) {
        return NextResponse.json(
          {
            error: 'ALREADY_TAKEN',
            message: `Already taken! The Creator ID or channel handle "@${existingByName.username}" (${existingByName.displayName}) is already claimed by another creator. Another person cannot create or claim this card.`,
            existingCard: {
              username: existingByName.username,
              displayName: existingByName.displayName,
            },
          },
          { status: 409 }
        );
      }
    }

    // 3. CHECK IF YOUTUBE CHANNEL IS ALREADY CLAIMED BY ANOTHER CREATOR
    const targetChannelId = body.connections?.youtube?.channelId?.trim();
    const targetYtUrl = body.connections?.youtube?.profileUrl?.toLowerCase().trim();
    const targetYtUsername = body.connections?.youtube?.username?.toLowerCase().trim().replace(/^@/, '');

    const channelConflict = allCreators.find((c) => {
      if (!c.connections?.youtube?.connected) return false;
      if (c.slug.toLowerCase() === targetSlug) return false;

      const cId = c.connections.youtube.channelId;
      if (cId && targetChannelId && cId === targetChannelId && targetChannelId !== 'UC_demo_channel_id') {
        return true;
      }
      const cUrl = c.connections.youtube.profileUrl?.toLowerCase().trim();
      if (cUrl && targetYtUrl && cUrl === targetYtUrl && !targetYtUrl.includes('yourchannel')) {
        return true;
      }
      const cUser = c.connections.youtube.username?.toLowerCase().trim().replace(/^@/, '');
      if (cUser && targetYtUsername && cUser === targetYtUsername && targetYtUsername !== 'yourchannel' && targetYtUsername !== 'channel') {
        return true;
      }
      return false;
    });

    if (channelConflict) {
      const isOwner =
        isAdminRequest ||
        (channelConflict.digitalSignature && body.digitalSignature && channelConflict.digitalSignature === body.digitalSignature);

      if (!isOwner) {
        return NextResponse.json(
          {
            error: 'ALREADY_TAKEN',
            message: `Already taken! This YouTube channel (@${channelConflict.connections?.youtube?.username || channelConflict.username}) is already connected and claimed by verified Creator Pass @${channelConflict.username}. Another person cannot claim this channel.`,
            existingCard: {
              username: channelConflict.username,
              displayName: channelConflict.displayName,
            },
          },
          { status: 409 }
        );
      }
    }

    // 4. Enforce ONE PERSON, ONE CARD PER IP POLICY (prevent spamming multiple cards)
    const existingInDb = targetSlug ? getCreatorByIdDB(targetSlug) : null;
    const isExistingCardUpdate = !!existingInDb;

    const isLoopback = !detectedIp || detectedIp === '127.0.0.1' || detectedIp === '::1' || detectedIp === 'localhost';

    if (!isAdminRequest && !isExistingCardUpdate && !isLoopback) {
      const existingByIp = getCreatorByIpDB(detectedIp);

      if (existingByIp) {
        const existingSlug = (existingByIp.slug || existingByIp.username || existingByIp.passportId || '').toLowerCase().replace(/^@/, '');
        const isSameCreator =
          (body.id && body.id === existingByIp.id) ||
          (targetSlug && targetSlug === existingSlug) ||
          (body.passportId && body.passportId.toLowerCase() === (existingByIp.passportId || '').toLowerCase());

        if (!isSameCreator) {
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

    // 5. Bind IP to card
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
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const clientIpHeader = request.headers.get('x-client-ip');
    const trueClientIp = request.headers.get('true-client-ip');

    let detectedIp = forwarded
      ? forwarded.split(',')[0].trim()
      : (realIp || cfIp || clientIpHeader || trueClientIp || '');
    detectedIp = normalizeIp(detectedIp);

    const targets: string[] = [];
    const pSlug = searchParams.get('slug');
    const pUsername = searchParams.get('username');
    const pPassportId = searchParams.get('passportId');
    const pHandle = searchParams.get('handle');
    const pId = searchParams.get('id');

    if (pSlug) targets.push(pSlug);
    if (pUsername) targets.push(pUsername);
    if (pPassportId) targets.push(pPassportId);
    if (pHandle) targets.push(pHandle);
    if (pId) targets.push(pId);

    try {
      const body = await request.json();
      if (body.slug) targets.push(body.slug);
      if (body.username) targets.push(body.username);
      if (body.passportId) targets.push(body.passportId);
      if (body.handle) targets.push(body.handle);
      if (body.id) targets.push(body.id);
    } catch (e) {}

    if (targets.length === 0 && detectedIp && !isSameIp(detectedIp, '127.0.0.1')) {
      targets.push(detectedIp);
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: 'Creator identifier required for deletion' }, { status: 400 });
    }

    const deleted = await deleteCreatorDB(targets);
    return NextResponse.json({ success: true, deleted, targets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting creator' }, { status: 500 });
  }
}
