const {ActivityType} = require('discord.js');

module.exports = (client) => {
  console.log(`${client.user.tag} is online.`);
  console.log(`successfully finished startup`);

  client.user.setActivity({
    name: 'Najmroczniejszy Bot',
    type: ActivityType.Custom,
});
};
