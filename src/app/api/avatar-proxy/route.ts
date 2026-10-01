import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    // Allow Google/YouTube and trusted CDN domains
    const allowedHosts = [
      'googleusercontent.com',
      'ggpht.com',
      'yt3.googleusercontent.com',
      'yt3.ggpht.com',
      'youtube.com',
      'unsplash.com',
      'ui-avatars.com',
    ];

    const isAllowed = allowedHosts.some(host => parsed.hostname.endsWith(host));
    if (!isAllowed) {
      return new NextResponse('Host not permitted', { status: 403 });
    }

    // Server-side fetch without any client Referer to avoid 403 / 429 blocking
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return new NextResponse(`Upstream returned ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Failed to proxy avatar', { status: 500 });
  }
}
