import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByUsername, getCreatorByPassportId, updateCreatorProfile } from '@/lib/data';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const clean = username.replace(/^@/, '');
  const creator = getCreatorByUsername(clean) || getCreatorByPassportId(clean);

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
  const creator = getCreatorByUsername(clean) || getCreatorByPassportId(clean);

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = updateCreatorProfile(creator.passportId || '', body);
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
