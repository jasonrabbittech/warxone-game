/**
 * WarXOne - Game Load (SCF)
 * GET /api/game/save
 * Headers: Authorization: Bearer <accessToken>
 *
 * Loads the player's saved game state from the database.
 */

const { queryOne, query } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { ok, unauthorized, notFound, serverError, handlePreflight } = require('./shared/response');

async function ensureSchema() {
  // Ensure users table exists (FK dependency)
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(512) NOT NULL,
      display_name VARCHAR(50) DEFAULT '',
      auth_provider VARCHAR(20) DEFAULT 'email',
      provider_id VARCHAR(255) DEFAULT '',
      refresh_token_version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_provider (auth_provider, provider_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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

    // Ensure schema exists
    await ensureSchema();

    // Find the user's save
    const save = await queryOne(
      'SELECT game_state, country_name, level, updated_at FROM game_saves WHERE user_id = ?',
      [userId]
    );

    if (!save) {
      return notFound('No saved game found', event.headers);
    }

    // Parse JSON game state
    let gameState;
    if (typeof save.game_state === 'string') {
      gameState = JSON.parse(save.game_state);
    } else {
      gameState = save.game_state;
    }

    return ok({
      gameState,
      meta: {
        countryName: save.country_name,
        level: save.level,
        savedAt: save.updated_at,
      },
    }, event.headers);

  } catch (err) {
    console.error('Game load error:', err);
    return serverError('Failed to load game', event.headers);
  }
};
