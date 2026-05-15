// src/events/ready/worldBossReminder.js
const cron = require('node-cron');

// CONFIG - WORLD BOSSES (całkowicie inny serwer niż gildyjny)
const worldBossGuildId = '1482039189657878600'; // Serwer na którym działają world bossy
const dayChannelId = '1482040805446254802';     // ☀️ daily-bosses
const nightChannelId = '1482040856801316924';   // 🌕 night-bosses
const allChannelId = '1482041044047757313';     // ⏰ 24-bosses

// Mapa boss → ID roli (dokładnie tak jak podałeś)
const bossRoleMap = {
  'Uturi': '1482048747881107566',
  'Kutum': '1482048530783928330',
  'Sangoon': '1482048801987367064',
  'Karanda': '1482048492099731659',
  'Golden Pig King': '1482048857796772001',
  'Kzarka': '1482048422277021825',
  'Nouver': '1482048567672836127',
  'Bulgasal': '1482048917188116671',
  'Garmoth': '1482039806245732534',
  'Offin': '1482048972255399956',
  'Black Shadow': '1482049202853773312',
  'Vell': '1482039750323077151',
  'Quint': '1482049032103657514',
  'Muraka': '1482049058699743272',
  'Egg': '1482127126210678825',
};

// Pełny harmonogram world bossów (wyodrębniony z obrazka)
// Każdy wpis = jeden respawn (duety = dwie role)
const bossEvents = [
  // 00:15
  { weekday: 1, hour: 0, minute: 15, bosses: ['Uturi', 'Kutum'] },           // Monday
  { weekday: 2, hour: 0, minute: 15, bosses: ['Sangoon', 'Karanda'] },       // Tuesday
  { weekday: 3, hour: 0, minute: 15, bosses: ['Golden Pig King', 'Kzarka'] },
  { weekday: 4, hour: 0, minute: 15, bosses: ['Uturi', 'Nouver'] },
  { weekday: 5, hour: 0, minute: 15, bosses: ['Golden Pig King', 'Karanda'] },
  { weekday: 6, hour: 0, minute: 15, bosses: ['Bulgasal', 'Kzarka'] },
  { weekday: 0, hour: 0, minute: 15, bosses: ['Bulgasal', 'Nouver'] },       // Sunday

  // 02:00
  { weekday: 1, hour: 2, minute: 0, bosses: ['Sangoon', 'Karanda'] },
  { weekday: 4, hour: 2, minute: 0, bosses: ['Golden Pig King', 'Kzarka'] },
  { weekday: 5, hour: 2, minute: 0, bosses: ['Bulgasal', 'Nouver'] },
  { weekday: 6, hour: 2, minute: 0, bosses: ['Uturi', 'Offin'] },
  { weekday: 0, hour: 2, minute: 0, bosses: ['Golden Pig King', 'Kutum'] },

  // 12:00
  { weekday: 1, hour: 12, minute: 0, bosses: ['Sangoon', 'Nouver'] },
  { weekday: 2, hour: 12, minute: 0, bosses: ['Bulgasal', 'Kutum'] },
  { weekday: 3, hour: 12, minute: 0, bosses: ['Sangoon', 'Karanda'] },
  { weekday: 5, hour: 12, minute: 0, bosses: ['Uturi', 'Kutum'] },
  { weekday: 6, hour: 12, minute: 0, bosses: ['Golden Pig King', 'Nouver'] },
  { weekday: 0, hour: 12, minute: 0, bosses: ['Uturi', 'Kzarka'] },

  // 14:00 – Garmoth codziennie
  { weekday: 1, hour: 14, minute: 0, bosses: ['Garmoth'] },
  { weekday: 2, hour: 14, minute: 0, bosses: ['Garmoth'] },
  { weekday: 3, hour: 14, minute: 0, bosses: ['Garmoth'] },
  { weekday: 4, hour: 14, minute: 0, bosses: ['Garmoth'] },
  { weekday: 5, hour: 14, minute: 0, bosses: ['Garmoth'] },
  { weekday: 6, hour: 14, minute: 0, bosses: ['Garmoth'] },
  { weekday: 0, hour: 14, minute: 0, bosses: ['Garmoth'] },

  // 16:00
  { weekday: 1, hour: 16, minute: 0, bosses: ['Uturi', 'Kutum'] },
  { weekday: 2, hour: 16, minute: 0, bosses: ['Golden Pig King', 'Nouver'] },
  { weekday: 3, hour: 16, minute: 0, bosses: ['Bulgasal', 'Offin'] },
  { weekday: 4, hour: 16, minute: 0, bosses: ['Sangoon', 'Karanda'] },
  { weekday: 5, hour: 16, minute: 0, bosses: ['Bulgasal', 'Kzarka'] },
  { weekday: 6, hour: 16, minute: 0, bosses: ['Black Shadow'] },
  { weekday: 0, hour: 16, minute: 0, bosses: ['Vell'] },

  // 19:00
  { weekday: 1, hour: 19, minute: 0, bosses: ['Golden Pig King', 'Nouver'] },
  { weekday: 2, hour: 19, minute: 0, bosses: ['Uturi', 'Kzarka'] },
  { weekday: 3, hour: 19, minute: 0, bosses: ['Vell'] },
  { weekday: 4, hour: 19, minute: 0, bosses: ['Bulgasal', 'Kutum'] },
  { weekday: 5, hour: 19, minute: 0, bosses: ['Sangoon', 'Offin'] },
  { weekday: 6, hour: 19, minute: 0, bosses: ['Sangoon', 'Karanda'] },

  // 19:15 – tylko niedziela
  { weekday: 0, hour: 19, minute: 15, bosses: ['Garmoth'] },

  // 22:15
  { weekday: 1, hour: 22, minute: 15, bosses: ['Bulgasal', 'Kzarka'] },
  { weekday: 2, hour: 22, minute: 15, bosses: ['Quint', 'Muraka'] },
  { weekday: 3, hour: 22, minute: 15, bosses: ['Uturi', 'Nouver'] },
  { weekday: 4, hour: 22, minute: 15, bosses: ['Quint', 'Muraka'] },
  { weekday: 5, hour: 22, minute: 15, bosses: ['Golden Pig King', 'Kutum'] },
  { weekday: 0, hour: 22, minute: 15, bosses: ['Sangoon', 'Karanda'] },

  // 23:15 – Garmoth (bez soboty)
  { weekday: 1, hour: 23, minute: 15, bosses: ['Garmoth'] },
  { weekday: 2, hour: 23, minute: 15, bosses: ['Garmoth'] },
  { weekday: 3, hour: 23, minute: 15, bosses: ['Garmoth'] },
  { weekday: 4, hour: 23, minute: 15, bosses: ['Garmoth'] },
  { weekday: 5, hour: 23, minute: 15, bosses: ['Garmoth'] },
  { weekday: 0, hour: 23, minute: 15, bosses: ['Garmoth'] },

  // Egg codziennie o 09:30, 18:30 i 22:45
  // { weekday: 1, hour: 9, minute: 30, bosses: ['Egg'] },
  // { weekday: 2, hour: 9, minute: 30, bosses: ['Egg'] },
  // { weekday: 3, hour: 9, minute: 30, bosses: ['Egg'] },
  // { weekday: 4, hour: 9, minute: 30, bosses: ['Egg'] },
  // { weekday: 5, hour: 9, minute: 30, bosses: ['Egg'] },
  // { weekday: 6, hour: 9, minute: 30, bosses: ['Egg'] },
  // { weekday: 0, hour: 9, minute: 30, bosses: ['Egg'] },

  // { weekday: 1, hour: 18, minute: 30, bosses: ['Egg'] },
  // { weekday: 2, hour: 18, minute: 30, bosses: ['Egg'] },
  // { weekday: 3, hour: 18, minute: 30, bosses: ['Egg'] },
  // { weekday: 4, hour: 18, minute: 30, bosses: ['Egg'] },
  // { weekday: 5, hour: 18, minute: 30, bosses: ['Egg'] },
  // { weekday: 6, hour: 18, minute: 30, bosses: ['Egg'] },
  // { weekday: 0, hour: 18, minute: 30, bosses: ['Egg'] },

  // { weekday: 1, hour: 22, minute: 45, bosses: ['Egg'] },
  // { weekday: 2, hour: 22, minute: 45, bosses: ['Egg'] },
  // { weekday: 3, hour: 22, minute: 45, bosses: ['Egg'] },
  // { weekday: 4, hour: 22, minute: 45, bosses: ['Egg'] }, 
  // { weekday: 5, hour: 22, minute: 45, bosses: ['Egg'] },
  // { weekday: 6, hour: 22, minute: 45, bosses: ['Egg'] },
  // { weekday: 0, hour: 22, minute: 45, bosses: ['Egg'] },
];

module.exports = async (client) => {
  try {
    // Sprawdź czy bot jest na odpowiednim serwerze (żeby nie wysyłać pingów na głównym)
    const guild = await client.guilds.fetch(worldBossGuildId).catch(() => null);
    if (!guild) {
      console.log('❌ World boss server (1482039189657878600) not found – reminder setup skipped');
      return;
    }

    // Flaga zapobiegająca duplikatom po restarcie bota
    if (!global.worldBossReminderCronsSet) {
      global.worldBossReminderCronsSet = true;

      bossEvents.forEach((event) => {
        // Oblicz czas przypomnienia (10 minut wcześniej)
        let reminderMinute = event.minute - 10;
        let reminderHour = event.hour;
        if (reminderMinute < 0) {
          reminderMinute += 60;
          reminderHour--;
          if (reminderHour < 0) reminderHour += 24;
        }

        const cronExpression = `${reminderMinute} ${reminderHour} * * ${event.weekday}`;

        cron.schedule(cronExpression, async () => {
          try {
            const now = new Date();

            // Oblicz dokładny timestamp respawnu (w tej samej strefie)
            const spawnDate = new Date(now);
            spawnDate.setHours(event.hour, event.minute, 0, 0);
            // Jeśli jakimś cudem jesteśmy już po czasie (bardzo mało prawdopodobne)
            if (spawnDate.getTime() < now.getTime()) {
              spawnDate.setDate(spawnDate.getDate() + 7);
            }

            const spawnTimestamp = Math.floor(spawnDate.getTime() / 1000);

            // Pingi ról (duety = dwa pingi)
            const rolePings = event.bosses
              .map(boss => bossRoleMap[boss] ? `<@&${bossRoleMap[boss]}>` : '')
              .filter(Boolean)
              .join(' ');

            if (!rolePings) return;

            const content = `${rolePings} spawning <t:${spawnTimestamp}:R>`;

            // Wybór kanałów zgodnie z Twoją regułą
            const isNight = event.hour < 7; // 00:00–06:59 = night
            const targetChannels = isNight
              ? [nightChannelId, allChannelId]
              : [dayChannelId, allChannelId];

            // Wyślij na oba kanały
            for (const channelId of targetChannels) {
              const channel = await client.channels.fetch(channelId).catch(() => null);
              if (channel?.isTextBased()) {
                await channel.send(content);
              }
            }

            console.log(`✅ World boss reminder sent: ${event.bosses.join(' + ')} (${event.hour}:${event.minute})`);
          } catch (err) {
            console.error('❌ Error sending world boss reminder:', err);
          }
        }, { timezone: 'Europe/Warsaw' });
      });

      console.log(`✅ World boss reminder setup complete – ${bossEvents.length} schedules`);
    }
  } catch (err) {
    console.error('❌ Error setting up world boss reminder:', err);
  }
};