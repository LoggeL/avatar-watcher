const db = require('../src/db');

module.exports = {
  data: {
    name: 'stats',
    description: 'Get all stats for a user',
    options: [
      {
        type: 6,
        name: 'target',
        description: 'Info about a user',
      },
      {
        type: 5,
        name: 'hidden',
        description:
          'Do you wish to see the output as an ephemeral message?',
      },
    ],
  },

  execute: async (interaction) => {
    const user = interaction.options.getUser('target') || interaction.user;
    const hidden = interaction.options.getBoolean('hidden') ?? false;

    console.log(`/stats executed for ${user.tag}`);

    const last = await db.getPreviousEntry(user.id);
    if (!last) {
      return interaction.reply({
        content: 'This user hasn\'t changed their avatar recently.',
        ephemeral: hidden,
      });
    }

    const stats = await db.getUserStats(user.id);
    const lines = stats.map((e) => `${e.type}: ${e.count}`);
    const changedAt = Math.floor(last.changed_at / 1000);

    const output =
      lines.join('\n') +
      `\nLast Avatar: ${last.url}` +
      `\nChanged: <t:${changedAt}:R>`;

    await interaction.reply({ content: output, ephemeral: hidden });
  },
};
