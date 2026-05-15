const { testServer } = require('../../../config.json');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands();

    // ←←← TO JEST NAJWAŻNIEJSZA ZMIANA
    const guildIds = Array.isArray(testServer) 
      ? testServer 
      : [testServer].filter(Boolean);

    for (const guildId of guildIds) {
      const applicationCommands = await getApplicationCommands(client, guildId);

      for (const localCommand of localCommands) {
        const { name, description, options } = localCommand;

        const existingCommand = await applicationCommands.cache.find(
          (cmd) => cmd.name === name
        );

        if (existingCommand) {
          if (localCommand.deleted) {
            await applicationCommands.delete(existingCommand.id);
            console.log(`🗑 Deleted command "${name}" on guild ${guildId}.`);
            continue;
          }

          if (areCommandsDifferent(existingCommand, localCommand)) {
            await applicationCommands.edit(existingCommand.id, { description, options });
            console.log(`🔁 Edited command "${name}" on guild ${guildId}.`);
          }
        } else {
          if (localCommand.deleted) {
            console.log(`⏩ Skipping command "${name}" on guild ${guildId}.`);
            continue;
          }

          await applicationCommands.create({ name, description, options });
          console.log(`👍 Registered command "${name}" on guild ${guildId}.`);
        }
      }
    }
  } catch (error) {
    console.log(`🛑 There was an error:\n${error}`);
  }
};