// events/ready/06registerMissions.js
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    UserSelectMenuBuilder
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

// ==================== KONFIGURACJA KATEGORII + DOMYŚLNE WARTOŚCI ====================
const missionConfigs = {
    subjugation: {
        name: 'Subjugation',
        customId: 'mission_subjugation',
        subTypes: [
            { label: 'Defeat Any Monster', value: 'Defeat Any Monster', emoji: '<:Subjugation:1505240111733014740>' },
            { label: 'Defeat Hungry Margoria Sea Monster', value: 'Defeat Hungry Margoria Sea Monster', emoji: '<:SubjugationWater:1505248211982356530>' },
            { label: 'Defeat Margoria Sea Monster', value: 'Defeat Margoria Sea Monster', emoji: '<:SubjugationWater:1505248211982356530>' }
        ],
        sizes: [
            { label: 'Small (1250)', value: 'Small (1250)', emoji: '<:Small:1505239756815208669>' },
            { label: 'Small (2500)', value: 'Small (2500)', emoji: '<:Small:1505239756815208669>' },
            { label: 'Medium (3750)', value: 'Medium (3750)', emoji: '<:Medium:1505239770496761988>' },
            { label: 'Medium (5000)', value: 'Medium (5000)', emoji: '<:Medium:1505239770496761988>' },
            { label: 'Large (6250)', value: 'Large (6250)', emoji: '<:Large:1505239784501674275>' },
            { label: 'Large (7500)', value: 'Large (7500)', emoji: '<:Large:1505239784501674275>' },
            { label: 'Extra Large (8750)', value: 'Extra Large (8750)', emoji: '<:ExtraLarge:1505239795151142952>' },
            { label: 'Extra Large (10000)', value: 'Extra Large (10000)', emoji: '<:ExtraLarge:1505239795151142952>' }
        ],
        defaultSubType: 'Defeat Any Monster',
        defaultSize: 'Medium (5000)'
    },
    life: {
        name: 'Life',
        customId: 'mission_life',
        subTypes: [
            { label: 'Gather Rough Stone', value: 'Gather Rough Stone', emoji: '<:RoughStone:1505240903785250916>' },
            { label: 'Gather Log', value: 'Gather Log', emoji: '<:Log:1505240974664925234>' },
            { label: 'Gather Fairy Powder', value: 'Gather Fairy Powder', emoji: '<:FairyPowder:1505240645533696020>' },
            { label: 'Get Milk', value: 'Get Milk', emoji: '<:Milk:1505240738429141143>' },
            { label: 'Obtain Bottle of River Water', value: 'Obtain Bottle of River Water', emoji: '<:Gathering:1505240205727105316>' },
            { label: 'Gather Fire Horn', value: 'Gather Fire Horn', emoji: '<:FireHorn:1505241069154078801>' },
            { label: 'Obtain Witch\'s Delicacy', value: 'Obtain Witch\'s Delicacy', emoji: '<:WitchsDelicacy:1505241165903958016>' },
            { label: 'Obtain Mysterious Catalyst', value: 'Obtain Mysterious Catalyst', emoji: '<:MysteriousCatalyst:1505241288339886092>' },
            { label: 'Catch Blue Grade Fish', value: 'Catch Blue Grade Fish', emoji: '<:Fishing:1505240258474938459>' },
            { label: 'Catch Yellow Grade Fish', value: 'Catch Yellow Grade Fish', emoji: '<:Fishing:1505240258474938459>' }
        ],
        sizes: [
            { label: 'Small', value: 'Small', emoji: '<:Small:1505239756815208669>' },
            { label: 'Medium', value: 'Medium', emoji: '<:Medium:1505239770496761988>' },
            { label: 'Large', value: 'Large', emoji: '<:Large:1505239784501674275>' },
            { label: 'Extra Large', value: 'Extra Large', emoji: '<:ExtraLarge:1505239795151142952>' }
        ],
        defaultSize: 'Extra Large'
    },
    trading: {
        name: 'Trading',
        customId: 'mission_trading',
        subTypes: [
            { label: 'Barter X Times', value: 'Barter X Times', emoji: '<:Barter:1505240419800318092>' }
        ],
        sizes: [
            { label: 'Small (20)', value: 'Small (20)', emoji: '<:Small:1505239756815208669>' },
            { label: 'Small (40)', value: 'Small (40)', emoji: '<:Small:1505239756815208669>' },
            { label: 'Medium (60)', value: 'Medium (60)', emoji: '<:Medium:1505239770496761988>' },
            { label: 'Medium (80)', value: 'Medium (80)', emoji: '<:Medium:1505239770496761988>' },
            { label: 'Large (100)', value: 'Large (100)', emoji: '<:Large:1505239784501674275>' },
            { label: 'Large (120)', value: 'Large (120)', emoji: '<:Large:1505239784501674275>' },
            { label: 'Extra Large (130)', value: 'Extra Large (130)', emoji: '<:ExtraLarge:1505239795151142952>' },
            { label: 'Extra Large (150)', value: 'Extra Large (150)', emoji: '<:ExtraLarge:1505239795151142952>' }
        ],
        defaultSubType: 'Barter X Times',
        defaultSize: 'Extra Large (150)'
    },
    boss_subjugation: {
        name: 'Boss Subjugation',
        customId: 'mission_boss_subjugation',
        subTypes: [
            { label: 'Bulgasal (Hard)', value: 'Bulgasal (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Jigwi (Hard)', value: 'Jigwi (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Uturi (Hard)', value: 'Uturi (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Dark Bonhwang (Hard)', value: 'Dark Bonhwang (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Bihyung (Hard)', value: 'Bihyung (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Blue-Clad Youth (Hard)', value: 'Blue-Clad Youth (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Deposed Crown Prince (Hard)', value: 'Deposed Crown Prince (Hard)', emoji: '<:BossSubjugation:1505240349717827624>' },
            { label: 'Bulgasal (Normal)', value: 'Bulgasal (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' },
            { label: 'Jigwi (Normal)', value: 'Jigwi (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' },
            { label: 'Uturi (Normal)', value: 'Uturi (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' },
            { label: 'Dark Bonhwang (Normal)', value: 'Dark Bonhwang (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' },
            { label: 'Bihyung (Normal)', value: 'Bihyung (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' },
            { label: 'Blue-Clad Youth (Normal)', value: 'Blue-Clad Youth (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' },
            { label: 'Deposed Crown Prince (Normal)', value: 'Deposed Crown Prince (Normal)', emoji: '<:BossSubjugationNormal:1505241561472962683>' }
        ],
        sizes: [
            { label: 'Small', value: 'Small', emoji: '<:Small:1505239756815208669>' },
            { label: 'Medium', value: 'Medium', emoji: '<:Medium:1505239770496761988>' },
            { label: 'Large', value: 'Large', emoji: '<:Large:1505239784501674275>' },
            { label: 'Extra Large', value: 'Extra Large', emoji: '<:ExtraLarge:1505239795151142952>' }
        ],
        defaultSize: 'Extra Large'
    }
};

// ==================== BUDOWANIE EMBEDU ====================
function buildMissionEmbed(categoryName, creatorId, subType, size, helpers = [], completed = false) {
    const color = completed ? 0x808080 : 0xffaa00;
    const thumbnail = thumbnailMap[categoryName] || null;

    const helpersArray = Array.isArray(helpers) ? helpers : [];

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(`🎯 ${categoryName}`)
        .setDescription(`**Rodzaj:** ${subType}\n**Rozmiar:** ${size}`)
        .setThumbnail(thumbnail)
        .addFields(
            { name: 'Wziął', value: `<@${creatorId}>`, inline: true },
            { name: 'Pomocnicy', value: helpersArray.length ? helpersArray.map(id => `<@${id}>`).join('\n') : 'Brak', inline: true },
            { name: 'Zakończona', value: completed ? '✅ Tak' : '❌ Nie', inline: true }
        )
        .setTimestamp();
}

// ==================== MODAL TWORZENIA MISJI (raw object) ====================
function buildMissionModal(categoryKey) {
    const config = missionConfigs[categoryKey];

    return {
        custom_id: `mission_modal_${categoryKey}`,
        title: `🎯 ${config.name} - Nowa misja`,
        components: [
            {
                type: 18,
                label: 'Rodzaj misji',
                description: 'Wybierz typ zadania',
                component: {
                    type: 3,
                    custom_id: 'sub_type',
                    placeholder: 'Wybierz rodzaj misji',
                    min_values: 1,
                    max_values: 1,
                    required: true,
                    options: config.subTypes.map(opt => ({
                        label: opt.label,
                        value: opt.value,
                        emoji: opt.emoji,
                        default: config.defaultSubType === opt.value
                    }))
                }
            },
            {
                type: 18,
                label: 'Rozmiar misji',
                description: 'Wybierz skalę',
                component: {
                    type: 3,
                    custom_id: 'size',
                    placeholder: 'Wybierz rozmiar misji',
                    min_values: 1,
                    max_values: 1,
                    required: true,
                    options: config.sizes.map(opt => ({
                        label: opt.label,
                        value: opt.value,
                        emoji: opt.emoji,
                        default: config.defaultSize === opt.value
                    }))
                }
            },
            {
                type: 18,
                label: 'Pomocnicy',
                description: 'Kto pomaga? (opcjonalnie)',
                component: {
                    type: 5,
                    custom_id: 'helpers',
                    placeholder: 'Wybierz pomocników (opcjonalnie)',
                    min_values: 0,
                    max_values: 10,
                    required: false
                }
            },
            {
                type: 18,
                label: 'Status',
                description: 'Czy misja jest zakończona?',
                component: {
                    type: 21,
                    custom_id: 'completed',
                    options: [
                        { value: '1', label: '✅ Tak' },
                        { value: '0', label: '❌ Nie' }
                    ]
                }
            }
        ]
    };
}

// ==================== MODAL DODAWANIA POMOCNIKÓW Z PRE-SELECT (raw format) ====================
function buildAddHelpersModal(messageId, currentHelpers = []) {
    const defaultValues = currentHelpers.map(id => ({
        id: id,
        type: 'user'
    }));

    return {
        custom_id: `add_helpers_modal_${messageId}`,
        title: 'Edytuj pomocników do misji',
        components: [
            {
                type: 18,
                label: 'Pomocnicy',
                description: currentHelpers.length > 0 
                    ? `Obecni pomocnicy (${currentHelpers.length}) – możesz odznaczać i dodawać` 
                    : 'Wybierz pomocników',
                component: {
                    type: 5,
                    custom_id: 'new_helpers',
                    placeholder: 'Wybierz / odznacz pomocników',
                    min_values: 0,
                    max_values: 10,
                    required: false,
                    default_values: defaultValues
                }
            }
        ]
    };
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
        new ButtonBuilder().setCustomId('mission_subjugation').setLabel('Subjugation').setStyle(ButtonStyle.Secondary).setEmoji('<:Subjugation:1505240111733014740>'),
        new ButtonBuilder().setCustomId('mission_life').setLabel('Life').setStyle(ButtonStyle.Secondary).setEmoji('<:Gathering:1505240205727105316>'),
        new ButtonBuilder().setCustomId('mission_trading').setLabel('Trading').setStyle(ButtonStyle.Secondary).setEmoji('<:Barter:1505240419800318092>'),
        new ButtonBuilder().setCustomId('mission_boss_subjugation').setLabel('Boss Subjugation').setStyle(ButtonStyle.Secondary).setEmoji('<:BossSubjugation:1505240349717827624>')
    );

    const messages = await channel.messages.fetch({ limit: 50 });
    let existing = messages.find(msg => {
        if (msg.author.id !== client.user.id) return false;
        const hasTitle = msg.embeds?.some(e => e.title?.includes('Zarejestruj misje'));
        const hasButtons = msg.components?.some(r => r.components?.some(c => c.customId?.startsWith('mission_')));
        return hasTitle || hasButtons;
    });

    if (existing) {
        await existing.edit({ embeds: [mainEmbed], components: [mainRow] });
        console.log('✅ Mission registration message updated (existing)');
    } else {
        await channel.send({ embeds: [mainEmbed], components: [mainRow] });
        console.log('✅ Mission registration message created');
    }

    client.on('interactionCreate', async interaction => {
        if (interaction.isButton() && interaction.customId.startsWith('mission_')) {
            const categoryKey = interaction.customId.replace('mission_', '');
            if (!missionConfigs[categoryKey]) return;
            return interaction.showModal(buildMissionModal(categoryKey));
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('mission_modal_')) {
            await interaction.deferReply({ flags: 64 });
            const categoryKey = interaction.customId.replace('mission_modal_', '');
            const config = missionConfigs[categoryKey];

            const subType = interaction.fields.getStringSelectValues('sub_type')[0];
            const size = interaction.fields.getStringSelectValues('size')[0];
            const helpersField = interaction.fields.getField('helpers');
            const helpers = helpersField?.values ?? [];

            const completedField = interaction.fields.getField('completed');
            const completed = completedField?.value === '1';

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
                    new ButtonBuilder().setCustomId(`add_helpers_${sent.id}`).setLabel('Edytuj pomocników').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`complete_mission_${sent.id}`).setLabel('Zakończ misję').setStyle(ButtonStyle.Success)
                );
                await sent.edit({ embeds: [embed], components: [actionRow] });
            }

            return interaction.editReply({ content: `✅ Misja **${config.name}** została zarejestrowana!` });
        }

        if (interaction.isButton() && interaction.customId.startsWith('add_helpers_')) {
            const messageId = interaction.customId.split('_')[2];
            const mission = await missionManager.getMissionByMessageId(messageId);
            const currentHelpers = mission && mission.helpers ? mission.helpers : [];
            return interaction.showModal(buildAddHelpersModal(messageId, currentHelpers));
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('add_helpers_modal_')) {
            await interaction.deferReply({ flags: 64 });
            const messageId = interaction.customId.replace('add_helpers_modal_', '');

            const newHelpersField = interaction.fields.getField('new_helpers');
            const newHelpers = newHelpersField?.values ?? [];

            // <-- KLUCZOWA ZMIANA: nadpisujemy całą listę (dodawanie + usuwanie)
            const updatedMission = await missionManager.setHelpers(messageId, newHelpers);
            if (!updatedMission) return interaction.editReply({ content: '❌ Nie znaleziono misji.' });

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (msg) {
                const newEmbed = buildMissionEmbed(
                    updatedMission.category,
                    updatedMission.creator_id,
                    updatedMission.sub_type,
                    updatedMission.size,
                    updatedMission.helpers,
                    updatedMission.completed === 1
                );
                await msg.edit({ embeds: [newEmbed] });
            }

            return interaction.editReply({ 
                content: `✅ Pomocnicy zaktualizowani! (${newHelpers.length} osób)` 
            });
        }

        if (interaction.isButton() && interaction.customId.startsWith('complete_mission_')) {
            const messageId = interaction.customId.split('_')[2];

            await missionManager.completeMission(messageId);

            const mission = await missionManager.getMissionByMessageId(messageId);
            if (!mission) return interaction.reply({ content: '❌ Nie znaleziono misji.', flags: 64 });

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (msg) {
                const finalEmbed = buildMissionEmbed(
                    mission.category,
                    mission.creator_id,
                    mission.sub_type,
                    mission.size,
                    mission.helpers,
                    true
                );
                await msg.edit({ embeds: [finalEmbed], components: [] });
            }

            return interaction.reply({ content: '✅ Misja została oznaczona jako zakończona!', flags: 64 });
        }
    });

    console.log('✅ System misji gildyjnych uruchomiony – pre-select istniejących pomocników (stabilny raw format)');
}

module.exports = setupMissionRegistrationMessage;