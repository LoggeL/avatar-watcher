const db = require('../db');
const {
  AVATAR_TYPES,
  DEFAULT_IMAGE_EXT,
  EVENT_DELAY_SECONDS,
} = require('../constants');

/**
 * Upload an image to the storage webhook and persist the CDN URL.
 */
async function archiveImage(webhookClient, user, imageUrl, type, label) {
  const timestamp = Math.round(Date.now() / 1000);
  const offset = type === AVATAR_TYPES.AVATAR ? EVENT_DELAY_SECONDS : 0;

  const msg = await webhookClient.send({
    username: `${user.tag} - New ${label}`,
    avatarURL: imageUrl,
    content:
      `[<t:${timestamp - offset}:R>] \`${user.tag}\`` +
      ` has changed their ${label.toLowerCase()}!`,
    files: [imageUrl],
  });

  const attachment = msg.attachments.first();
  if (!attachment) {
    console.error(`No attachment returned when archiving ${label} for ${user.tag}`);
    return;
  }

  await db.insertEntry(user.id, attachment.url, type);
  console.log(`Archived ${label} for ${user.tag}`);
}

/**
 * Handle global user updates (avatar + banner).
 */
module.exports = function createUserUpdateHandler(webhookClient) {
  return async (oldUser, newUser) => {
    try {
      console.log('userUpdate', newUser.tag);

      // --- Avatar ---
      if (oldUser.avatar !== newUser.avatar) {
        const newAvatarUrl = newUser.avatarURL({
          extension: DEFAULT_IMAGE_EXT,
        });
        if (newAvatarUrl) {
          const latest = await db.getLatestEntry(
            newUser.id,
            AVATAR_TYPES.AVATAR
          );
          if (!latest || latest.url !== newAvatarUrl) {
            await archiveImage(
              webhookClient,
              newUser,
              newAvatarUrl,
              AVATAR_TYPES.AVATAR,
              'Avatar'
            );
          }
        }
      }

      // --- Banner ---
      if (oldUser.banner !== newUser.banner) {
        const fetched = await newUser.fetch();
        const newBannerUrl = fetched.bannerURL({
          extension: DEFAULT_IMAGE_EXT,
        });
        if (newBannerUrl) {
          const latest = await db.getLatestEntry(
            newUser.id,
            AVATAR_TYPES.BANNER
          );
          if (!latest || latest.url !== newBannerUrl) {
            await archiveImage(
              webhookClient,
              newUser,
              newBannerUrl,
              AVATAR_TYPES.BANNER,
              'Banner'
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error in userUpdate for ${newUser?.tag}:`, error);
    }
  };
};
