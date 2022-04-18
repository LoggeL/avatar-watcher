const Discord = require('discord.js')
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
      user_id: oldMember.user.id,
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
