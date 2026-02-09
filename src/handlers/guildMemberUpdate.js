const db = require('../db');
const { AVATAR_TYPES, DEFAULT_IMAGE_EXT } = require('../constants');

/**
 * Handle guild-specific avatar changes.
 */
module.exports = function createGuildMemberUpdateHandler(webhookClient) {
  return async (_oldMember, newMember) => {
    try {
      const { user } = newMember;
      console.log('guildMemberUpdate', user.tag);

      const newAvatarUrl = newMember.avatarURL({
        extension: DEFAULT_IMAGE_EXT,
      });
      if (!newAvatarUrl) return;

      const latest = await db.getLatestEntry(
        user.id,
        AVATAR_TYPES.GUILD_AVATAR
      );
      if (latest && latest.url === newAvatarUrl) return;

      const timestamp = Math.round(Date.now() / 1000);
      const msg = await webhookClient.send({
        username: `${user.tag} - New Guild Avatar`,
        avatarURL: newAvatarUrl,
        content:
          `[<t:${timestamp}:R>] \`${user.tag}\`` +
          ' has changed their guild avatar!',
        files: [newAvatarUrl],
      });

      const attachment = msg.attachments.first();
      if (!attachment) {
        console.error(
          `No attachment returned for guild avatar of ${user.tag}`
        );
        return;
      }

      await db.insertEntry(user.id, attachment.url, AVATAR_TYPES.GUILD_AVATAR);
      console.log(`Archived guild avatar for ${user.tag}`);
    } catch (error) {
      console.error(
        `Error in guildMemberUpdate for ${newMember?.user?.tag}:`,
        error
      );
    }
  };
};
