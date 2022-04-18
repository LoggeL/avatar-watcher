const Discord = require('discord.js')
const { $fetch } = require('ohmyfetch')
const knex = require('knex')({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: './data.sqlite',
  },
  useNullAsDefault: true,
})

const intents = new Discord.Intents(['GUILD_MEMBERS'])
const client = new Discord.Client({ intents })

const { token, storageWebhook } = require('./config.json')

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const webhookClient = new Discord.WebhookClient({
  url: storageWebhook,
})

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  console.log(oldMember.user.tag)

  const newAvatar = newMember.user.avatarURL({ dynamic: true })
  const oldAvatar = oldMember.user.avatarURL({ dynamic: true })

  if (newAvatar !== oldAvatar) {
    // Upload the avatar to the webhook
    const msg = await webhookClient.send({
      files: [newMember.user.avatarURL({ dynamic: true })],
    })
    // Get the URL of the attachment
    const attachment = msg.attachments[0]
    const url = attachment.url
    knex('avatar')
      .insert({
        user_id: newMember.user.id,
        url: url,
        type: 'avatar',
      })
      .then((r) => console.log(`Updated Avatar for ${newMember.user.tag}`))
  }

  // Fetch user for banner
  await newMember.user.fetch()

  const newBanner = newMember.user.bannerURL({ dynamic: true })

  // Return if user has no banner
  if (!newBanner) return

  const oldBanner = await knex('avatar')
    .select('url')
    .where({
      user_id: oldMember.user.id,
      type: 'banner',
    })
    .first()

  if (!oldBanner || newBanner !== oldBanner) {
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

client.login(token)
