import { NextRequest, NextResponse } from 'next/server';
import { getVerificationQueue } from '@/lib/data';
import { getVerificationByIdDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Try the new DB first, then fall back to in-memory queue
  const dbItem = await getVerificationByIdDB(id);
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
