// src/events/ready/bossReminder.js
const cron = require('node-cron');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');

// CONFIG
const MAIN_GUILD_ID = '1083113535577522296';
const guildInfoChannelId = '1227779395901456399'; // ID wątku
const reminderRoleId = '1473952099338555462';
const buttonCustomId = '622c63d8644f4d83e995d0e573d7d363';

async function sendDMWithRetry(user, message, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await user.send(message);
      return;
    } catch (err) {
      if (err.code === 50007) throw err;
      console.error(`[DM Retry] Próba ${attempt} nieudana dla ${user.id}:`, err);
      if (attempt < retries) await new Promise(r => setTimeout(r, delay));
      else throw err;
    }
  }
}

module.exports = async (client) => {
  try {
    // === WYŁĄCZNOŚĆ DLA GŁÓWNEGO SERWERA ===
    if (!client.guilds.cache.has(MAIN_GUILD_ID)) {
      console.log(`✅ Boss reminder skipped – bot nie jest na serwerze ${MAIN_GUILD_ID}`);
      return;
    }

    const TOKEN = process.env.TOKEN;
    if (!TOKEN) throw new Error('Brak tokena w process.env.TOKEN');

    const channel = await client.channels.fetch(guildInfoChannelId);
    if (!channel) {
      console.log('❌ Guild info thread not found');
      return;
    }

    const botPermissions = channel.permissionsFor(client.user);
    if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) ||
        !botPermissions.has(PermissionsBitField.Flags.EmbedLinks) ||
        !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
      console.log('❌ Bot missing permissions in info thread');
      return;
    }

    // Flaga singleton – tylko raz po restarcie
    if (!global.bossReminderCronsSet) {
      global.bossReminderCronsSet = true;

      // 16:00 – wysyłanie wiadomości
      cron.schedule('0 17 * * 4', async () => {
        try {
          const now = new Date();
          const dayTimestamp = Math.floor(now.getTime() / 1000);
          const eightPM = new Date(now);
          eightPM.setHours(21, 0, 0, 0);
          const eightTimestamp = Math.floor(eightPM.getTime() / 1000);

          const content = `Dzisiaj (<t:${dayTimestamp}:d>) zapraszam do dołączenia na [bossy gildyjne](https://discord.com/events/1083113535577522296/1459238856346833003) :japanese_ogre:
## - **<t:${eightTimestamp}:t>** <:DziuplaLogo:1473953012375359692> Dziupla
<:bossKhan:1473953555756089436> Khan → <:magnus:1473953102460747807> <:bossMudster:1473953420627935304> Mudster → <:bossOrg:1473953208593547356> Org → <:bossMoghulis:1473953306077560875> CTG Moghulis → <:bossFerrid:1473953465272369314> Ferrid
:green_heart: Edania 3 | <@&1083113535736922149>`;

          const actionRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel("Przypomnij mi 10 minut przed startem")
                .setEmoji({ name: "⏰" })
                .setCustomId(buttonCustomId),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Poradnik na Khana")
                .setURL("https://discord.com/channels/1083113535577522296/1472253433674334403")
            );

          await channel.send({ content, components: [actionRow] });
          console.log('✅ Boss reminder message sent');
        } catch (err) {
          console.error('❌ Error in sending boss reminder message:', err);
        }
      }, { timezone: 'Europe/Warsaw' });

      // 19:50 – przypomnienia DM
      cron.schedule('50 20 * * 4', async () => {
        try {
          let guild = client.guilds.cache.get(MAIN_GUILD_ID);
          if (!guild) guild = await client.guilds.fetch(MAIN_GUILD_ID);

          await guild.members.fetch(); // odświeżenie cache

          const role = guild.roles.cache.get(reminderRoleId);
          if (!role) return;

          const membersArray = Array.from(role.members.values());

          for (const member of membersArray) {
            try {
              const now = new Date();
              const dayTimestamp = Math.floor(now.getTime() / 1000);
              const eightPM = new Date(now);
              eightPM.setHours(21, 0, 0, 0);
              const eightTimestamp = Math.floor(eightPM.getTime() / 1000);

              const reminderMsg = `Przypomnienie: Bossy gildyjne zaczynają się za 10 minut! Dzisiaj (<t:${dayTimestamp}:d>) o <t:${eightTimestamp}:t>. Dołącz na [bossy gildyjne](https://discord.com/events/1083113535577522296/1459238856346833003)`;
              await sendDMWithRetry(member.user, reminderMsg);
              console.log(`✅ Sent reminder to ${member.user.id}`);
            } catch (sendErr) {
              console.error(`Failed to send reminder to ${member.user.id}:`, sendErr);
            }

            // Usuwamy rolę zawsze
            try { await member.roles.remove(reminderRoleId); } catch {}
          }
        } catch (err) {
          console.error('❌ Error in sending reminders:', err);
        }
      }, { timezone: 'Europe/Warsaw' });

      // 20:00 – wyłączanie przycisku
      cron.schedule('0 21 * * 4', async () => {
        try {
          const messages = await channel.messages.fetch({ limit: 50 });
          const reminderMessage = messages.find(msg =>
            msg.author.id === client.user.id &&
            msg.components?.[0]?.components.some(c => c.customId === buttonCustomId && !c.disabled)
          );

          if (reminderMessage) {
            const updatedRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Danger)
                  .setLabel("Przypomnij mi 10 minut przed startem")
                  .setEmoji({ name: "⏰" })
                  .setCustomId(buttonCustomId)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel("Poradnik na Khana")
                  .setURL("https://discord.com/channels/1083113535577522296/1472253433674334403")
              );

            await reminderMessage.edit({ components: [updatedRow] });
            console.log('✅ Reminder button disabled');
          }
        } catch (err) {
          console.error('❌ Error in disabling reminder button:', err);
        }
      }, { timezone: 'Europe/Warsaw' });
    }

    // Listener na interakcje przycisku - dodaj tylko raz
    if (!client.listeners('interactionCreate').some(listener => listener.name === 'bossReminderInteraction')) {
      const interactionHandler = async (interaction) => {
        if (!interaction.isButton() || interaction.customId !== buttonCustomId) return;

        try {
          // Nadaj rolę
          await interaction.member.roles.add(reminderRoleId);

          // Wyślij DM z retry
          const confirmationMessage = 'Dostaniesz podobną wiadomość 10 minut przed rozpoczęciem wydarzenia. To jest jednorazowe działanie.';
          await sendDMWithRetry(interaction.user, confirmationMessage);

          // Odpowiedz ephemerally
          await interaction.reply({ content: 'Przypomnienie ustawione!', flags: MessageFlags.Ephemeral });
        } catch (err) {
          if (err.code === 50007) { // Cannot send messages to this user
            await interaction.reply({
              content: 'Nie mogę wysłać Ci prywatnej wiadomości. Aby to naprawić, włącz odbieranie wiadomości od członków serwera w ustawieniach prywatności serwera.',
              flags: MessageFlags.Ephemeral
            });
          } else {
            console.error('Error handling button interaction:', err);
            await interaction.reply({ content: 'Wystąpił błąd podczas ustawiania przypomnienia.', flags: MessageFlags.Ephemeral });
          }

          // Usuń rolę jeśli błąd
          try {
            await interaction.member.roles.remove(reminderRoleId);
          } catch (removeErr) {
            console.error('Failed to remove role after error:', removeErr);
          }
        }
      };

      // Nadaj nazwę do listenera dla identyfikacji
      interactionHandler.name = 'bossReminderInteraction';

      client.on('interactionCreate', interactionHandler);
    }

    console.log('✅ Boss reminder setup complete (exclusive for main guild)');
  } catch (err) {
    console.error('❌ Error setting up boss reminder:', err);
  }
};