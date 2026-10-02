import { NextRequest, NextResponse } from 'next/server';
import { updateVerificationStatusDB } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST: Admin approves, revokes, or rejects a verification submission or creator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, creatorSlug, slug, action, rejectionReason, reviewedBy } = body;

    const target = verificationId || creatorSlug || slug;

    if (!target || !action) {
      return NextResponse.json(
        { error: 'verificationId (or creatorSlug) and action are required' },
        { status: 400 }
      );
    }

    const actionUpper = String(action).toUpperCase();
    const validActions = ['APPROVE', 'VERIFY', 'REJECT', 'REVOKE', 'UNDER_REVIEW'];
    if (!validActions.includes(actionUpper)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    let newStatus: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW' | 'PENDING';
    if (actionUpper === 'APPROVE' || actionUpper === 'VERIFY') {
      newStatus = 'VERIFIED';
    } else if (actionUpper === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (actionUpper === 'REVOKE') {
      newStatus = 'PENDING';
    } else {
      newStatus = 'UNDER_REVIEW';
    }

    const result = updateVerificationStatusDB(
      target,
      newStatus,
      reviewedBy || 'Admin',
      newStatus === 'REJECTED' ? (rejectionReason || 'Proof inconclusive') : undefined
    );

    if (!result.verification && !result.creator) {
      return NextResponse.json(
        { error: 'Verification submission or Creator record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      verification: result.verification,
      creator: result.creator,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error processing review' },
      { status: 500 }
    );
  }
}
