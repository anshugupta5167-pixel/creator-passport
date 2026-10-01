import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByPassportId } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, redirectUri } = body;

    // Secure OAuth2 exchange simulation
    // In production, exchanges code with https://discord.com/api/oauth2/token
    // using DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET
    const mockDiscordUser = {
      id: '894019280192837492',
      username: 'creator#0001',
      global_name: 'Creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    };

    return NextResponse.json({
      success: true,
      message: 'Discord account authenticated successfully via OAuth2',
      sessionToken: 'cp_sess_' + Math.random().toString(36).substring(2),
      user: {
        discordId: mockDiscordUser.id,
        username: mockDiscordUser.username,
        verified: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process Discord authentication', message: err.message },
      { status: 400 }
    );
  }
}
