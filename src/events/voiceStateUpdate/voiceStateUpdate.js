const { joinVoice, leaveVoice } = require('../../utils/statsManager');

module.exports = async (client, oldState, newState) => {
  const userId = newState.member?.id || newState.id;
  if (!userId) return;

  if (oldState.channelId !== newState.channelId) {
    if (oldState.channelId) leaveVoice(userId);
    if (newState.channelId) joinVoice(userId, newState.channelId);
  }
};