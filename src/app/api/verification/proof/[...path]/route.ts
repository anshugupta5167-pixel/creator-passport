import { NextRequest, NextResponse } from 'next/server';
import { getProofFilePath } from '@/lib/db';
import fs from 'fs';

// GET: Serve a proof file securely (admin-only in production)
// URL: /api/verification/proof/[slug]/[filename]
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

    // In production, validate admin session/token here
    // For now we verify the file exists on disk
    const filePath = getProofFilePath(creatorSlug, storedFilename);

    if (!filePath) {
      return NextResponse.json(
        { error: 'Proof file not found' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Determine content type from extension
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

    return new NextResponse(fileBuffer, {
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
