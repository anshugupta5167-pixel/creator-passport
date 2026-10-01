import { NextRequest, NextResponse } from 'next/server';
import { updateVerificationStatusDB, getVerificationByIdDB } from '@/lib/db';

// POST: Admin approves or rejects a verification submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, action, rejectionReason, reviewedBy } = body;

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: 'verificationId and action are required' },
        { status: 400 }
      );
    }

    // Validate the action
    const validActions = ['APPROVE', 'REJECT', 'UNDER_REVIEW'];
    if (!validActions.includes(action.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check that the verification exists
    const existing = getVerificationByIdDB(verificationId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Verification submission not found' },
        { status: 404 }
      );
    }

    let newStatus: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
    switch (action.toUpperCase()) {
      case 'APPROVE':
        newStatus = 'VERIFIED';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'UNDER_REVIEW':
        newStatus = 'UNDER_REVIEW';
        break;
      default:
        newStatus = 'UNDER_REVIEW';
    }

    const updated = updateVerificationStatusDB(
      verificationId,
      newStatus,
      reviewedBy || 'Admin',
      newStatus === 'REJECTED' ? (rejectionReason || 'Proof inconclusive') : undefined
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verification: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error processing review' },
      { status: 500 }
    );
  }
}
