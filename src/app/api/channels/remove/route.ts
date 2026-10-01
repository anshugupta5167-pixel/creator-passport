import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passportId, channelId } = body;

    if (!passportId || !channelId) {
      return NextResponse.json(
        { error: 'passportId and channelId are required' },
        { status: 400 }
      );
    }

    const creator = getCreatorByIdDB(passportId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    if (creator.moreChannels) {
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
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
