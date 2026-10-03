import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByUserIdDB, addCreatorDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in to remove channels.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channelId } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Channel identifier is required.' },
        { status: 400 }
      );
    }

    const creator = auth.creator || getCreatorByUserIdDB(auth.user.id);
    if (!creator) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Creator card not found.' }, { status: 404 });
    }

    if (creator.moreChannels && Array.isArray(creator.moreChannels)) {
      const cleanTarget = channelId.trim().toLowerCase();
      const targetNoAt = cleanTarget.replace(/^@/, '');
      creator.moreChannels = creator.moreChannels.filter((c) => {
        const cId = (c.id || '').trim().toLowerCase();
        const cHandle = (c.handle || '').trim().toLowerCase();
        const cHandleNoAt = cHandle.replace(/^@/, '');
        const cUrl = (c.url || '').trim().toLowerCase();
        return cId !== cleanTarget && cHandle !== cleanTarget && cHandleNoAt !== targetNoAt && cUrl !== cleanTarget;
      });
      await addCreatorDB(creator);
    }

    return NextResponse.json({
      success: true,
      moreChannels: creator.moreChannels || [],
      message: 'Channel removed successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
