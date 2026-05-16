// events/ready/06registerMissions.js
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder,
    LabelBuilder
} = require('discord.js');

const boberdb = require('../../utils/db.js');
const missionManager = require('../../utils/missionManager.js');

const MISSION_CHANNEL_ID = '1083113537683071076';

// ==================== MAPA THUMBNAILI ====================
const thumbnailMap = {
    'Subjugation': 'https://i.imgur.com/H7Sad0z.png',
    'Life': 'https://i.imgur.com/YuX3Kkp.png',
    'Trading': 'https://i.imgur.com/bOd2IWY.png',
    'Boss Subjugation': 'https://i.imgur.com/VeSZbIF.png'
};

// ==================== KONFIGURACJA KATEGORII ====================
const missionConfigs = {
    subjugation: {
        name: 'Subjugation',
        customId: 'mission_subjugation',
        subTypes: [
            { label: 'Defeat Any Monster', value: 'Defeat Any Monster', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Defeat Hungry Margoria Sea Monster', value: 'Defeat Hungry Margoria Sea Monster', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Defeat Margoria Sea Monster', value: 'Defeat Margoria Sea Monster', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ],
        sizes: [
            { label: 'Small (1250)', value: 'Small (1250)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Small (2500)', value: 'Small (2500)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Medium (3750)', value: 'Medium (3750)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Medium (5000)', value: 'Medium (5000)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Large (6250)', value: 'Large (6250)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Large (7500)', value: 'Large (7500)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Extra Large (8750)', value: 'Extra Large (8750)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Extra Large (10000)', value: 'Extra Large (10000)', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ]
    },
    life: {
        name: 'Life',
        customId: 'mission_life',
        subTypes: [
            { label: 'Gather Rough Stone', value: 'Gather Rough Stone', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Gather Log', value: 'Gather Log', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Gather Fairy Powder', value: 'Gather Fairy Powder', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Get Milk', value: 'Get Milk', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Obtain Bottle of River Water', value: 'Obtain Bottle of River Water', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Gather Fire Horn', value: 'Gather Fire Horn', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Obtain Witch\'s Delicacy', value: 'Obtain Witch\'s Delicacy', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Obtain Mysterious Catalyst', value: 'Obtain Mysterious Catalyst', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Catch Blue Grade Fish', value: 'Catch Blue Grade Fish', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Catch Yellow Grade Fish', value: 'Catch Yellow Grade Fish', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ],
        sizes: [
            { label: 'Small', value: 'Small', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Medium', value: 'Medium', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Large', value: 'Large', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Extra Large', value: 'Extra Large', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ]
    },
    trading: {
        name: 'Trading',
        customId: 'mission_trading',
        subTypes: [
            { label: 'Barter X Times', value: 'Barter X Times', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ],
        sizes: [
            { label: 'Small (20)', value: 'Small (20)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Small (40)', value: 'Small (40)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Medium (60)', value: 'Medium (60)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Medium (80)', value: 'Medium (80)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Large (100)', value: 'Large (100)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Large (120)', value: 'Large (120)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Extra Large (130)', value: 'Extra Large (130)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Extra Large (150)', value: 'Extra Large (150)', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ]
    },
    boss_subjugation: {
        name: 'Boss Subjugation',
        customId: 'mission_boss_subjugation',
        subTypes: [
            { label: 'Bulgasal (Hard)', value: 'Bulgasal (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Jigwi (Hard)', value: 'Jigwi (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Uturi (Hard)', value: 'Uturi (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Dark Bonhwang (Hard)', value: 'Dark Bonhwang (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Bihyung (Hard)', value: 'Bihyung (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Blue-Clad Youth (Hard)', value: 'Blue-Clad Youth (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Deposed Crown Prince (Hard)', value: 'Deposed Crown Prince (Hard)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Bulgasal (Normal)', value: 'Bulgasal (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Jigwi (Normal)', value: 'Jigwi (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Uturi (Normal)', value: 'Uturi (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Dark Bonhwang (Normal)', value: 'Dark Bonhwang (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Bihyung (Normal)', value: 'Bihyung (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Blue-Clad Youth (Normal)', value: 'Blue-Clad Youth (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Deposed Crown Prince (Normal)', value: 'Deposed Crown Prince (Normal)', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ],
        sizes: [
            { label: 'Small', value: 'Small', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Medium', value: 'Medium', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Large', value: 'Large', emoji: '<:DziuplaLogo:1473953012375359692>' },
            { label: 'Extra Large', value: 'Extra Large', emoji: '<:DziuplaLogo:1473953012375359692>' }
        ]
    }
};

// ==================== BUDOWANIE EMBEDU MISJI ====================
function buildMissionEmbed(categoryName, creatorId, subType, size, helpers = [], completed = false) {
    const color = completed ? 0x808080 : 0xffaa00;
    const thumbnail = thumbnailMap[categoryName] || null;

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(`🎯 ${categoryName}`)
        .setDescription(`**Rodzaj:** ${subType}\n**Rozmiar:** ${size}`)
        .setThumbnail(thumbnail)
        .addFields(
            { name: 'Wziął', value: `<@${creatorId}>`, inline: true },
            { name: 'Pomocnicy', value: helpers.length ? helpers.map(id => `<@${id}>`).join(' ') : 'Brak', inline: true },
            { name: 'Zakończona', value: completed ? '✅ Tak' : '❌ Nie', inline: true }
        )
        .setTimestamp();
}

// ==================== BUDOWANIE MODALI ====================
function buildMissionModal(categoryKey) {
    const config = missionConfigs[categoryKey];
    const modal = new ModalBuilder()
        .setCustomId(`mission_modal_${categoryKey}`)
        .setTitle(`🎯 ${config.name} - Nowa misja`);

    const subTypeSelect = new StringSelectMenuBuilder()
        .setCustomId('sub_type')
        .setPlaceholder('Wybierz rodzaj misji')
        .setMinValues(1)
        .setMaxValues(1)
        .setRequired(true)
        .addOptions(config.subTypes.map(opt =>
            new StringSelectMenuOptionBuilder()
                .setLabel(opt.label)
                .setValue(opt.value)
                .setEmoji(opt.emoji)
        ));

    const sizeSelect = new StringSelectMenuBuilder()
        .setCustomId('size')
        .setPlaceholder('Wybierz rozmiar misji')
        .setMinValues(1)
        .setMaxValues(1)
        .setRequired(true)
        .addOptions(config.sizes.map(opt =>
            new StringSelectMenuOptionBuilder()
                .setLabel(opt.label)
                .setValue(opt.value)
                .setEmoji(opt.emoji)
        ));

    const helpersSelect = new UserSelectMenuBuilder()
        .setCustomId('helpers')
        .setPlaceholder('Wybierz pomocników (opcjonalnie)')
        .setMinValues(0)
        .setMaxValues(5)
        .setRequired(false);

    const completedSelect = new StringSelectMenuBuilder()
        .setCustomId('completed')
        .setPlaceholder('Czy misja jest już zakończona?')
        .setMinValues(1)
        .setMaxValues(1)
        .setRequired(true)
        .addOptions([
            new StringSelectMenuOptionBuilder().setLabel('✅ Tak').setValue('1').setEmoji('✅'),
            new StringSelectMenuOptionBuilder().setLabel('❌ Nie').setValue('0').setEmoji('❌')
        ]);

    modal.addLabelComponents(
        new LabelBuilder().setLabel('Rodzaj misji').setDescription('Wybierz typ zadania').setStringSelectMenuComponent(subTypeSelect),
        new LabelBuilder().setLabel('Rozmiar misji').setDescription('Wybierz skalę').setStringSelectMenuComponent(sizeSelect),
        new LabelBuilder().setLabel('Pomocnicy').setDescription('Kto pomaga? (opcjonalnie)').setUserSelectMenuComponent(helpersSelect),
        new LabelBuilder().setLabel('Status').setDescription('Czy misja jest zakończona?').setStringSelectMenuComponent(completedSelect)
    );

    return modal;
}

function buildAddHelpersModal(messageId) {
    const modal = new ModalBuilder()
        .setCustomId(`add_helpers_modal_${messageId}`)
        .setTitle('Dodaj pomocników do misji');

    const helpersSelect = new UserSelectMenuBuilder()
        .setCustomId('new_helpers')
        .setPlaceholder('Wybierz dodatkowych pomocników')
        .setMinValues(1)
        .setMaxValues(5)
        .setRequired(true);

    modal.addLabelComponents(
        new LabelBuilder().setLabel('Pomocnicy').setDescription('Kto dołącza do misji?').setUserSelectMenuComponent(helpersSelect)
    );

    return modal;
}

// ==================== GŁÓWNA FUNKCJA ====================
async function setupMissionRegistrationMessage(client) {
    const channel = await client.channels.fetch(MISSION_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error('❌ Nie znaleziono kanału misji');

    const mainEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎯 Zarejestruj misje')
        .setDescription('Wybierz kategorię misji, którą chcesz zarejestrować:')
        .setTimestamp();

    const mainRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('mission_subjugation').setLabel('Subjugation').setStyle(ButtonStyle.Primary).setEmoji('<:DziuplaLogo:1473953012375359692>'),
        new ButtonBuilder().setCustomId('mission_life').setLabel('Life').setStyle(ButtonStyle.Primary).setEmoji('<:DziuplaLogo:1473953012375359692>'),
        new ButtonBuilder().setCustomId('mission_trading').setLabel('Trading').setStyle(ButtonStyle.Primary).setEmoji('<:DziuplaLogo:1473953012375359692>'),
        new ButtonBuilder().setCustomId('mission_boss_subjugation').setLabel('Boss Subjugation').setStyle(ButtonStyle.Primary).setEmoji('<:DziuplaLogo:1473953012375359692>')
    );

    // ==================== POPRAWIONE WYSZUKIWANIE ISTNIEJĄCEJ WIADOMOŚCI ====================
    const messages = await channel.messages.fetch({ limit: 50 });
    let existing = messages.find(msg => {
        if (msg.author.id !== client.user.id) return false;
        
        // Sprawdzamy po tytule embeda (najpewniejsza metoda)
        const hasCorrectTitle = msg.embeds?.some(embed => 
            embed.title?.includes('Zarejestruj misje')
        );
        
        // Dodatkowe sprawdzenie po customId przycisków
        const hasMissionButtons = msg.components?.some(row =>
            row.components?.some(comp => comp.customId?.startsWith('mission_'))
        );

        return hasCorrectTitle || hasMissionButtons;
    });

    if (existing) {
        await existing.edit({ embeds: [mainEmbed], components: [mainRow] });
        console.log('✅ Mission registration message updated (existing found)');
    } else {
        await channel.send({ embeds: [mainEmbed], components: [mainRow] });
        console.log('✅ Mission registration message created (new)');
    }

    // ==================== GŁÓWNY LISTENER INTERAKCJI ====================
    client.on('interactionCreate', async interaction => {
        // 1. Przyciski kategorii
        if (interaction.isButton() && interaction.customId.startsWith('mission_')) {
            const categoryKey = interaction.customId.replace('mission_', '');
            if (!missionConfigs[categoryKey]) return;
            return interaction.showModal(buildMissionModal(categoryKey));
        }

        // 2. Submit głównego modala
        if (interaction.isModalSubmit() && interaction.customId.startsWith('mission_modal_')) {
            await interaction.deferReply({ flags: 64 });
            const categoryKey = interaction.customId.replace('mission_modal_', '');
            const config = missionConfigs[categoryKey];

            const subType = interaction.fields.getStringSelectValues('sub_type')[0];
            const size = interaction.fields.getStringSelectValues('size')[0];
            const helpersField = interaction.fields.getField('helpers');
            const helpers = helpersField?.value ?? [];

            const completed = interaction.fields.getStringSelectValues('completed')[0] === '1';

            const embed = buildMissionEmbed(config.name, interaction.user.id, subType, size, helpers, completed);

            const sent = await interaction.channel.send({ embeds: [embed] });

            await missionManager.createMission({
                creator_id: interaction.user.id,
                category: config.name,
                sub_type: subType,
                size: size,
                helpers: helpers,
                channel_id: interaction.channel.id,
                message_id: sent.id
            });

            if (!completed) {
                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`add_helpers_${sent.id}`).setLabel('Dodaj pomocników').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`complete_mission_${sent.id}`).setLabel('Zakończ misję').setStyle(ButtonStyle.Success)
                );
                await sent.edit({ embeds: [embed], components: [actionRow] });
            }

            return interaction.editReply({ content: `✅ Misja **${config.name}** została zarejestrowana!` });
        }

        // 3. Przycisk "Dodaj pomocników"
        if (interaction.isButton() && interaction.customId.startsWith('add_helpers_')) {
            const messageId = interaction.customId.split('_')[2];
            return interaction.showModal(buildAddHelpersModal(messageId));
        }

        // 4. Submit modala dodawania pomocników
        if (interaction.isModalSubmit() && interaction.customId.startsWith('add_helpers_modal_')) {
            await interaction.deferReply({ flags: 64 });
            const messageId = interaction.customId.replace('add_helpers_modal_', '');
            const newHelpersField = interaction.fields.getField('new_helpers');
            const newHelpers = newHelpersField?.value ?? [];

            const updatedHelpers = await missionManager.addHelpers(messageId, newHelpers);
            if (!updatedHelpers) return interaction.editReply({ content: '❌ Nie znaleziono misji.' });

            const mission = await missionManager.getMissionByMessageId(messageId);
            if (mission) {
                const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
                if (msg) {
                    const newEmbed = buildMissionEmbed(
                        mission.category,
                        mission.creator_id,
                        mission.sub_type,
                        mission.size,
                        updatedHelpers,
                        mission.completed === 1
                    );
                    await msg.edit({ embeds: [newEmbed] });
                }
            }
            return interaction.editReply({ content: `✅ Dodano ${newHelpers.length} pomocników!` });
        }

        // 5. Przycisk "Zakończ misję"
        if (interaction.isButton() && interaction.customId.startsWith('complete_mission_')) {
            const messageId = interaction.customId.split('_')[2];
            const updated = await missionManager.completeMission(messageId);
            if (!updated) return interaction.reply({ content: '❌ Nie znaleziono misji.', flags: 64 });

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (msg) {
                const newEmbed = buildMissionEmbed(
                    updated.category,
                    updated.creator_id,
                    updated.sub_type,
                    updated.size,
                    updated.helpers ? JSON.parse(updated.helpers) : [],
                    true
                );
                await msg.edit({ embeds: [newEmbed], components: [] });
            }
            return interaction.reply({ content: '✅ Misja została oznaczona jako zakończona!', flags: 64 });
        }
    });

    console.log('✅ System misji gildyjnych uruchomiony – persistent message poprawiony');
}

module.exports = setupMissionRegistrationMessage;