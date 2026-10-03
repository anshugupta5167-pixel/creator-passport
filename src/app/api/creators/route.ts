import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCreatorsDB, 
  getAllCreatorsDBAsync, 
  addCreatorDB, 
  deleteCreatorDB, 
  getCreatorByUserIdDB,
  deleteUserPersistentDB,
  addAuditLogDB 
} from '@/lib/db';
import { getAuthenticatedUser, requireAuth } from '@/lib/auth';
import { CreatorProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Public directory listing & search (with sanitized sensitive fields)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const platform = searchParams.get('platform');
  const query = searchParams.get('q');
  const checkParam = searchParams.get('check');

  const creators = await getAllCreatorsDBAsync();

  // Availability check for card creation
  if (checkParam) {
    const cleanCheck = checkParam.toLowerCase().trim().replace(/^@/, '');
    const existing = creators.find(
      (c) =>
        (c.slug && c.slug.toLowerCase() === cleanCheck) ||
        (c.username && c.username.toLowerCase() === cleanCheck) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanCheck)
    );

    const auth = await getAuthenticatedUser(request);
    const isCurrentUser = auth?.creator && (
      auth.creator.slug.toLowerCase() === cleanCheck || 
      auth.creator.username.toLowerCase() === cleanCheck
    );

    return NextResponse.json({
      available: !existing || isCurrentUser,
      claimed: !!existing && !isCurrentUser,
      message: existing && !isCurrentUser ? `Already claimed by @${existing.username}` : 'Available',
    });
  }

  let filtered = creators;

  if (query) {
    const q = query.toLowerCase().trim().replace(/^@/, '');
    filtered = filtered.filter(
      (c) =>
        (c.displayName || '').toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '').includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.niche && c.niche.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'ALL') {
    filtered = filtered.filter((c) => c.category === category || c.niche === category);
  }

  if (platform) {
    const p = platform.toUpperCase();
    if (p === 'YOUTUBE') {
      filtered = filtered.filter((c) => c.connections?.youtube?.connected);
    } else if (p === 'DISCORD') {
      filtered = filtered.filter((c) => c.connections?.discord?.connected);
    } else if (p === 'INSTAGRAM') {
      filtered = filtered.filter((c) => c.connections?.instagram?.connected);
    }
  }

  return NextResponse.json(
    {
      count: filtered.length,
      creators: filtered,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

// POST: Create or Update creator card. STRICT REQUIREMENT: Caller MUST be authenticated!
export async function POST(request: NextRequest) {
  try {
    const { auth, response: authResponse } = await requireAuth(request);
    if (authResponse || !auth) return authResponse!;

    const user = auth.user;
    const body: CreatorProfile = await request.json();

    const targetSlug = (body.slug || body.username || user.username || '').toLowerCase().replace(/^@/, '').trim();
    const cleanSlug = targetSlug.replace(/[^a-z0-9_-]/g, '') || user.username;

    // Check conflict: does another user own this slug?
    const allCreators = getAllCreatorsDB();
    const existingConflict = allCreators.find(
      (c) =>
        c.userId !== user.id &&
        ((c.slug && c.slug.toLowerCase() === cleanSlug) ||
         (c.username && c.username.toLowerCase() === cleanSlug))
    );

    if (existingConflict) {
      return NextResponse.json(
        {
          error: 'SLUG_TAKEN',
          message: `The Creator handle "@${cleanSlug}" is already claimed by another account.`,
        },
        { status: 409 }
      );
    }

    // Find existing card for THIS authenticated user
    const existingUserCard = getCreatorByUserIdDB(user.id);

    const safeCreator: CreatorProfile = {
      ...body,
      id: existingUserCard?.id || `creator_${user.id}`,
      userId: user.id,
      username: user.username,
      slug: cleanSlug,
      handle: `@${cleanSlug}`,
      passportId: cleanSlug,
      displayName: body.displayName?.trim() || user.displayName || user.username,
      avatarUrl: body.avatarUrl || existingUserCard?.avatarUrl || '',
      bio: body.bio || existingUserCard?.bio || '',
      category: body.category || body.niche || existingUserCard?.category || 'Creator',
      niche: body.category || body.niche || existingUserCard?.category || 'Creator',
      country: body.country || existingUserCard?.country || 'Global',
      location: body.location || existingUserCard?.location || 'Global',
      contactEmail: body.contactEmail || user.email,
      cardTheme: body.cardTheme || existingUserCard?.cardTheme || 'dark',
      cardColor: body.cardColor || existingUserCard?.cardColor || '#0284c7',
      isVerified: existingUserCard?.isVerified || false,
      verification_status: existingUserCard?.verification_status || 'PENDING',
      isFounding: existingUserCard?.isFounding ?? true,
      tierName: existingUserCard?.tierName || 'Founding Member Tier I',
      profileCompletion: body.profileCompletion || existingUserCard?.profileCompletion || 85,
      digitalSignature: existingUserCard?.digitalSignature || `0x${Date.now().toString(16)}`,
      issuedAt: existingUserCard?.issuedAt || new Date().toISOString(),
      lastVerifiedAt: existingUserCard?.lastVerifiedAt || new Date().toISOString().split('T')[0],
      isSuspended: existingUserCard?.isSuspended || false,
      connections: {
        youtube: body.connections?.youtube?.connected ? body.connections.youtube : existingUserCard?.connections?.youtube,
        discord: body.connections?.discord?.connected ? body.connections.discord : existingUserCard?.connections?.discord,
        instagram: body.connections?.instagram?.connected ? body.connections.instagram : existingUserCard?.connections?.instagram,
      },
      moreChannels: Array.isArray(body.moreChannels) ? body.moreChannels : (existingUserCard?.moreChannels || []),
      skills: Array.isArray(body.skills) ? body.skills : (existingUserCard?.skills || ['Content Creator']),
      achievements: Array.isArray(body.achievements) ? body.achievements : (existingUserCard?.achievements || []),
      collaborations: Array.isArray(body.collaborations) ? body.collaborations : (existingUserCard?.collaborations || []),
      portfolio: Array.isArray(body.portfolio) ? body.portfolio : (existingUserCard?.portfolio || []),
      proofDocuments: Array.isArray(body.proofDocuments) ? body.proofDocuments : (existingUserCard?.proofDocuments || []),
    };

    const saved = await addCreatorDB(safeCreator);

    return NextResponse.json({
      success: true,
      creator: saved,
      message: 'Creator Card successfully saved.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Failed to save creator' },
      { status: 500 }
    );
  }
}

// DELETE: Require authentication! User can only delete their OWN card; Admin can delete any.
export async function DELETE(request: NextRequest) {
  try {
    const { auth, response: authResponse } = await requireAuth(request);
    if (authResponse || !auth) return authResponse!;

    const user = auth.user;
    const searchParams = request.nextUrl.searchParams;
    const targetSlug = searchParams.get('slug') || searchParams.get('id') || searchParams.get('username');

    // If regular creator, they can ONLY delete their own card
    if (user.role !== 'ADMIN') {
      const userCard = getCreatorByUserIdDB(user.id);
      if (!userCard) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'No creator card found to delete.' }, { status: 404 });
      }

      await deleteCreatorDB([userCard.id, userCard.userId || '', userCard.slug]);
      return NextResponse.json({
        success: true,
        message: 'Your Creator Card has been permanently deleted.',
        deletedSlug: userCard.slug,
      });
    }

    // Admin can delete specified target
    if (!targetSlug) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Target creator slug or ID required.' }, { status: 400 });
    }

    const currentCreators = await getAllCreatorsDBAsync();
    const cleanTarget = targetSlug.toLowerCase().replace(/^@/, '');
    const targetCreator = currentCreators.find((creator) =>
      [creator.id, creator.slug, creator.username, creator.userId, creator.passportId]
        .some((value) => (value || '').toLowerCase().replace(/^@/, '') === cleanTarget)
    ) || null;
    if (!targetCreator) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Creator not found.' }, { status: 404 });
    }

    await deleteCreatorDB([
      targetCreator.id,
      targetCreator.slug || '',
      targetCreator.username || '',
      targetCreator.userId || '',
      targetCreator.passportId || '',
    ]);

    if (targetCreator.userId && targetCreator.userId !== user.id) {
      await deleteUserPersistentDB(targetCreator.userId);
    }

    addAuditLogDB({
      userId: user.id,
      action: 'CREATOR_DELETED_BY_ADMIN',
      actor: user.email,
      details: {
        slug: targetCreator.slug,
        displayName: targetCreator.displayName,
        id: targetCreator.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Creator @${targetCreator.slug} permanently deleted by admin.`,
      deletedSlug: targetCreator.slug,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Failed to delete creator' },
      { status: 500 }
    );
  }
}
