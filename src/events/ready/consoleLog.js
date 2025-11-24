const {ActivityType} = require('discord.js');

module.exports = (client) => {
  console.log(`${client.user.tag} is online.`);
  console.log(`successfully finished startup`);

  client.user.setActivity({
    name: 'Waiting for some bread...',
    type: ActivityType.Custom,
});
};
