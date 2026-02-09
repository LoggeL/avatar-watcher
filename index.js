const {
  Client,
  Collection,
  GatewayIntentBits,
  WebhookClient,
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./src/db');
const createUserUpdateHandler = require('./src/handlers/userUpdate');
const createGuildMemberUpdateHandler =
  require('./src/handlers/guildMemberUpdate');
const createInteractionHandler =
  require('./src/handlers/interactionCreate');

const token = process.env.DISCORD_TOKEN;
const storageWebhook = process.env.STORAGE_WEBHOOK;

// --- Client setup ---
const client = new Client({
  intents: [GatewayIntentBits.GuildMembers],
});

// --- Load commands ---
const commands = new Collection();
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsDir, file));
  if (command.data) commands.set(command.data.name, command);
}

// --- Webhook for archiving images ---
const webhookClient = new WebhookClient({ url: storageWebhook });

// --- Event handlers ---
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    await db.initialize();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
});

client.on('interactionCreate', createInteractionHandler(commands));
client.on('userUpdate', createUserUpdateHandler(webhookClient));
client.on(
  'guildMemberUpdate',
  createGuildMemberUpdateHandler(webhookClient)
);

// --- Graceful shutdown ---
async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down…`);
  try {
    client.destroy();
    await db.destroy();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// --- Start ---
client.login(token);
