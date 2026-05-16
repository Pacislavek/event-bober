// utils/missionManager.js
const boberdb = require('./db.js');

const missionPointsMap = {
    // Subjugation
    'Small (1250)': 1250, 'Small (2500)': 2500,
    'Medium (3750)': 3750, 'Medium (5000)': 5000,
    'Large (6250)': 6250, 'Large (7500)': 7500,
    'Extra Large (8750)': 8750, 'Extra Large (10000)': 10000,
    // Life
    'Small': 1000, 'Medium': 2000, 'Large': 3000, 'Extra Large': 4000,
    // Trading
    'Small (20)': 500, 'Small (40)': 1000, 'Medium (60)': 1500, 'Medium (80)': 2000,
    'Large (100)': 2500, 'Large (120)': 3000, 'Extra Large (130)': 3500, 'Extra Large (150)': 4000,
    // Boss Subjugation
    'Small': 1500, 'Medium': 2500, 'Large': 3500, 'Extra Large': 4500,
};

async function createMission(data) {
    const { creator_id, category, sub_type, size, helpers = [], channel_id, message_id } = data;
    
    // ZAWSZE zapisujemy poprawny JSON (nawet pustą tablicę)
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
    return rows[0] || null;
}

async function addHelpers(messageId, newHelpers) {
    const mission = await getMissionByMessageId(messageId);
    if (!mission) return null;

    // Bezpieczne parsowanie (naprawia crash "Unexpected end of JSON input")
    let current = [];
    if (mission.helpers) {
        try {
            current = JSON.parse(mission.helpers);
        } catch (e) {
            current = [];
        }
    }

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
    return await getMissionByMessageId(messageId);
}

function getPoints(size) {
    return missionPointsMap[size] || 1000;
}

module.exports = {
    createMission,
    getMissionByMessageId,
    addHelpers,
    completeMission,
    getPoints
};