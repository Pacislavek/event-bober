// src/events/ready/bossReminder.js
const cron = require('node-cron');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

// CONFIG
const guildInfoChannelId = '1227779395901456399'; // ID wątku
const guildId = '1083113535577522296';
const reminderRoleId = '1473952099338555462';
const buttonCustomId = '622c63d8644f4d83e995d0e573d7d363';

async function sendDMWithRetry(user, message, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await user.send(message);
      return; // Sukces, wyjdź
    } catch (err) {
      if (err.code === 50007) { // Nie można wysłać do użytkownika - nie retry
        throw err;
      }
      console.error(`Attempt ${attempt} failed to send DM to ${user.id}:`, err);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err; // Ostatnia próba nieudana
      }
    }
  }
}

module.exports = async (client) => {
  try {
    const TOKEN = process.env.TOKEN;
    if (!TOKEN) throw new Error('Brak tokena w process.env.TOKEN');

    const channel = await client.channels.fetch(guildInfoChannelId);
    if (!channel) {
      console.log('❌ Guild info thread not found');
      return;
    }

    // Sprawdź uprawnienia bota w kanale (wątku)
    const botPermissions = channel.permissionsFor(client.user);
    if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) ||
      !botPermissions.has(PermissionsBitField.Flags.EmbedLinks) ||
      !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
      console.log('❌ Bot missing permissions in info thread');
      return;
    }

    // Flaga do uniknięcia duplikatów cronów po restarcie bota
    if (!global.bossReminderCronsSet) {
      global.bossReminderCronsSet = true;

      // Scheduler do wysyłania wiadomości co piątek o 16:00 (Europe/Warsaw)
      cron.schedule('0 16 * * 5', async () => {
        try {
          const now = new Date();
          const dayTimestamp = Math.floor(now.getTime() / 1000);

          const eightPM = new Date(now);
          eightPM.setHours(20, 0, 0, 0);
          const eightTimestamp = Math.floor(eightPM.getTime() / 1000);

          // Buduj treść wiadomości
          const content = `Dzisiaj (<t:${dayTimestamp}:d>) zapraszam do dołączenia na [bossy gildyjne](https://discord.com/events/1083113535577522296/1459238856346833003) :japanese_ogre:
## - **<t:${eightTimestamp}:t>** <:DziuplaLogo:1473953012375359692> Dziupla
<:bossKhan:1473953555756089436> Khan → <:magnus:1473953102460747807> <:bossMudster:1473953420627935304> Mudster → <:bossOrg:1473953208593547356> Org → <:bossMoghulis:1473953306077560875> CTG Moghulis → <:bossFerrid:1473953465272369314> Ferrid
:green_heart: Kamasylvia 3 | <@&1083113535736922149>`;

          // Buduj ActionRow z przyciskami
          const actionRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel("Przypomnij mi 10 minut przed startem")
                .setEmoji({ name: "⏰" })
                .setCustomId(buttonCustomId),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setLabel("Poradnik na Khana")
                .setURL("https://discord.com/channels/1083113535577522296/1472253433674334403")
            );

          // Wyślij wiadomość
          await channel.send({ content, components: [actionRow] });
          console.log('✅ Boss reminder message sent');
        } catch (err) {
          console.error('❌ Error in sending boss reminder message:', err);
        }
      }, {
        timezone: 'Europe/Warsaw'
      });

      // Scheduler do wysyłania przypomnień o 19:50 w piątki
      cron.schedule('50 19 * * 5', async () => {
        try {
          const guild = await client.guilds.fetch(guildId);
          await guild.members.fetch(); // Odśwież cache członków gildii
          const role = guild.roles.cache.get(reminderRoleId);
          if (!role) return;

          // Zbierz członków w array, aby uniknąć problemów z iteracją kolekcji
          const membersArray = Array.from(role.members.values());

          for (const member of membersArray) {
            try {
              const now = new Date();
              const dayTimestamp = Math.floor(now.getTime() / 1000);

              const eightPM = new Date(now);
              eightPM.setHours(20, 0, 0, 0);
              const eightTimestamp = Math.floor(eightPM.getTime() / 1000);

              const reminderMessage = `Przypomnienie: Bossy gildyjne zaczynają się za 10 minut! Dzisiaj (<t:${dayTimestamp}:d>) o <t:${eightTimestamp}:t>. Dołącz na [bossy gildyjne](https://discord.com/events/1083113535577522296/1459238856346833003)`;
              await sendDMWithRetry(member.user, reminderMessage);
              console.log(`✅ Sent reminder to ${member.user.id}`);
            } catch (sendErr) {
              console.error(`Failed to send reminder to ${member.user.id} after retries:`, sendErr);
            }

            // Usuń rolę niezależnie od sukcesu wysyłki
            try {
              await member.roles.remove(reminderRoleId);
              console.log(`✅ Removed role from ${member.user.id}`);
            } catch (removeErr) {
              console.error(`Failed to remove role from ${member.user.id}:`, removeErr);
            }
          }
          console.log('✅ Reminders sent and roles removed');
        } catch (err) {
          console.error('❌ Error in sending reminders:', err);
        }
      }, {
        timezone: 'Europe/Warsaw'
      });

      // Scheduler do wyłączania przycisku o 20:00 w piątki
      cron.schedule('0 20 * * 5', async () => {
        try {
          // Fetch ostatnich wiadomości z wątku (limit 50, zakładając, że wiadomość jest niedawna)
          const messages = await channel.messages.fetch({ limit: 50 });

          // Znajdź wiadomość bota z aktywnym przyciskiem przypomnienia
          const reminderMessage = messages.find(msg => 
            msg.author.id === client.user.id &&
            msg.components.length > 0 &&
            msg.components[0].components.some(comp => comp.customId === buttonCustomId && !comp.disabled)
          );

          if (reminderMessage) {
            // Zaktualizuj ActionRow: wyłącz tylko przycisk przypomnienia
            const updatedActionRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Danger)
                  .setLabel("Przypomnij mi 10 minut przed startem")
                  .setEmoji({ name: "⏰" })
                  .setCustomId(buttonCustomId)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Primary)
                  .setLabel("Poradnik na Khana")
                  .setURL("https://discord.com/channels/1083113535577522296/1472253433674334403")
              );

            // Edytuj wiadomość
            await reminderMessage.edit({ components: [updatedActionRow] });
            console.log('✅ Reminder button disabled');
          } else {
            console.log('❌ No active reminder message found to disable');
          }
        } catch (err) {
          console.error('❌ Error in disabling reminder button:', err);
        }
      }, {
        timezone: 'Europe/Warsaw'
      });
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
          await interaction.reply({ content: 'Przypomnienie ustawione!', ephemeral: true });
        } catch (err) {
          if (err.code === 50007) { // Cannot send messages to this user
            await interaction.reply({
              content: 'Nie mogę wysłać Ci prywatnej wiadomości. Aby to naprawić, włącz odbieranie wiadomości od członków serwera w ustawieniach prywatności serwera.',
              ephemeral: true
            });
          } else {
            console.error('Error handling button interaction:', err);
            await interaction.reply({ content: 'Wystąpił błąd podczas ustawiania przypomnienia.', ephemeral: true });
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

    console.log('✅ Boss reminder setup complete');
  } catch (err) {
    console.error('❌ Error setting up boss reminder:', err);
  }
};