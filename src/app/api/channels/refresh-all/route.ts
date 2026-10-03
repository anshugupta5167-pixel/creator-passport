import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeChannel } from '@/lib/youtube';
import { fetchDiscordServer } from '@/lib/discord';
import { getCreatorByIdDB, addCreatorDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passportId } = body;

    if (!passportId) {
      return NextResponse.json({ error: 'passportId is required' }, { status: 400 });
    }

    const creator = await getCreatorByIdDB(passportId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // 1. Refresh Primary YouTube Channel
    if (creator.connections.youtube?.connected) {
      const ytTarget =
        creator.connections.youtube.channelId ||
        creator.connections.youtube.profileUrl ||
        creator.connections.youtube.username;

      try {
        const yt = await fetchYouTubeChannel(ytTarget, {
          forceRefresh: true,
          previousCount: creator.connections.youtube.rawCount,
          previousChannelId: creator.connections.youtube.channelId,
        });

        creator.connections.youtube.metricValue = yt.subscriberCountFormatted;
        creator.connections.youtube.channelId = yt.channelId;
        creator.connections.youtube.rawCount = yt.subscriberCount;
        creator.connections.youtube.lastSynced = yt.lastUpdated;
        creator.connections.youtube.lastSyncedTimestamp = yt.lastSyncedTimestamp;
        creator.connections.youtube.syncStatus = yt.status;
      } catch (e) {}
    }

    // 2. Refresh Discord Community
    if (creator.connections.discord?.connected) {
      const dcTarget =
        creator.connections.discord.profileUrl ||
        creator.connections.discord.guildId ||
        'example';

      try {
        const dc = await fetchDiscordServer(dcTarget, {
          forceRefresh: true,
          previousCount: creator.connections.discord.rawCount,
          previousGuildId: creator.connections.discord.guildId,
        });

        creator.connections.discord.metricValue = dc.memberCountFormatted;
        creator.connections.discord.guildId = dc.guildId;
        creator.connections.discord.guildName = dc.guildName;
        creator.connections.discord.guildIcon = dc.guildIcon || undefined;
        creator.connections.discord.rawCount = dc.memberCount;
        creator.connections.discord.approximatePresenceCount = dc.presenceCount;
        creator.connections.discord.lastSynced = dc.lastUpdated;
        creator.connections.discord.lastSyncedTimestamp = dc.lastSyncedTimestamp;
        creator.connections.discord.syncStatus = dc.status;
      } catch (e) {}
    }

    // 3. Refresh Secondary Channels in moreChannels
    if (creator.moreChannels && creator.moreChannels.length > 0) {
      for (const ch of creator.moreChannels) {
        try {
          const updatedCh = await fetchYouTubeChannel(ch.url || ch.id || ch.handle, {
            forceRefresh: true,
            previousCount: ch.numericSubscribers,
            previousChannelId: ch.id,
          });

          ch.subscribers = `${updatedCh.compactSubscribers} subscribers`;
          ch.numericSubscribers = updatedCh.subscriberCount;
          ch.lastSynced = updatedCh.lastUpdated;
          ch.name = updatedCh.title;
        } catch (e) {}
      }
    }

    await addCreatorDB(creator);

    return NextResponse.json({
      success: true,
      creator,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
