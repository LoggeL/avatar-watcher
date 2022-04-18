const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Get all stats for a user')
    .setDescription('Info about a user')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user')
    ),
  execute: async (interaction) => {
    const user = interaction.options.getUser('target')
      ? interaction.options.getUser('target')
      : interaction.user

    console.log('Execute', user.tag)

    const knex = interaction.knex

    const stats = await knex('avatar')
      .select('type', 'type')
      .where({ user_id: user.id })
      .count('type as count')

    const last = await knex('avatar')
      .select('url', 'changed_at')
      .where({ user_id: user.id })
      .orderBy('id', 'desc')
      .first()

    console.log(last)

    const output =
      stats.map((e) => `${e.type}: ${e.count}`).join('\n') +
      `\nLast Avatar: ${last.url}\nChanged: <t:${Math.floor(
        new Date(last.changed_at) / 1000
      )}:R>`

    await interaction.reply({ content: output, ephemeral: true })
  },
}
