import { NextRequest, NextResponse } from 'next/server';
import { getAllCreatorsDBAsync, getCreatorByIdDB, getCreatorByIdDBAsync, getCreatorByUsernameDB, addCreatorDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  const creator = await getCreatorByIdDBAsync(clean) || getCreatorByUsernameDB(clean);

  if (!creator) {
    return NextResponse.json(
      { error: 'Creator not found', username: clean },
      { status: 404 }
    );
  }

  // Sanitize any private contact email unless viewer is the owner
  const auth = await getAuthenticatedUser(request);
  const isOwner = auth && (auth.user.id === creator.userId || auth.user.role === 'ADMIN');

  const sanitized = {
    ...creator,
    contactEmail: isOwner ? creator.contactEmail : undefined,
  };

  return NextResponse.json({
    success: true,
    creator: sanitized,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  await getAllCreatorsDBAsync();
  const creator = getCreatorByIdDB(clean) || getCreatorByUsernameDB(clean);

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  // Strict ownership enforcement
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'You must be signed in to edit this creator profile.' },
      { status: 401 }
    );
  }

  const isOwner = auth.user.id === creator.userId || auth.user.role === 'ADMIN';
  if (!isOwner) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'You do not have permission to modify another creator’s profile.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const updated = await addCreatorDB({
      ...creator,
      ...body,
      id: creator.id,
      userId: creator.userId, // Never allow reassigning user ownership
      connections: {
        ...creator.connections,
        ...(body.connections || {}),
      },
    });

    return NextResponse.json({
      success: true,
      creator: updated,
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: err.message || 'Failed to update creator profile' },
      { status: 400 }
    );
  }
}
