// src/events/ready/04registerTournamentMessage.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField,
  // Nowe buildery Components V2
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ContainerBuilder,
  LabelBuilder,
  RadioGroupBuilder,
  RadioButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
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
const tournamentChannelId = '1083113537683071076';
const MAIN_GUILD_ID = '1083113535577522296';
const APPLICATION_COOLDOWN = 300000; // 5 minut

const userCooldowns = new Map();

function checkCooldown(userId) {
  const now = Date.now();
  const cooldownEnd = userCooldowns.get(userId);
  if (cooldownEnd && now < cooldownEnd) {
    return Math.ceil((cooldownEnd - now) / 1000);
  }
  return 0;
}

function setCooldown(userId) {
  userCooldowns.set(userId, Date.now() + APPLICATION_COOLDOWN);
}

// ==================== REST HELPERS (jak w guild) ====================
async function sendComponentsV2Message(botToken, channelId, components) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
  const body = { flags: 32768, components };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send Components V2: ${res.status} ${text}`);
  }
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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to edit Components V2: ${res.status} ${text}`);
  }
  return res.json();
}

// ==================== GŁÓWNY EKSPORT ====================
module.exports = async (client) => {
  try {
    await ensureFetch();
    // === WYŁĄCZNOŚĆ DLA GŁÓWNEGO SERWERA ===
    if (!client.guilds.cache.has(MAIN_GUILD_ID)) {
      console.log(`✅ Boss reminder skipped – bot nie jest na serwerze ${MAIN_GUILD_ID}`);
      return;
    }

    const TOKEN = process.env.TOKEN;
    if (!TOKEN) throw new Error('Brak tokena w process.env.TOKEN');

    const channel = await client.channels.fetch(tournamentChannelId);
    if (!channel) {
      console.log('❌ Tournament channel not found');
      return;
    }

    // Sprawdź uprawnienia
    const botPermissions = channel.permissionsFor(client.user);
    if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) ||
        !botPermissions.has(PermissionsBitField.Flags.EmbedLinks) ||
        !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
      console.log('❌ Bot missing permissions in tournament channel');
      return;
    }

    // ==================== BUILD Components V2 ====================
    const components = [
      new TextDisplayBuilder().setContent("Zapisy na turniej Dziupla Masters ruszyły! <@&1083113535736922149>"),

      new ContainerBuilder()
        .setAccentColor(3553599)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("# Turniej PvP - Dziupla Masters"),
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
`### :mailbox_with_mail: __Zasady zapisów:__
- Osoby, które miały styczność z walkami na arenie lub walkami PvP ogólnie - będą postrzegane jako mające doświadczenie.
- Osoby, które nie uczestniczyły w wszelkich walkach między graczami - będą postrzegane jako niemające doświadczenia.
- Zapisanie się celowo do niewłaściwej drabinki może skutkować usunięciem z turnieju i pozbawienia możliwości zdobycia nagród.

Drabinka turniejowa będzie dobierana bazując na posiadanym doświadczeniu i klasie postaci (mecze lustrzane przed finałami).`
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder()
            .addItems(
              new MediaGalleryItemBuilder()
                .setURL("https://i.imgur.com/Aw2iG7P.png"),
            ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("Po kliknięciu przycisku poniżej, będzie formularz do wypełnienia"),
        ),

      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel("Zapisz się do turnieju")
            .setEmoji({ name: "⚔️" })
            .setCustomId("aa2574a78f024625da578ff845dd293a"), // Twój oryginalny ID

          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Nie wezmę udziału")
            .setEmoji({ name: "🚪" })
            .setCustomId("ef0463bd56ad49f5cdc5ffce9cfdc113")
        )
    ];

    // ==================== Znajdź/edytuj/wyślij wiadomość ====================
    const fetched = await channel.messages.fetch({ limit: 50 });
    let existing = null;
    for (const msg of fetched.values()) {
      if (msg.author?.id !== client.user?.id) continue;
      const found = msg.components?.some(row =>
        row.components?.some(c => 
          ['aa2574a78f024625da578ff845dd293a', 'ef0463bd56ad49f5cdc5ffce9cfdc113'].includes(c.customId)
        )
      );
      if (found) { existing = msg; break; }
    }

    let result;
    if (existing) {
      try {
        result = await editComponentsV2Message(TOKEN, tournamentChannelId, existing.id, components.map(c => c.toJSON()));
        console.log('✅ Tournament message updated (Components V2)');
      } catch (err) {
        console.error('❌ Failed to edit:', err);
        result = await sendComponentsV2Message(TOKEN, tournamentChannelId, components.map(c => c.toJSON()));
        console.log('✅ Sent new Tournament message as fallback');
      }
    } else {
      result = await sendComponentsV2Message(TOKEN, tournamentChannelId, components.map(c => c.toJSON()));
      console.log('✅ New tournament message created (Components V2)');
    }

    client._tournamentMessageId = result?.id ?? existing?.id;

    // ==================== COLLECTOR ====================
    let discordMessage = null;
    try {
      discordMessage = await channel.messages.fetch(client._tournamentMessageId);
    } catch {}

    if (discordMessage) {
      if (client._tournamentCollector) client._tournamentCollector.stop('recreating');

      const collector = discordMessage.createMessageComponentCollector({ time: 0 });

      collector.on('collect', async (interaction) => {
        const timeLeft = checkCooldown(interaction.user.id);
        if (timeLeft > 0) {
          return interaction.reply({ content: `⏰ Poczekaj ${timeLeft} sekund.`, ephemeral: true });
        }

        if (interaction.customId === 'aa2574a78f024625da578ff845dd293a') {
          // Zapisz się → modal
          const modal = buildTournamentModal();
          await interaction.showModal(modal);
        } else if (interaction.customId === 'ef0463bd56ad49f5cdc5ffce9cfdc113') {
          // Nie wezmę udziału → zapisujemy od razu
          await handleNoParticipation(interaction);
        }
      });

      client._tournamentCollector = collector;
      console.log('✅ Tournament collector ready');
    }

    // ==================== MODAL SUBMIT HANDLER ====================
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit() || interaction.customId !== 'tournament_modal') return;

      await interaction.deferReply({ ephemeral: true });

      const timeLeft = checkCooldown(interaction.user.id);
      if (timeLeft > 0) {
        return interaction.editReply({ content: `⏰ Poczekaj ${timeLeft} sekund.` });
      }

      await handleTournamentSignup(interaction);
    });

  } catch (err) {
    console.error('❌ Error in tournament message setup:', err);
  }
};

// ==================== MODAL BUILDER ====================
function buildTournamentModal() {
  const modal = new ModalBuilder()
    .setCustomId('tournament_modal')
    .setTitle('🎟️ Zapisy na Dziupla Masters');

  // Pyt.1 – Radio (0-5)
  const expRadio = new RadioGroupBuilder()
    .setCustomId('pvp_experience')
    .addOptions(
      new RadioButtonBuilder().setLabel('0').setValue('0'),
      new RadioButtonBuilder().setLabel('1').setValue('1'),
      new RadioButtonBuilder().setLabel('2').setValue('2'),
      new RadioButtonBuilder().setLabel('3').setValue('3'),
      new RadioButtonBuilder().setLabel('4').setValue('4'),
      new RadioButtonBuilder().setLabel('5').setValue('5')
    );

  // Pyt.2 – TextInput
  const classInput = new TextInputBuilder()
    .setCustomId('character_class')
    .setLabel('Klasa postaci')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // Pyt.3 – Radio Tak/Nie
  const nodeWarRadio = new RadioGroupBuilder()
    .setCustomId('node_war')
    .addOptions(
      new RadioButtonBuilder().setLabel('Tak').setValue('Tak'),
      new RadioButtonBuilder().setLabel('Nie').setValue('Nie')
    );

  // Pyt.4 – Select (czas gry)
  const playtimeSelect = new StringSelectMenuBuilder()
    .setCustomId('playtime')
    .setPlaceholder('Czas spędzony w grze')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('0-500 godz').setValue('0-500 godz'),
      new StringSelectMenuOptionBuilder().setLabel('501-1000 godz').setValue('501-1000 godz'),
      new StringSelectMenuOptionBuilder().setLabel('1001-3000 godz').setValue('1001-3000 godz'),
      new StringSelectMenuOptionBuilder().setLabel('3000-6000 godz').setValue('3000-6000 godz'),
      new StringSelectMenuOptionBuilder().setLabel('6000+ godz').setValue('6000+ godz')
    );

  // Pyt.5 – Select (liczba postaci)
  const charsSelect = new StringSelectMenuBuilder()
    .setCustomId('characters_count')
    .setPlaceholder('Liczba postaci na koncie')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('1-5').setValue('1-5'),
      new StringSelectMenuOptionBuilder().setLabel('6-11').setValue('6-11'),
      new StringSelectMenuOptionBuilder().setLabel('12-18').setValue('12-18'),
      new StringSelectMenuOptionBuilder().setLabel('18+').setValue('18+')
    );

  modal.addLabelComponents(
    new LabelBuilder().setLabel('Oceń swoje doświadczenie w PvP (0-5)').setRadioGroupComponent(expRadio),
    new LabelBuilder().setLabel('Klasa postaci').setTextInputComponent(classInput),
    new LabelBuilder().setLabel('Czy brałeś udział w Node War lub gildii PvP?').setRadioGroupComponent(nodeWarRadio),
    new LabelBuilder().setLabel('Czas spędzony w grze').setStringSelectMenuComponent(playtimeSelect),
    new LabelBuilder().setLabel('Liczba postaci na koncie').setStringSelectMenuComponent(charsSelect)
  );

  return modal;
}

// ==================== ZAPIS "NIE WEZMĘ UDZIAŁU" ====================
async function handleNoParticipation(interaction) {
  await interaction.deferReply({ ephemeral: true });

  setCooldown(interaction.user.id);

  await boberdb.query(
    `INSERT INTO tournament_signups 
     (user_id, display_name, participation)
     VALUES (?, ?, 'NIE')
     ON DUPLICATE KEY UPDATE 
     participation = 'NIE',
     updated_at = CURRENT_TIMESTAMP`,
    [interaction.user.id, interaction.member?.displayName ?? interaction.user.username]
  );

  await interaction.editReply({
    content: '✅ Zapisano **NIE** – nie bierzesz udziału w turnieju.'
  });
}

// ==================== ZAPIS Z MODALA ====================
async function handleTournamentSignup(interaction) {
  try {
    const pvpExp = interaction.fields.getRadioGroupValue('pvp_experience');
    const characterClass = interaction.fields.getTextInputValue('character_class');
    const nodeWar = interaction.fields.getRadioGroupValue('node_war');
    const playtime = interaction.fields.getStringSelectValues('playtime')[0];
    const charactersCount = interaction.fields.getStringSelectValues('characters_count')[0];

    setCooldown(interaction.user.id);

    await boberdb.query(
      `INSERT INTO tournament_signups 
       (user_id, display_name, participation, pvp_experience, character_class, node_war_participation, playtime, characters_count)
       VALUES (?, ?, 'TAK', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       participation = 'TAK',
       pvp_experience = VALUES(pvp_experience),
       character_class = VALUES(character_class),
       node_war_participation = VALUES(node_war_participation),
       playtime = VALUES(playtime),
       characters_count = VALUES(characters_count),
       updated_at = CURRENT_TIMESTAMP`,
      [
        interaction.user.id,
        interaction.member?.displayName ?? interaction.user.username,
        parseInt(pvpExp),
        characterClass,
        nodeWar,
        playtime,
        charactersCount
      ]
    );

    await interaction.editReply({
      content: `✅ **Zapisano!** Dziękujemy za zgłoszenie do Dziupla Masters.\n\n` +
               `Doświadczenie PvP: **${pvpExp}/5**\n` +
               `Klasa: **${characterClass}**`
    });

  } catch (err) {
    console.error(err);
    await interaction.editReply({ content: '❌ Wystąpił błąd podczas zapisywania.' });
  }
}