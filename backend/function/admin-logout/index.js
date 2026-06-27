/**
 * WarXOne Admin - Admin Logout (SCF)
 * POST /api/admin/logout
 * Headers: Authorization: Bearer <accessToken>
 *
 * Increments refresh token version to invalidate all existing refresh tokens.
 * The client should also delete tokens from localStorage.
 */

const { execute, queryOne } = require('./shared/db');
const { getAdminInfoFromHeaders } = require('./shared/adminAuth');
const { ok, unauthorized, serverError, handlePreflight } = require('./shared/response');

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
    const adminInfo = getAdminInfoFromHeaders(event.headers);
    if (!adminInfo) {
      return unauthorized('Not authenticated', event.headers);
    }

    // Ensure schema exists
    await ensureSchema();

    // Check admin still exists
    const admin = await queryOne('SELECT id FROM admin_users WHERE id = ?', [adminInfo.adminId]);
    if (!admin) {
      return unauthorized('Admin not found', event.headers);
    }

    // Invalidate all refresh tokens by bumping the version
    await execute('UPDATE admin_users SET refresh_token_version = refresh_token_version + 1 WHERE id = ?', [adminInfo.adminId]);

    return ok({ message: 'Logged out successfully' }, event.headers);

  } catch (err) {
    console.error('Admin logout error:', err);
    return serverError('Logout failed', event.headers);
  }
};
