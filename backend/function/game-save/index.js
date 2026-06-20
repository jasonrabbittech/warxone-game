/**
 * WarXOne - Game Save (SCF)
 * PUT /api/game/save
 * Headers: Authorization: Bearer <accessToken>
 * Body: { gameState }
 *
 * Upserts the player's game state into the database.
 * One save slot per user (simple design for Phase 2).
 */

const { execute, queryOne, query } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');
const { validateGameState } = require('./shared/validators');

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS game_saves (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      game_state JSON NOT NULL,
      country_name VARCHAR(50) DEFAULT '',
      level INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_user_id (user_id),
      INDEX idx_level (level),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

exports.main_handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  try {
    const userId = getUserIdFromHeaders(event.headers);
    if (!userId) {
      return unauthorized('Not authenticated', event.headers);
    }

    const body = parseBody(event);
    const { gameState } = body;

    // Validate game state
    const stateCheck = validateGameState(gameState);
    if (!stateCheck.valid) {
      return badRequest(stateCheck.message, event.headers);
    }

    // Ensure schema exists
    await ensureSchema();

    // Extract summary fields for indexing
    const countryName = (gameState.player && gameState.player.countryName) || '';
    const level = (gameState.player && gameState.player.level) || 1;
    const stateJson = JSON.stringify(gameState);

    // Upsert: insert or update if user already has a save
    const existing = await queryOne('SELECT id FROM game_saves WHERE user_id = ?', [userId]);

    if (existing) {
      await execute(
        'UPDATE game_saves SET game_state = ?, country_name = ?, level = ? WHERE user_id = ?',
        [stateJson, countryName, level, userId]
      );
    } else {
      const saveId = require('crypto').randomUUID();
      await execute(
        'INSERT INTO game_saves (id, user_id, game_state, country_name, level) VALUES (?, ?, ?, ?, ?)',
        [saveId, userId, stateJson, countryName, level]
      );
    }

    return ok({ message: 'Game saved successfully', savedAt: new Date().toISOString() }, event.headers);

  } catch (err) {
    console.error('Game save error:', err);
    return serverError('Failed to save game', event.headers);
  }
};
