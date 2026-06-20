/**
 * WarXOne - Auth Logout (SCF)
 * POST /api/auth/logout
 * Body: { refreshToken } (optional)
 * Headers: Authorization: Bearer <accessToken>
 *
 * Increments refresh token version to invalidate all existing refresh tokens.
 * The client should also delete tokens from localStorage.
 */

const { execute, queryOne, query } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { ok, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');

async function ensureSchema() {
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

    // Check user exists
    const user = await queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return unauthorized('User not found', event.headers);
    }

    // Invalidate all refresh tokens by bumping the version
    await execute('UPDATE users SET refresh_token_version = refresh_token_version + 1 WHERE id = ?', [userId]);

    return ok({ message: 'Logged out successfully' }, event.headers);

  } catch (err) {
    console.error('Logout error:', err);
    return serverError('Logout failed', event.headers);
  }
};
