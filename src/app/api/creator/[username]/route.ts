import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByIdDB, getCreatorByIdDBAsync, getCreatorByUsernameDB, addCreatorDB } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const clean = username.replace(/^@/, '');
  const creator = await getCreatorByIdDBAsync(clean) || getCreatorByUsernameDB(clean);

  if (!creator) {
    return NextResponse.json(
      { error: 'Creator not found', username: clean },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    creator,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const clean = username.replace(/^@/, '');
  const creator = getCreatorByIdDB(clean) || getCreatorByUsernameDB(clean);

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = await addCreatorDB({
      ...creator,
      ...body,
      connections: {
        ...creator.connections,
        ...(body.connections || {}),
      },
    });
    return NextResponse.json({
      success: true,
      creator: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update creator profile', message: err.message },
      { status: 400 }
    );
  }
}
