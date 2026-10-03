import { NextRequest, NextResponse } from 'next/server';
import { updateVerificationStatusDB, addAuditLogDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST: Admin approves, revokes, or rejects a verification submission or creator
export async function POST(request: NextRequest) {
  try {
    const { auth, response: adminResponse } = await requireAdmin(request);
    if (adminResponse || !auth) return adminResponse!;

    const adminUser = auth.user;
    const body = await request.json();
    const {
      verificationId,
      creatorSlug,
      slug,
      username,
      passportId,
      id,
      action,
      rejectionReason,
      creator,
      submission,
    } = body;

    const target =
      verificationId ||
      creatorSlug ||
      slug ||
      username ||
      passportId ||
      id ||
      creator?.slug ||
      creator?.username ||
      creator?.id ||
      submission?.creatorSlug ||
      submission?.id;

    if (!target || !action) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'verificationId (or creatorSlug) and action are required' },
        { status: 400 }
      );
    }

    const actionUpper = String(action).toUpperCase();
    const validActions = ['APPROVE', 'VERIFY', 'REJECT', 'REVOKE', 'UNDER_REVIEW'];
    if (!validActions.includes(actionUpper)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: `Invalid action. Must be one of: ${validActions.join(', ')}` },
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

    const reviewerNote = rejectionReason || (newStatus === 'VERIFIED' ? 'Approved by staff admin' : undefined);

    const result = updateVerificationStatusDB(
      target,
      newStatus,
      adminUser.username || adminUser.email || 'Admin',
      reviewerNote,
      creator
    );

    if (!result.verification && !result.creator) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Verification submission or Creator record not found' },
        { status: 404 }
      );
    }

    addAuditLogDB({
      userId: adminUser.id,
      action: `VERIFICATION_${newStatus}`,
      actor: adminUser.email,
      details: {
        target,
        status: newStatus,
        reason: reviewerNote,
        reviewedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      verification: result.verification,
      creator: result.creator,
      message: `Creator verification status updated to ${newStatus}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Error processing review' },
      { status: 500 }
    );
  }
}
