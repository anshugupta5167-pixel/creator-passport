import { NextRequest, NextResponse } from 'next/server';
import { getVerificationQueue } from '@/lib/data';
import { getAllVerificationsDBAsync, getVerificationByIdDB } from '@/lib/db';
import { isMongoConfigured } from '@/lib/mongoStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Hydrate the canonical database first so serverless instances never read a
  // stale process cache. MongoDB is authoritative in production; never expose
  // demo queue entries when a real record is absent there.
  await getAllVerificationsDBAsync();
  const dbItem = getVerificationByIdDB(id);
  if (dbItem) {
    return NextResponse.json({
      id: dbItem.id,
      creatorSlug: dbItem.creatorSlug,
      creatorHandle: dbItem.creatorHandle,
      creatorName: dbItem.creatorName,
      status: dbItem.status,
      submittedAt: dbItem.submittedAt,
      proofDocuments: dbItem.proofDocuments,
    });
  }

  if (isMongoConfigured()) {
    return NextResponse.json(
      { error: 'Verification record not found', id },
      { status: 404 }
    );
  }

  const queue = getVerificationQueue();
  const item = queue.find((v) => v.id === id || v.creatorSlug === id);

  if (!item) {
    return NextResponse.json(
      { error: 'Verification record not found', id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: item.id,
    creatorSlug: item.creatorSlug,
    platform: item.platform,
    account: item.accountUsername,
    metric: item.metricAudience,
    status: item.status,
    submittedAt: item.submittedAt,
  });
}
