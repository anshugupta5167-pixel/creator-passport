import { NextRequest, NextResponse } from 'next/server';
import { getProofFileDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Serve a proof file securely (Admin or Owner only)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;

    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json(
        { error: 'Invalid proof path. Expected /api/verification/proof/{slug}/{filename}' },
        { status: 400 }
      );
    }

    const [creatorSlug, storedFilename] = pathSegments;

    // Verify authentication: must be staff admin or the creator themselves
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Sign in required to view proof documents.' },
        { status: 401 }
      );
    }

    const isAdmin = auth.user.role === 'ADMIN';
    const cleanSlug = creatorSlug.toLowerCase().replace(/^@/, '');
    const isOwner =
      auth.user.username.toLowerCase() === cleanSlug ||
      (auth.creator && auth.creator.slug.toLowerCase() === cleanSlug);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to view these proofs.' },
        { status: 403 }
      );
    }

    const fileBuffer = await getProofFileDB(creatorSlug, storedFilename);

    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'Proof file not found' },
        { status: 404 }
      );
    }

    const ext = storedFilename.split('.').pop()?.toLowerCase() || 'png';
    const contentTypeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${storedFilename}"`,
        'Cache-Control': 'private, no-cache, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error serving proof file' },
      { status: 500 }
    );
  }
}
