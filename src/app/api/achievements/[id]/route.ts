import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByPassportId, getCreatorByUsername } from '@/lib/data';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const creator = getCreatorByPassportId(id) || getCreatorByUsername(id);

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  return NextResponse.json({
    passportId: creator.passportId,
    displayName: creator.displayName,
    totalAchievements: creator.achievements.length,
    achievements: creator.achievements,
  });
}
