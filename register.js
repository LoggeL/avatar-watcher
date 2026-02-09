const { REST, Routes } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

const clientId = '365925148601090048';

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
