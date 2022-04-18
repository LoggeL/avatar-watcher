const knex = require('knex')({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: './data.sqlite',
  },
  useNullAsDefault: true,
})

knex.schema
  .hasTable('avatar')
  .then(function (exists) {
    if (!exists) {
      knex.schema.createTable('avatar', function (t) {
        t.increments('id').primary()
        t.string('user_id')
        t.string('url')
        t.string('type')
        t.timestamp('changed_at').defaultTo(knex.fn.now())
      })
    }
  })
  .finally(() => {
    knex.destroy()
  })
