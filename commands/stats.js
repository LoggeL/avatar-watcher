module.exports = {
    data: {
        "name": "stats",
        "description": "Get all stats for a user",
        "options": [
        {
            "type": 6,
            "name": "target",
            "description": "Info about a user"
        }, {
            "type": 5,
            "name": "hidden",
            "description": "Do you wish to see the output as an ephemeral message?"
        }]
    },
    execute: async (interaction) => {
        const user = interaction.options.getUser('target') || interaction.user
        const hidden = interaction.options.getBoolean('hidden')
        console.log('Execute', user.tag)
        const knex = interaction.knex
        const last = await knex('avatar').select('url', 'changed_at').where({
            user_id: user.id
        }).orderBy('id', 'desc').first()
        if (!last) return await interaction.reply({
            content: "This user didn't change his avatar recently",
            ephemeral: hidden,
        })
        const stats = await knex('avatar').select('type', 'type').where({
            user_id: user.id
        }).count('type as count')
        const output = stats.map((e) => `${e.type}: ${e.count}`).join('\n') + `\nLast Avatar: ${last.url}\nChanged: <t:${Math.floor(
        last.changed_at / 1000
      )}:R>`
        await interaction.reply({
            content: output,
            ephemeral: hidden
        })
    },
}