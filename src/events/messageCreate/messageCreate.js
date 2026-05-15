const { incrementUserStat, swearWords } = require('../../utils/statsManager');

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot || message.partial) return;

  incrementUserStat(message.author.id, 'messages');

  const content = message.content.toLowerCase();

  // 1. Unicode emojis
  const unicodeRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;

  // 2. Custom Discord emojis (normalne i animowane)
  const customEmojiRegex = /<a?:[a-zA-Z0-9_]+:\d{17,20}>/g;

  const unicodeCount = (message.content.match(unicodeRegex) || []).length;
  const customCount = (message.content.match(customEmojiRegex) || []).length;

  const totalEmojis = unicodeCount + customCount;

  if (totalEmojis > 0) {
    incrementUserStat(message.author.id, 'emojis', totalEmojis);
  }

  // Przekleństwa
  let swearCount = 0;
  const words = content.split(/\s+/);
  for (let word of words) {
    word = word.replace(/[^\w]/g, '');
    if (swearWords.includes(word)) swearCount++;
  }
  if (swearCount) incrementUserStat(message.author.id, 'swears', swearCount);
};