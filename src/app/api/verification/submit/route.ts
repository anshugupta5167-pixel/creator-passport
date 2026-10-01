import { NextRequest, NextResponse } from 'next/server';
import {
  submitVerificationDB,
  getAllVerificationsDB,
  saveProofDocumentDB,
  getCreatorBySlugDB,
} from '@/lib/db';

// GET: List all verification submissions (admin only)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');
  const status = searchParams.get('status');

  let verifications = getAllVerificationsDB();

  if (slug) {
    const clean = slug.replace(/^@/, '').toLowerCase();
    verifications = verifications.filter((v) => v.creatorSlug.toLowerCase() === clean);
  }

  if (status) {
    verifications = verifications.filter((v) => v.status === status.toUpperCase());
  }

  return NextResponse.json({
    count: verifications.length,
    verifications,
  });
}

// POST: Submit a new verification request with proof documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorSlug,
      creatorName,
      creatorHandle,
      creatorAvatar,
      category,
      platforms,
      connectedPlatforms,
      proofFiles, // Array of { filename, base64, mimeType, platform, notes }
    } = body;

    if (!creatorSlug || !creatorName) {
      return NextResponse.json(
        { error: 'creatorSlug and creatorName are required' },
        { status: 400 }
      );
    }

    // Verify the creator exists
    const creator = getCreatorBySlugDB(creatorSlug);
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Save proof documents to secure storage
    const savedProofs = [];
    if (Array.isArray(proofFiles)) {
      for (const file of proofFiles) {
        const doc = saveProofDocumentDB(
          creatorSlug,
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
    const submission = submitVerificationDB({
      creatorSlug,
      creatorName,
      creatorHandle: creatorHandle || `@${creatorSlug}`,
      creatorAvatar: creatorAvatar || creator.avatarUrl,
      category: category || creator.category,
      platforms: platforms || [],
      connectedPlatforms: connectedPlatforms || {},
      proofDocuments: savedProofs,
      rejectionReason: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
    });

    return NextResponse.json({
      success: true,
      verification: submission,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error submitting verification' },
      { status: 500 }
    );
  }
}
