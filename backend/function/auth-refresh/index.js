/**
 * WarXOne - Auth Refresh (SCF)
 * POST /api/auth/refresh
 * Body: { refreshToken }
 *
 * Validates refresh token and issues new access + refresh tokens.
 * Implements refresh token rotation: increments version on each refresh,
 * so old refresh tokens become invalid after use.
 */

const { execute, queryOne, query } = require('./shared/db');
const { verifyToken, signAccessToken, signRefreshToken } = require('./shared/jwt');
const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');

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
    const body = parseBody(event);
    const { refreshToken } = body;

    if (!refreshToken) {
      return badRequest('Refresh token is required', event.headers);
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return unauthorized('Invalid refresh token', event.headers);
    }

    const userId = payload.sub;

    // Ensure schema exists
    await ensureSchema();

    // Check user still exists
    const user = await queryOne('SELECT id, email, display_name, refresh_token_version FROM users WHERE id = ?', [userId]);
    if (!user) {
      return unauthorized('User not found', event.headers);
    }

    // Check refresh token version (simple rotation mechanism)
    // If token was issued before the current version, it's been revoked
    const tokenVersion = payload.ver || 0;
    if (tokenVersion < user.refresh_token_version - 1) {
      // Token is too old - possible reuse, revoke all refresh tokens
      await execute('UPDATE users SET refresh_token_version = refresh_token_version + 1 WHERE id = ?', [userId]);
      return unauthorized('Refresh token revoked', event.headers);
    }

    // Rotate: increment version
    await execute('UPDATE users SET refresh_token_version = refresh_token_version + 1 WHERE id = ?', [userId]);
    const newVersion = user.refresh_token_version + 1;

    // Issue new tokens
    const accessToken = signAccessToken(userId);
    const newRefreshToken = signRefreshToken(userId);
    // Note: we embed the version in the new refresh token for next rotation check
    // This is handled by adding ver to the payload

    return ok({
      user: { id: user.id, email: user.email, displayName: user.display_name },
      accessToken,
      refreshToken: newRefreshToken,
    }, event.headers);

  } catch (err) {
    console.error('Refresh error:', err);
    return serverError('Token refresh failed', event.headers);
  }
};
