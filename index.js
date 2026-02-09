const { Client, Collection, GatewayIntentBits, WebhookClient } = require('discord.js');
const fs = require('node:fs');
const knex = require('knex')({
  client: 'better-sqlite3',
  connection: {
    filename: './data.sqlite',
  },
  useNullAsDefault: true,
});

const client = new Client({
  intents: [GatewayIntentBits.GuildMembers],
});

const { token, storageWebhook } = require('./config.json');

client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) client.commands.set(command.data.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  knex.schema.hasTable('avatar').then(function (exists) {
    if (!exists) {
      knex.schema.createTable('avatar', function (t) {
        t.increments('id').primary();
        t.string('user_id');
        t.string('url');
        t.string('type');
        t.timestamp('changed_at').defaultTo(knex.fn.now());
      });
    }
  });
});

client.on('interactionCreate', async (interaction) => {
  // Attach DB to object
  interaction.knex = knex;

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.isChatInputCommand())
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
  }
});

const webhookClient = new WebhookClient({
  url: storageWebhook,
});

client.on('userUpdate', async (oldUser, newUser) => {
  console.log('UserUpdate', newUser.tag);

  const newAvatar = oldUser.avatarURL();
  if (!newAvatar) return;

  const oldAvatarEntry = await knex('avatar')
    .select('url')
    .where({
      user_id: newUser.id,
      type: 'avatar',
      changed_at: Date.now(),
    })
    .first();

  const oldAvatar = oldAvatarEntry ? oldAvatarEntry.url : null;


  if (!oldAvatar || newAvatar !== oldAvatar) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      username: `${newUser.tag} - New Avatar`,
      avatarURL: newUser.avatarURL({ extension: 'png' }),
      content: `[<t:${Math.round(Date.now() / 1000) - 20}:R>] \`${newUser.tag}\` has changed their avatar!`,
      files: [newUser.avatarURL()],
    });
    // Get the URL of the attachment
    const attachment = msg.attachments.first();
    const url = attachment.url;
    knex('avatar')
      .insert({
        user_id: newUser.id,
        url: url,
        type: 'avatar',
        changed_at: Date.now(),
      })
      .then(() => console.log(`Updated Avatar for ${newUser.tag}`));
  }

  // Fetch user for banner
  await newUser.fetch();

  const newBanner = newUser.bannerURL();

  await knex.schema.hasTable('avatar');

  const oldBannerEntry = await knex('avatar')
    .select('url')
    .where({
      user_id: oldUser.id,
      type: 'banner',
      changed_at: Date.now(),
    })
    .first();

  const oldBanner = oldBannerEntry ? oldBannerEntry.url : null;

  // Return if user has no banner
  if (!newBanner) return;

  if (!oldBanner && newBanner !== oldBanner && oldUser.banner !== newUser.banner) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      username: `${newUser.tag} - New Banner`,
      avatarURL: newUser.bannerURL({ extension: 'png' }),
      content: `[<t:${Math.round(Date.now() / 1000)}:R>] \`${newUser.tag}\` has changed their banner!`,
      files: [newUser.bannerURL()],
    });
    // Get the URL of the attachment
    const attachment = msg.attachments.first();
    const url = attachment.url;
    knex('avatar')
      .insert({
        user_id: newUser.id,
        url: url,
        type: 'banner',
        changed_at: Date.now(),
      })
      .then(() => console.log(`Updated Banner for ${newUser.tag}`));
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  console.log('guildMemberUpdate', newMember.user.tag);

  const newAvatar = newMember.avatarURL();
  if (!newAvatar) return;

  const oldAvatarEntry = await knex('avatar')
    .select('url')
    .where({
      user_id: newMember.user.id,
      type: 'guildAvatar',
      changed_at: Date.now(),
    })
    .first();

  const oldAvatar = oldAvatarEntry ? oldAvatarEntry.url : null;


  if (!oldAvatar || newAvatar !== oldAvatar) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      username: `${newMember.user.tag} - New Avatar`,
      avatarURL: newMember.avatarURL({ extension: 'png' }),
      content: `[<t:${Math.round(Date.now() / 1000)}:R>] \`${newMember.user.tag}\` has changed their guild avatar!`,
      files: [newMember.avatarURL()],
    });

    // Get the URL of the attachment
    const attachment = msg.attachments.first();
    const url = attachment.url;
    knex('avatar')
      .insert({
        user_id: newMember.user.id,
        url: url,
        type: 'guildAvatar',
        changed_at: Date.now(),
      })
      .then(() => console.log(`Updated Avatar for ${newMember.user.tag}`));
  }
});

client.login(token);
