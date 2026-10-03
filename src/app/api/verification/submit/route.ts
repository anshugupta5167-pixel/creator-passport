import { NextRequest, NextResponse } from 'next/server';
import {
  submitVerificationDB,
  getAllVerificationsDBAsync,
  saveProofDocumentDB,
  getCreatorBySlugDB,
  getCreatorByUserIdDB,
  addAuditLogDB,
} from '@/lib/db';
import { getAuthenticatedUser, requireAuth, requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List all verification submissions (Staff Admin Only)
export async function GET(request: NextRequest) {
  const { auth, response: adminResponse } = await requireAdmin(request);
  if (adminResponse || !auth) return adminResponse!;

  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');
  const status = searchParams.get('status');

  let verifications = await getAllVerificationsDBAsync();

  if (slug) {
    const clean = slug.replace(/^@/, '').toLowerCase();
    verifications = verifications.filter((v) => v.creatorSlug.toLowerCase() === clean);
  }

  if (status) {
    verifications = verifications.filter((v) => v.status === status.toUpperCase());
  }

  return NextResponse.json(
    {
      count: verifications.length,
      verifications,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

// POST: Submit a new verification request with proof documents (Authenticated Creators)
export async function POST(request: NextRequest) {
  try {
    const { auth, response: authResponse } = await requireAuth(request);
    if (authResponse || !auth) return authResponse!;

    const user = auth.user;
    const body = await request.json();
    const {
      creatorSlug,
      creatorName,
      creatorHandle,
      creatorAvatar,
      category,
      platforms,
      connectedPlatforms,
      proofFiles,
    } = body;

    // Get user's creator card
    const userCard = auth.creator || await getCreatorByUserIdDB(user.id);
    const targetSlug = (creatorSlug || userCard?.slug || user.username).toLowerCase().replace(/^@/, '');

    // Strict ownership verification: cannot submit proofs for another user's profile
    if (userCard && userCard.slug.toLowerCase() !== targetSlug && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only submit verification for your own Creator Card.' },
        { status: 403 }
      );
    }

    const creator = userCard || await getCreatorBySlugDB(targetSlug);
    if (!creator) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Creator profile not found. Please create your card first.' },
        { status: 404 }
      );
    }

    // Save proof documents to secure storage
    const savedProofs = [];
    if (Array.isArray(proofFiles)) {
      for (const file of proofFiles) {
        const doc = saveProofDocumentDB(
          targetSlug,
          file.filename || 'proof.png',
          file.base64 || '',
          file.mimeType || 'image/png',
          file.platform,
          file.notes
        );
        if (doc) {
          savedProofs.push(doc);
        }
      }
    }

    // Create the verification submission
    const submission = await submitVerificationDB({
      creatorId: creator.id,
      userId: user.id,
      creatorSlug: targetSlug,
      creatorName: creatorName || creator.displayName,
      creatorHandle: creatorHandle || creator.handle || `@${targetSlug}`,
      creatorAvatar: creatorAvatar || creator.avatarUrl,
      category: category || creator.category,
      platforms: platforms || [],
      connectedPlatforms: connectedPlatforms || creator.connections || {},
      proofDocuments: savedProofs,
      status: 'PENDING',
      rejectionReason: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
    });

    addAuditLogDB({
      userId: user.id,
      action: 'VERIFICATION_SUBMITTED',
      actor: user.email,
      details: { slug: targetSlug, proofsCount: savedProofs.length },
    });

    return NextResponse.json({
      success: true,
      verification: submission,
      message: 'Verification request submitted successfully. Staff will review your proofs.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Error submitting verification' },
      { status: 500 }
    );
  }
}
