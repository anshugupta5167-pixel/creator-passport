// Official Single Discord Bot Implementation for Creator Passport
// Communicates strictly through the Central Backend REST API

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { buildPassportEmbed, buildHelpEmbed } from './embeds';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Register global slash commands
export const commands = [
  new SlashCommandBuilder()
    .setName('passport')
    .setDescription("View your Creator Passport or inspect another user's passport")
    .addSubcommand((sub) =>
      sub
        .setName('me')
        .setDescription('Displays your own verified Creator Passport')
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription("View another creator's public verified Passport")
        .addUserOption((opt) =>
          opt
            .setName('user')
            .setDescription('The user whose passport you want to view')
            .setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Starts verification or displays verification status'),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Displays the user’s Creator Passport summary'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows available Creator Passport commands'),
];

export async function startBot() {
  if (!BOT_TOKEN || BOT_TOKEN === 'mock_discord_bot_token') {
    console.log('[Creator Passport Bot] Running in local simulation mode (API Connected).');
    return;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once('ready', () => {
    console.log(`[Creator Passport Bot] Logged in as ${client.user?.tag}!`);
    console.log(`[Creator Passport Bot] Consuming Backend API at: ${API_BASE_URL}`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
      if (commandName === 'passport') {
        const sub = interaction.options.getSubcommand(false);
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Call Central Backend REST API: GET /api/creator/by-discord/:discordId
        const res = await fetch(`${API_BASE_URL}/api/creator/by-discord/${targetUser.id}`);
        if (!res.ok) {
          await interaction.reply({
            content: `No Creator Passport is currently registered for <@${targetUser.id}>. Create one at ${API_BASE_URL}/dashboard`,
            ephemeral: true,
          });
          return;
        }

        const data = await res.json();
        const responsePayload = buildPassportEmbed(data);
        await interaction.reply(responsePayload);
      } else if (commandName === 'profile') {
        const res = await fetch(`${API_BASE_URL}/api/creator/by-discord/${interaction.user.id}`);
        if (!res.ok) {
          await interaction.reply({
            content: `No Creator Passport found for your account. Visit ${API_BASE_URL} to claim yours.`,
            ephemeral: true,
          });
          return;
        }
        const data = await res.json();
        await interaction.reply(buildPassportEmbed(data));
      } else if (commandName === 'verify') {
        await interaction.reply({
          content: `To verify your Discord server or YouTube channel with Creator Passport, visit: ${API_BASE_URL}/dashboard\n*Creator Passport uses official OAuth2 pipelines and never asks for passwords.*`,
          ephemeral: true,
        });
      } else if (commandName === 'help') {
        await interaction.reply(buildHelpEmbed(API_BASE_URL));
      }
    } catch (err: any) {
      console.error('[Bot Error]', err);
      if (!interaction.replied) {
        await interaction.reply({
          content: 'An error occurred while communicating with the Creator Passport API node.',
          ephemeral: true,
        });
      }
    }
  });

  await client.login(BOT_TOKEN);
}

// Auto-start if executed directly via Node
if (require.main === module) {
  startBot().catch(console.error);
}
