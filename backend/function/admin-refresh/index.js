/**
 * WarXOne Admin - Admin Refresh (SCF)
 * POST /api/admin/refresh
 * Body: { refreshToken }
 *
 * Validates refresh token and issues new access + refresh tokens.
 * Implements refresh token rotation: increments version on each refresh.
 */

const { execute, queryOne } = require('./shared/db');
const { verifyToken, signAccessToken, signRefreshToken } = require('./shared/jwt');
const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');

async function ensureSchema() {
  await queryOne(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(512) NOT NULL,
      role VARCHAR(20) DEFAULT 'moderator',
      refresh_token_version INT DEFAULT 1,
      last_login TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
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

    // Check if this is an admin token (has role field)
    if (!payload.role) {
      return unauthorized('Invalid admin refresh token', event.headers);
    }

    const adminId = payload.sub;

    // Ensure schema exists
    await ensureSchema();

    // Check admin still exists and is active
    const admin = await queryOne('SELECT id, email, role, refresh_token_version, is_active FROM admin_users WHERE id = ?', [adminId]);
    if (!admin) {
      return unauthorized('Admin not found', event.headers);
    }

    if (!admin.is_active) {
      return unauthorized('Account is disabled', event.headers);
    }

    // Check refresh token version (rotation mechanism)
    const tokenVersion = payload.ver || 0;
    if (tokenVersion < admin.refresh_token_version - 1) {
      // Token is too old - possible reuse, revoke all refresh tokens
      await execute('UPDATE admin_users SET refresh_token_version = refresh_token_version + 1 WHERE id = ?', [adminId]);
      return unauthorized('Refresh token revoked', event.headers);
    }

    // Rotate: increment version
    await execute('UPDATE admin_users SET refresh_token_version = refresh_token_version + 1 WHERE id = ?', [adminId]);
    const newVersion = admin.refresh_token_version + 1;

    // Issue new tokens (include role in payload)
    const accessToken = signAccessToken(adminId, { role: admin.role });
    const newRefreshToken = signRefreshToken(adminId, { role: admin.role, ver: newVersion });

    return ok({
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      accessToken,
      refreshToken: newRefreshToken,
    }, event.headers);

  } catch (err) {
    console.error('Admin refresh error:', err);
    return serverError('Token refresh failed', event.headers);
  }
};
