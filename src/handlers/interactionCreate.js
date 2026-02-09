/**
 * Dispatch slash-command interactions.
 */
module.exports = function createInteractionHandler(commands) {
  return async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing /${interaction.commandName}:`,
        error
      );

      const payload = {
        content: 'There was an error while executing this command!',
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (replyError) {
        console.error('Failed to send error response:', replyError);
      }
    }
  };
};
