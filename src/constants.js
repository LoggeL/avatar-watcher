/** Avatar type constants stored in the database. */
const AVATAR_TYPES = {
  AVATAR: 'avatar',
  BANNER: 'banner',
  GUILD_AVATAR: 'guildAvatar',
};

/** Default image extension for Discord CDN URLs. */
const DEFAULT_IMAGE_EXT = 'png';

/** Approximate delay (seconds) between Discord event and delivery. */
const EVENT_DELAY_SECONDS = 20;

module.exports = { AVATAR_TYPES, DEFAULT_IMAGE_EXT, EVENT_DELAY_SECONDS };
