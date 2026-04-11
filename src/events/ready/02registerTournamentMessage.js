// src/events/ready/02registerTournamentMessage.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const boberdb = require('../../utils/db.js');

async function ensureFetch() {
  if (typeof fetch !== 'undefined') return;
  try {
    const { default: nodeFetch } = await import('node-fetch');
    global.fetch = nodeFetch;
  } catch {
    const { fetch: undiciFetch } = await import('undici');
    global.fetch = undiciFetch;
  }
}

// ==================== CONFIG ====================
const tournamentForumChannelId = '1485713919833018478';   // Kanał forum (post)
const participantsParentChannelId = '1083113537293008988'; // Kanał nadrzędny dla prywatnego wątku uczestników
const organizersLogThreadId = '1488864545379451020';      // Wątek z logami statusów

const participantRoleId = '1488864618183921796';

const APPLICATION_COOLDOWN = 300000; // 5 minut

// Data zamknięcia zapisów – dokładnie 10.04.2026 23:59 Europe/Warsaw (CEST = UTC+2)
const CLOSE_DATE = new Date('2026-04-10T21:59:00Z'); // 23:59 CEST = 21:59 UTC

const userCooldowns = new Map();

function checkCooldown(userId) {
  const now = Date.now();
  const cooldownEnd = userCooldowns.get(userId);
  if (cooldownEnd && now < cooldownEnd) return Math.ceil((cooldownEnd - now) / 1000);
  return 0;
}

function setCooldown(userId) {
  userCooldowns.set(userId, Date.now() + APPLICATION_COOLDOWN);
}

// ==================== REST HELPERS ====================
async function sendComponentsV2Message(botToken, channelId, components) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
  const body = { flags: 32768, components };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
  return res.json();
}

async function editComponentsV2Message(botToken, channelId, messageId, components) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`;
  const body = { flags: 32768, components };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to edit: ${res.status}`);
  return res.json();
}

// ==================== WYŁĄCZENIE PRZYCISKU "ZAPISZ SIĘ" ====================
async function disableSignupButton(client, messageId) {
  try {
    const channel = await client.channels.fetch(tournamentForumChannelId);
    const message = await channel.messages.fetch(messageId);

    // Kopiujemy komponenty i wyłączamy tylko pierwszy przycisk (Zapisz się)
    const newComponents = message.components.map(row => {
      if (row.components && row.components[0] && row.components[0].customId === 'c611d7f7d90d49dfe5c2723e662d93c1') {
        return {
          type: 1,
          components: [
            { ...row.components[0], disabled: true },           // Zapisz się → disabled
            { ...row.components[1] }                            // drugi przycisk bez zmian
          ]
        };
      }
      return row;
    });

    await editComponentsV2Message(process.env.TOKEN, tournamentForumChannelId, messageId, newComponents);
    console.log('✅ Przycisk "Zapisz się do turnieju" został automatycznie wyłączony (10.04.2026 23:59)');
  } catch (err) {
    console.error('❌ Nie udało się wyłączyć przycisku:', err);
  }
}

// ==================== GŁÓWNY EKSPORT ====================
module.exports = async (client) => {
  try {
    await ensureFetch();
    const TOKEN = process.env.TOKEN;
    if (!TOKEN) throw new Error('Brak tokena');

    const forumChannel = await client.channels.fetch(tournamentForumChannelId);
    if (!forumChannel) return console.log('❌ Forum channel not found');

    // ==================== FINALNA STRUKTURA Components V2 ====================
    const components = [
      { type: 10, content: "Zapisy na turniej Dziupla Masters ruszyły! <@&1083113535736922149>" },
      {
        type: 17,
        accent_color: 15105570,
        spoiler: false,
        components: [
          {
            type: 9,
            accessory: { type: 11, media: { url: "https://i.imgur.com/usJfqHP.png" }, description: null, spoiler: false },
            components: [
              { type: 10, content: "# ⚔️ Turniej PvP - Dziupla Masters" },
              { type: 10, content: "🗓️ Turniej odbędzie się <t:1775930400:d>" },
              { type: 10, content: "Dla uczestników turnieju zostanie przypisana rola w celu dalszej organizacji." }
            ]
          },
          { type: 14, divider: true, spacing: 2 },
          { type: 10, content: "## Najważniejsze zasady turniejowe:\n- Turniej został zorganizowany tylko dla członków Dziupli. Do wzięcia udziału wymagana jest przynależność do gildii oraz rola General na liście członków w grze. (Nie możesz wziąć udziału będąc nowym członkiem z listkiem).\n- Walki odbywają się na postaciach trialowych, wyposażonych w *Arsha Chest 2*.\n- Turniej będzie rozgrywany w formie rozbudowanej drabinki turniejowej. Dla zachowania balansu powstaną dwie drabinki turniejowe:\n  - dla graczy doświadczonych\n  - i dla graczy początkujących 🌱" },
          { type: 10, content: "## Zasady uczestnictwa:\n- Podanie nieprawdziwych informacji w zapisach turniejowych będzie skutkowało dyskwalifikacją uczestnika.\n- Jeżeli nie będziesz mógł wziąć udziału w turnieju __mimo wcześniejszego zapisu__, poinformuj o tym organizatorów z wyprzedzeniem.\n- Nieobecność przeciwnika oznacza **awans bez konieczności walki** do kolejnej rundy.\n- Pytania organizacyjne należy zadawać w wątku organizacyjnym do tego przeznaczonym.\n- Ekwipunek uczestników który przekracza 780 GS może być weryfikowany przed walką." },
          { type: 14, divider: true, spacing: 1 },
          { type: 12, items: [{ media: { url: "https://i.imgur.com/Ad9fykN.jpeg" }, description: "Dziupla Masters grafika", spoiler: false }] },
          { type: 10, content: "📑Zapisując się na turniej w domyśle oświadczasz, że udało ci się zapoznać z zasadami turnieju i będziesz postępować zgodnie z nimi, oraz że podane przez ciebie informacje są zgodne z prawdą." },
          { type: 10, content: "Zapisując się na turniej **zwróć uwagę** na sekcję dotyczącą określania poziomu umiejętności. Wiemy, jak trudno jest obiektywnie ocenić samego siebie, dlatego prosimy o **dokładne** i przemyślane zaznaczenie swoich obecnych umiejętności – pomoże nam to dopasować odpowiedniego rywala." },
          { type: 10, content: "-# Po kliknięciu przycisku *zapisz się* poniżej, pojawi się formularz do wypełnienia." }
        ]
      },
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "Zapisz się do turnieju", emoji: { name: "⚔️" }, custom_id: "c611d7f7d90d49dfe5c2723e662d93c1" },
          { type: 2, style: 2, label: "Nie wezmę udziału / wypisz się z turnieju", emoji: { name: "🐓" }, custom_id: "a27b2fff15764713e4496f17931108e2" }
        ]
      },
      { type: 10, content: "-# Zapisy zostaną zamknięte <t:1775858340:f>" }
    ];

    // Znajdź/edytuj/wyślij wiadomość
    const fetched = await forumChannel.messages.fetch({ limit: 50 });
    let existing = null;
    for (const msg of fetched.values()) {
      if (msg.author?.id !== client.user?.id) continue;
      const found = msg.components?.some(r => r.components?.some(c =>
        ['c611d7f7d90d49dfe5c2723e662d93c1', 'a27b2fff15764713e4496f17931108e2'].includes(c.customId)
      ));
      if (found) { existing = msg; break; }
    }

    let result;
    if (existing) {
      result = await editComponentsV2Message(TOKEN, tournamentForumChannelId, existing.id, components);
      console.log('✅ Tournament message updated on forum');
    } else {
      result = await sendComponentsV2Message(TOKEN, tournamentForumChannelId, components);
      console.log('✅ New tournament message created on forum');
    }

    client._tournamentMessageId = result?.id ?? existing?.id;

// Tworzenie wątku uczestników
    client._participantsThread = await getOrCreateParticipantsThread(client, participantsParentChannelId);

    // Automatyczne wyłączenie przycisku 10.04.2026 23:59
    const now = Date.now();
    const timeToClose = CLOSE_DATE.getTime() - now;

    if (timeToClose > 0) {
      console.log(`⏰ Przycisk "Zapisz się" zostanie wyłączony za ${Math.round(timeToClose / 3600000)} godzin`);
      setTimeout(() => disableSignupButton(client, client._tournamentMessageId), timeToClose);
    } else {
      console.log('⚠️ Termin zamknięcia już minął – wyłączam przycisk natychmiast');
      await disableSignupButton(client, client._tournamentMessageId);
    }

    // ==================== COLLECTOR ====================
    let discordMessage = await forumChannel.messages.fetch(client._tournamentMessageId).catch(() => null);
    if (discordMessage) {
      if (client._tournamentCollector) client._tournamentCollector.stop();
      const collector = discordMessage.createMessageComponentCollector({ time: 0 });

      collector.on('collect', async (interaction) => {
        if (checkCooldown(interaction.user.id) > 0) {
          return interaction.reply({ content: `⏰ Poczekaj ${checkCooldown(interaction.user.id)} sekund.`, ephemeral: true });
        }

        if (interaction.customId === 'c611d7f7d90d49dfe5c2723e662d93c1') {
          await interaction.showModal(buildTournamentModal());
        } else if (interaction.customId === 'a27b2fff15764713e4496f17931108e2') {
          await handleNoOrUnregister(interaction, client);
        }
      });

      client._tournamentCollector = collector;
    }

    // ==================== MODAL SUBMIT ====================
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit() || interaction.customId !== 'tournament_modal') return;
      await interaction.deferReply({ ephemeral: true });

      if (checkCooldown(interaction.user.id) > 0) {
        return interaction.editReply({ content: `⏰ Poczekaj ${checkCooldown(interaction.user.id)} sekund.` });
      }

      await handleTournamentSignup(interaction, client);
    });

  } catch (err) {
    console.error('❌ Tournament setup error:', err);
  }
};

// ==================== TWORZENIE PRYWATNEGO WĄTKU UCZESTNIKÓW ====================
async function getOrCreateParticipantsThread(client, parentChannelId) {
  const threadName = "🏆 Dziupla Masters - Uczestnicy";

  const parentChannel = await client.channels.fetch(parentChannelId);
  if (!parentChannel) {
    console.error('❌ Nie znaleziono kanału nadrzędnego dla wątku uczestników');
    return null;
  }

  const activeThreads = await parentChannel.threads.fetchActive();
  let thread = activeThreads.threads.find(t => t.name === threadName);

  if (!thread) {
    thread = await parentChannel.threads.create({
      name: threadName,
      autoArchiveDuration: 10080,
      type: ChannelType.PrivateThread,
      reason: 'Prywatny wątek dla uczestników turnieju Dziupla Masters'
    });

    const firstMsg = await thread.send({
      content: `Wątek organizacyjny dla turnieju Dziupla **Masters** ⚔️`
    });
    await firstMsg.pin().catch(() => {});
    console.log(`✅ Utworzono prywatny wątek uczestników: ${thread.id}`);
  }

  client._participantsThreadId = thread.id;
  return thread;
}

// ==================== MODAL ====================
function buildTournamentModal() {
  return {
    custom_id: 'tournament_modal',
    title: '🎟️ Zapisy na Dziupla Masters',
    components: [
      { type: 18, label: 'Oceń swoje doświadczenie w PvP:', component: { type: 21, custom_id: 'pvp_experience', options: [
        { value: '0', label: 'Kompletny brak doświadczenia'}, { value: '1', label: 'Wiem jak działa moja postać'},
        { value: '2', label: 'Podstawowe doświadczenie', description: 'znam mechaniki swojej klasy, ale nie walczyłem dużo z innymi graczami'},
        { value: '3', label: 'Umiem walczyć i znam mechaniki PvP', description: 'wiem co to: iframe, knockdown, super armor, cc, itp.'},
        { value: '4', label: 'Grałem AoS i mam duże doświadczenie w PvP'},
        { value: '5', label: 'Jestem ekspertem w PvP', description: 'duże doświadczenie, częste walki PvP, znajomość wielu klas, itp.'}
      ]}},
      { type: 18, label: 'Podaj klasę postaci którą użyjesz w turnieju', component: { type: 4, custom_id: 'character_class', style: 1, placeholder: 'np. Dark Knight', min_length: 1, max_length: 30, required: true }},
      { type: 18, label: 'Czy kiedyś brałeś udział w Node War?', component: { type: 21, custom_id: 'node_war', options: [
        { value: 'Tak', label: 'Tak' }, { value: 'Nie', label: 'Nie' }
      ]}},
      { type: 18, label: 'Podaj czas spędzony w grze:', component: { type: 3, custom_id: 'playtime', placeholder: 'Wybierz zakres', options: [
        { label: '0-500 godz', value: '0-500 godz' }, { label: '501-1000 godz', value: '501-1000 godz' },
        { label: '1001-3000 godz', value: '1001-3000 godz' }, { label: '3001-6000 godz', value: '3001-6000 godz' },
        { label: '6001-10000 godz', value: '6001-10000 godz' }, { label: '10000+ godz', value: '10000+ godz' }
      ]}},
      { type: 18, label: 'Orientacyjna liczba postaci na koncie:', component: { type: 3, custom_id: 'characters_count', placeholder: 'Wybierz', options: [
        { label: '1-5', value: '1-5' }, { label: '6-11', value: '6-11' }, { label: '12-18', value: '12-18' },
        { label: '19-25', value: '19-25' }, { label: '25+', value: '25+' }
      ]}}
    ]
  };
}

// ==================== LOGI DO WĄTKU ORGANIZACYJNEGO ====================
async function sendTournamentLog(client, user, type, data = {}) {
  const thread = await client.channels.fetch(organizersLogThreadId).catch(() => null);
  if (!thread) return;

  let embed;
  if (type === 'signup') {
    embed = new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Zapisał się do turnieju')
      .setDescription(`**${user}** dołączył do zapisów`)
      .addFields(
        { name: 'Doświadczenie PvP', value: `\`\`\`${data.pvpExp}/5\`\`\``, inline: true },
        { name: 'Klasa', value: `\`\`\`${data.characterClass}\`\`\``, inline: true },
        { name: 'Node War', value: `\`\`\`${data.nodeWar}\`\`\``, inline: true },
        { name: 'Czas w grze', value: `\`\`\`${data.playtime}\`\`\``, inline: true },
        { name: 'Liczba postaci', value: `\`\`\`${data.charactersCount}\`\`\``, inline: true }
      )
      .setTimestamp();
  } else if (type === 'unregister') {
    embed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Wypisał się z turnieju')
      .setDescription(`**${user}** został wypisany`).setTimestamp();
  } else if (type === 'no_participation') {
    embed = new EmbedBuilder().setColor(0x808080).setTitle('📌 Nie bierze udziału')
      .setDescription(`**${user}** potwierdził, że nie bierze udziału`).setTimestamp();
  }
  await thread.send({ embeds: [embed] }).catch(() => {});
}

// ==================== ZAPIS Z MODALA ====================
async function handleTournamentSignup(interaction, client) {
  try {
    const pvpExp = interaction.fields.getField('pvp_experience')?.value ?? '0';
    const characterClass = interaction.fields.getTextInputValue('character_class');
    const nodeWar = interaction.fields.getField('node_war')?.value ?? 'Nie';
    const playtime = interaction.fields.getStringSelectValues?.('playtime')?.[0] ?? '';
    const charactersCount = interaction.fields.getStringSelectValues?.('characters_count')?.[0] ?? '';

    setCooldown(interaction.user.id);

    await boberdb.query(
      `INSERT INTO tournament_signups 
       (user_id, display_name, participation, pvp_experience, character_class, node_war_participation, playtime, characters_count)
       VALUES (?, ?, 'TAK', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       participation = 'TAK', pvp_experience = VALUES(pvp_experience),
       character_class = VALUES(character_class), node_war_participation = VALUES(node_war_participation),
       playtime = VALUES(playtime), characters_count = VALUES(characters_count), updated_at = CURRENT_TIMESTAMP`,
      [interaction.user.id, interaction.member?.displayName ?? interaction.user.username, parseInt(pvpExp), characterClass, nodeWar, playtime, charactersCount]
    );

    if (interaction.member) await interaction.member.roles.add(participantRoleId).catch(() => {});

    if (client._participantsThreadId) {
      const thread = await client.channels.fetch(client._participantsThreadId).catch(() => null);
      if (thread) await thread.members.add(interaction.user.id).catch(() => {});
    }

    await sendTournamentLog(client, interaction.user, 'signup', { pvpExp, characterClass, nodeWar, playtime, charactersCount });

    await interaction.editReply({
      content: `✅ **Zapisano do turnieju!**\nDoświadczenie PvP: **${pvpExp}/5**\nKlasa: **${characterClass}**`
    });
  } catch (err) {
    console.error(err);
    await interaction.editReply({ content: '❌ Błąd podczas zapisywania.' });
  }
}

// ==================== NIE WEZMĘ UDZIAŁU / WYPISZ SIĘ ====================
async function handleNoOrUnregister(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  const [rows] = await boberdb.query(
    'SELECT participation FROM tournament_signups WHERE user_id = ?',
    [interaction.user.id]
  );

  const wasSigned = rows.length > 0 && rows[0].participation === 'TAK';

  if (wasSigned) {
    await boberdb.query(
      `UPDATE tournament_signups SET participation = 'NIE', updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [interaction.user.id]
    );

    if (interaction.member) await interaction.member.roles.remove(participantRoleId).catch(() => {});

    if (client._participantsThreadId) {
      const thread = await client.channels.fetch(client._participantsThreadId).catch(() => null);
      if (thread) await thread.members.remove(interaction.user.id).catch(() => {});
    }

    await sendTournamentLog(client, interaction.user, 'unregister');
    await interaction.editReply({ content: '✅ **Zostałeś wypisany z turnieju.**' });
  } else {
    await boberdb.query(
      `INSERT INTO tournament_signups (user_id, display_name, participation)
       VALUES (?, ?, 'NIE')
       ON DUPLICATE KEY UPDATE participation = 'NIE', updated_at = CURRENT_TIMESTAMP`,
      [interaction.user.id, interaction.member?.displayName ?? interaction.user.username]
    );

    await sendTournamentLog(client, interaction.user, 'no_participation');
    await interaction.editReply({
      content: '✅ **Potwierdzono – nie bierzesz udziału.**\n\nJeżeli zmienisz zdanie, kliknij **Zapisz się do turnieju**.'
    });
  }
}