const { loadStats, checkMonthlyReset } = require('../../utils/statsManager');

module.exports = async (client) => {
  loadStats();
  console.log('📊 System statystyk miesięcznych uruchomiony.');

  // natychmiastowe sprawdzenie + co 5 minut
  checkMonthlyReset(client);
  setInterval(() => checkMonthlyReset(client), 5 * 60 * 1000);
};