// utils/missionManager.js
const boberdb = require('./db.js');

const missionPointsMap = {
    'Small (1250)': 1250, 'Small (2500)': 2500,
    'Medium (3750)': 3750, 'Medium (5000)': 5000,
    'Large (6250)': 6250, 'Large (7500)': 7500,
    'Extra Large (8750)': 8750, 'Extra Large (10000)': 10000,
    'Small': 1000, 'Medium': 2000, 'Large': 3000, 'Extra Large': 4000,
    'Small (20)': 500, 'Small (40)': 1000, 'Medium (60)': 1500, 'Medium (80)': 2000,
    'Large (100)': 2500, 'Large (120)': 3000, 'Extra Large (130)': 3500, 'Extra Large (150)': 4000,
    'Small': 1500, 'Medium': 2500, 'Large': 3500, 'Extra Large': 4500,
};

function safeParseHelpers(helpers) {
    if (!helpers) return [];
    if (Array.isArray(helpers)) return helpers;
    try {
        const parsed = JSON.parse(helpers);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

async function createMission(data) {
    const { creator_id, category, sub_type, size, helpers = [], channel_id, message_id } = data;
    const helpersJson = JSON.stringify(Array.isArray(helpers) ? helpers : []);

    const [result] = await boberdb.query(
        `INSERT INTO missions (creator_id, category, sub_type, size, helpers, completed, channel_id, message_id)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [creator_id, category, sub_type, size, helpersJson, channel_id, message_id]
    );
    return result.insertId;
}

async function getMissionByMessageId(messageId) {
    const [rows] = await boberdb.query('SELECT * FROM missions WHERE message_id = ?', [messageId]);
    const mission = rows[0];
    if (mission) {
        mission.helpers = safeParseHelpers(mission.helpers);
    }
    return mission || null;
}

async function addHelpers(messageId, newHelpers) {
    const mission = await getMissionByMessageId(messageId);
    if (!mission) return null;

    const current = mission.helpers || [];
    const updated = [...new Set([...current, ...newHelpers])];

    await boberdb.query(
        'UPDATE missions SET helpers = ? WHERE message_id = ?',
        [JSON.stringify(updated), messageId]
    );
    return updated;
}

async function completeMission(messageId) {
    await boberdb.query(
        `UPDATE missions SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE message_id = ?`,
        [messageId]
    );
    return await getMissionByMessageId(messageId);   // <-- zawsze zwracamy pełny rekord z bazy
}

async function setHelpers(messageId, helpers) {
    const helpersJson = JSON.stringify(Array.isArray(helpers) ? helpers : []);

    await boberdb.query(
        'UPDATE missions SET helpers = ? WHERE message_id = ?',
        [helpersJson, messageId]
    );

    // zwracamy pełny, zaktualizowany rekord
    return await getMissionByMessageId(messageId);
}

module.exports = {
    createMission,
    getMissionByMessageId,
    setHelpers,          // <-- nowa funkcja (zastępuje starą addHelpers)
    completeMission
};