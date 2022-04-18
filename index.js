const { Client, Collection, Intents, WebhookClient } = require('discord.js')
const fs = require('node:fs')
const knex = require('knex')({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: './data.sqlite',
  },
  useNullAsDefault: true,
})

const intents = new Intents(['GUILD_MEMBERS'])
const client = new Client({ intents })

const { token, storageWebhook } = require('./config.json')

client.commands = new Collection()
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  if (command.data) client.commands.set(command.data.name, command)
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('interactionCreate', async (interaction) => {
  // Attach DB to object
  interaction.knex = knex

  if (!interaction.isCommand()) return
  const command = client.commands.get(interaction.commandName)

  if (!command) return

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    if (interaction.isCommand())
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      })
  }
})

const webhookClient = new WebhookClient({
  url: storageWebhook,
})

client.on('userUpdate', async (oldUser, newUser) => {
  console.log('UserUpdate', newUser.tag)

  const newAvatar = oldUser.avatarURL({ dynamic: true })
  const oldAvatar = newUser.avatarURL({ dynamic: true })

  if (newAvatar !== oldAvatar) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      files: [newUser.avatarURL({ dynamic: true })],
    })
    // Get the URL of the attachment
    const attachment = msg.attachments[0]
    const url = attachment.url
    knex('avatar')
      .insert({
        user_id: newUser.id,
        url: url,
        type: 'avatar',
      })
      .then((r) => console.log(`Updated Avatar for ${newUser.tag}`))
  }

  // Fetch user for banner
  await newUser.fetch()

  const newBanner = newUser.bannerURL({ dynamic: true })

  const oldBannerEntry = await knex('avatar')
    .select('url')
    .where({
      user_id: oldUser.id,
      type: 'banner',
    })
    .first()

  const oldBanner = oldBannerEntry ? oldBannerEntry.url : null

  // Return if user has no banner
  if (!newBanner) return

  if (!oldBanner && newBanner !== oldBanner) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      files: [newMember.user.bannerURL({ dynamic: true })],
    })
    // Get the URL of the attachment
    const attachment = msg.attachments[0]
    const url = attachment.url
    knex('avatar')
      .insert({
        user_id: newMember.user.id,
        url: url,
        type: 'banner',
      })
      .then((r) => console.log(`Updated Banner for ${newMember.user.tag}`))
  }
})

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  console.log('guildMemberUpdate', newMember.user.tag)

  const newAvatar = newMember.avatarURL({ dynamic: true })
  const oldAvatar = oldMember.avatarURL({ dynamic: true })

  if (!newAvatar) return

  if (newAvatar !== oldAvatar) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      files: [newMember.avatarURL({ dynamic: true })],
    })
    // Get the URL of the attachment
    const attachment = msg.attachments[0]
    const url = attachment.url
    knex('avatar')
      .insert({
        user_id: newMember.user.id,
        url: url,
        type: 'guildAvatar',
      })
      .then((r) => console.log(`Updated Avatar for ${newMember.user.tag}`))
  }
})

client.login(token)
