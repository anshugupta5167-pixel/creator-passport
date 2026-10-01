// Discord Bot Rich Embed Generator
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

interface PassportPayload {
  passportId: string;
  displayName: string;
  username: string;
  category: string;
  status: string;
  isFounding: boolean;
  tierName?: string;
  youtube?: {
    connected: boolean;
    subscribers: string;
  };
  discord?: {
    connected: boolean;
    members: string;
  };
  passportUrl: string;
}

export function buildPassportEmbed(data: PassportPayload) {
  const embed = new EmbedBuilder()
    .setColor(0x0ea5e9) // Electric Blue
    .setTitle('CREATOR PASSPORT')
    .setDescription(`**${data.passportId}**\n\n**${data.displayName}**\n${data.category}`)
    .addFields(
      {
        name: 'VERIFICATION',
        value: data.status === 'VERIFIED' ? '✓ VERIFIED CREATOR' : 'PENDING AUDIT',
        inline: true,
      },
      {
        name: 'MEMBERSHIP',
        value: data.isFounding ? 'FOUNDING CREATOR' : 'VERIFIED MEMBER',
        inline: true,
      },
      {
        name: 'YouTube',
        value: data.youtube?.connected ? `${data.youtube.subscribers} subscribers ✓` : 'Not Connected',
        inline: false,
      },
      {
        name: 'Discord',
        value: data.discord?.connected ? `${data.discord.members} members ✓` : 'Not Connected',
        inline: false,
      }
    )
    .setFooter({
      text: 'Private Creator Platform • Official Verification Node',
    })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('View Full Passport')
      .setStyle(ButtonStyle.Link)
      .setURL(data.passportUrl)
  );

  return { embeds: [embed], components: [row] };
}

export function buildHelpEmbed(appUrl: string) {
  const embed = new EmbedBuilder()
    .setColor(0x0ea5e9)
    .setTitle('Creator Passport • Official Commands')
    .setDescription('Official verified credentials for the creator economy.')
    .addFields(
      { name: '/passport', value: 'Displays your linked Creator Passport card.' },
      { name: '/passport view @user', value: "View another creator's public verified Passport." },
      { name: '/verify', value: 'Start OAuth verification or view current verification status.' },
      { name: '/profile', value: 'Display your Creator Passport summary.' },
      { name: '/help', value: 'Shows this command list and platform guidance.' }
    )
    .setFooter({ text: 'Creator Passport Network • Single Official Bot' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Open Platform')
      .setStyle(ButtonStyle.Link)
      .setURL(appUrl)
  );

  return { embeds: [embed], components: [row] };
}
