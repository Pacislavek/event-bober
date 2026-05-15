const { EmbedBuilder } = require('discord.js');

        module.exports = {
            name: 'witamy',
            description: 'Wysyła powitalny embed z oznaczonymi osobami',

            devOnly: false,
            testOnly: false,
            deleted: false,

            options: [
                {
                    name: 'user1',
                    description: 'Pierwsza osoba (wymagana)',
                    type: 6,
                    required: true
                },
                {
                    name: 'user2',
                    description: 'Druga osoba (opcjonalna)',
                    type: 6,
                    required: false
                },
                {
                    name: 'user3',
                    description: 'Trzecia osoba (opcjonalna)',
                    type: 6,
                    required: false
                },
                {
                    name: 'user4',
                    description: 'Czwarta osoba (opcjonalna)',
                    type: 6,
                    required: false
                },
                {
                    name: 'user5',
                    description: 'Piąta osoba (opcjonalna)',
                    type: 6,
                    required: false
                }
            ],

            permissionsRequired: [],
            botPermissions: [],

            callback: async (client, interaction) => {
                // Zbieramy użytkowników + ich membery (żeby dostać displayName)
                const userData = [];
                for (let i = 1; i <= 5; i++) {
                    const user = interaction.options.getUser(`user${i}`);
                    if (user) {
                        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                        userData.push({ user, member });
                    }
                }

                if (userData.length === 0) {
                    return interaction.reply({
                        content: 'Musisz podać przynajmniej użytkownika **user1**.',
                        ephemeral: true
                    });
                }

                const mentions = userData.map(data => data.user.toString()).join(' ');

                // Kanał docelowy
                const targetChannel = interaction.guild.channels.cache.get('1083113537293008988');
                if (!targetChannel) {
                    return interaction.reply({
                        content: 'Nie znaleziono kanału powitalnego (ID: 1083113537293008988).',
                        ephemeral: true
                    });
                }

                const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 512 }) || '';

                // Footer – pseudonim z [nawiasów kwadratowych]
                const getNick = (member, user) => {
                    const displayName = member?.displayName || user.username;
                    const match = displayName.match(/\[(.*?)\]/);
                    return match ? match[1].trim() : displayName;
                };

                const footerNicks = userData.map(data => getNick(data.member, data.user)).join(', ');

                const embed = new EmbedBuilder()
                    .setColor(16750848)
                    .setAuthor({
                        name: 'Witamy w Dziupli!',
                        iconURL: guildIcon
                    })
                    .setDescription(
                        `### Przydatne kanały:\n` +
                        `<#1083113536642891824> - zasady serwera i gildii w grze\n` +
                        `<#1083113536642891826> - wszelkie nowości z gry Black Desert Online\n` +
                        `<#1083428660033368114> - najnowsze kupony do wykorzystania w grze\n` +
                        `<#1219266250408988682> - darmowe gry epic/steam\n` +
                        `### Przydatne informacje:\n` +
                        `- Nadaj sobie więcej ról na naszym discordzie - [tutaj](https://discord.com/channels/1083113535577522296/1218963168622022696/1218963168622022696).\n` +
                        `- Dołącz do Black Shrine / Atoraxxion - [tutaj](https://discord.com/channels/1083113535577522296/1218963168622022696/1218963168622022696).\n` +
                        `- Zdobądź dostęp do strefy kina - [tutaj](https://discord.com/channels/1083113535577522296/1218963168622022696/1218963168622022696).\n` +
                        `- Powiadomienia o World Bossach - [tutaj](https://discord.com/channels/1083113535577522296/1198998134685192233/1482075641812877424).\n` +
                        `- Naucz się jak włączyć wakacje - [tutaj](https://discord.com/channels/1083113535577522296/1381364898310914210/1381364898310914210).`
                    )
                    .setImage('https://i.imgur.com/rn6mptg.gif')
                    .setFooter({
                        text: `${footerNicks} • ${new Date().toLocaleDateString('pl-PL')}`,
                        iconURL: userData[0].member?.displayAvatarURL({ dynamic: true }) || userData[0].user.displayAvatarURL({ dynamic: true })
                    });

                // Wysyłamy wiadomość
                const sentMessage = await targetChannel.send({
                    content: mentions,
                    embeds: [embed]
                });

                // Reakcja botem <:Hejka:1488216046073811095>
                await sentMessage.react('<:Hejka:1488216046073811095>').catch(console.error);

                // Potwierdzenie dla osoby wpisującej komendę
                await interaction.reply({
                    content: `✅ Powitalna wiadomość została wysłana na kanał powitalny z **${userData.length}** osobami.`,
                    ephemeral: true
                });
            }
        };