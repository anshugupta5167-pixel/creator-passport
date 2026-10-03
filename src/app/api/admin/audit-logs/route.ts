import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await requireAdmin(request);
    if (response || !auth) return response!;

    const logs = getAuditLogsDB();
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
