const path = require('node:path');
const knex = require('knex')({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(__dirname, '..', 'data.sqlite'),
  },
  useNullAsDefault: true,
});

/**
 * Ensure the avatar table exists. Call once at startup.
 */
async function initialize() {
  const exists = await knex.schema.hasTable('avatar');
  if (!exists) {
    await knex.schema.createTable('avatar', (t) => {
      t.increments('id').primary();
      t.string('user_id');
      t.string('url');
      t.string('type');
      t.timestamp('changed_at').defaultTo(knex.fn.now());
    });
    console.log('Created avatar table.');
  }
}

/**
 * Get the most recent entry for a user + type.
 */
async function getLatestEntry(userId, type) {
  return knex('avatar')
    .select('url', 'changed_at')
    .where({ user_id: userId, type })
    .orderBy('id', 'desc')
    .first();
}

/**
 * Insert a new avatar/banner record.
 */
async function insertEntry(userId, url, type) {
  await knex('avatar').insert({
    user_id: userId,
    url,
    type,
    changed_at: Date.now(),
  });
}

/**
 * Get stats for a user (count per type).
 */
async function getUserStats(userId) {
  return knex('avatar')
    .select('type')
    .where({ user_id: userId })
    .groupBy('type')
    .count('type as count');
}

/**
 * Get the second-most-recent entry for a user (the "previous" one).
 */
async function getPreviousEntry(userId) {
  return knex('avatar')
    .select('url', 'changed_at')
    .where({ user_id: userId })
    .orderBy('id', 'desc')
    .offset(1)
    .first();
}

/**
 * Destroy the knex connection pool (for graceful shutdown).
 */
async function destroy() {
  await knex.destroy();
}

module.exports = {
  initialize,
  getLatestEntry,
  insertEntry,
  getUserStats,
  getPreviousEntry,
  destroy,
};
