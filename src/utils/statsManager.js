// utils/statsManager.js
const fs = require('fs');
const path = require('path');

const STATS_DIR = path.join(__dirname, '..', 'data');
const STATS_FILE = path.join(STATS_DIR, 'monthlyStats.json');

let stats = {
  month: '',
  users: {},
  voiceChannels: {}
};

const activeVoiceSessions = new Map(); // userId => {joinTime, channelId}


function ensureDir() {
  if (!fs.existsSync(STATS_DIR)) fs.mkdirSync(STATS_DIR, { recursive: true });
}

function loadStats() {
  ensureDir();
  if (fs.existsSync(STATS_FILE)) {
    try {
      stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    } catch (e) { console.error('Błąd wczytywania stats:', e); }
  }
  if (!stats.month) stats.month = getCurrentMonth();
  return stats;
}

function saveStats() {
  ensureDir();
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } 
  catch (e) { console.error('Błąd zapisu stats:', e); }
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getOrCreateUser(userId) {
  if (!stats.users[userId]) {
    stats.users[userId] = { messages: 0, voiceTime: 0, emojis: 0, swears: 0 };
  }
  return stats.users[userId];
}

function incrementUserStat(userId, key, amount = 1) {
  const user = getOrCreateUser(userId);
  user[key] += amount;
  saveStats();
}

function joinVoice(userId, channelId) {
  activeVoiceSessions.set(userId, { joinTime: Date.now(), channelId });
}

function leaveVoice(userId) {
  const session = activeVoiceSessions.get(userId);
  if (!session) return;
  const timeSpent = Math.floor((Date.now() - session.joinTime) / 1000);
  activeVoiceSessions.delete(userId);
  if (timeSpent < 30) return;
  const user = getOrCreateUser(userId);
  user.voiceTime += timeSpent;
  if (!stats.voiceChannels[session.channelId]) stats.voiceChannels[session.channelId] = 0;
  stats.voiceChannels[session.channelId] += timeSpent;
  saveStats();
}

async function checkMonthlyReset(client) {
  const currentMonth = getCurrentMonth();
  if (currentMonth !== stats.month && stats.month) {
    console.log(`🔄 Nowy miesiąc! Wysyłam podsumowanie za ${stats.month}`);
    await sendMonthlySummary(client, { ...stats });
    // reset
    stats = { month: currentMonth, users: {}, voiceChannels: {} };
    saveStats();
  }
}

async function sendMonthlySummary(client, oldStats) {
  try {
    const channel = await client.channels.fetch('1083113537293008988').catch(() => null);
    if (!channel) return console.error('❌ Nie znaleziono kanału #czat');

    const usersArray = Object.entries(oldStats.users)
      .map(([userId, data]) => ({ userId, ...data }))
      .filter(u => u.messages > 0 || u.voiceTime > 0);

    const topMessages = [...usersArray].sort((a,b) => b.messages - a.messages).slice(0,5);
    const topVoice = [...usersArray].sort((a,b) => b.voiceTime - a.voiceTime).slice(0,5);
    const topEmojis = usersArray.sort((a,b) => b.emojis - a.emojis)[0];
    const topSwears = usersArray.sort((a,b) => b.swears - a.swears)[0];

    let topVC = { name: 'Brak danych', time: 0 };
    if (Object.keys(oldStats.voiceChannels).length) {
      const [chId, sec] = Object.entries(oldStats.voiceChannels).sort((a,b) => b[1]-a[1])[0];
      const vc = await client.channels.fetch(chId).catch(() => null);
      topVC = { name: vc?.name || chId, time: sec };
    }

    const formatTime = s => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return h ? `${h}g ${m}m` : `${m}m`;
    };

    const embed = {
      color: 0x0099ff,
      title: `📊 Podsumowanie miesiąca ${oldStats.month}`,
      description: 'Ranking aktywności serwera',
      fields: [
        { name: '🏆 Top 5 Wiadomości', value: topMessages.map((u,i) => `${i+1}. <@${u.userId}> — **${u.messages}** msg`).join('\n') || '—', inline: false },
        { name: '🎤 Top 5 Czas na VC', value: topVoice.map((u,i) => `${i+1}. <@${u.userId}> — **${formatTime(u.voiceTime)}**`).join('\n') || '—', inline: false },
        { name: '😀 Najwięcej emotek', value: topEmojis ? `<@${topEmojis.userId}> — **${topEmojis.emojis}**` : '—', inline: true },
        { name: '🤬 Najwięcej przekleństw', value: topSwears ? `<@${topSwears.userId}> — **${topSwears.swears}**` : '—', inline: true },
        { name: '🔊 Najaktywniejszy kanał głosowy', value: `**${topVC.name}** — **${formatTime(topVC.time)}**`, inline: false }
      ],
      timestamp: new Date()
    };

    await channel.send({ embeds: [embed] });
    console.log('✅ Podsumowanie miesięczne wysłane na #czat');
  } catch (err) {
    console.error('Błąd wysyłania podsumowania:', err);
  }
}

module.exports = {
  loadStats,
  incrementUserStat,
  joinVoice,
  leaveVoice,
  checkMonthlyReset,
  swearWords
};