/**
 * WarXOne Admin - Admin Login (SCF)
 * POST /api/admin/login
 * Body: { email, password }
 *
 * Verifies admin credentials and returns JWT tokens.
 */

const { queryOne } = require('./shared/db');
const { signAccessToken, signRefreshToken } = require('./shared/jwt');
const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');
const { isValidEmail } = require('./shared/validators');
const crypto = require('crypto');

const HASH_KEY_LENGTH = 64;

// Verify password using PBKDF2 (same as player auth)
function verifyPassword(password, storedHash) {
  const [algorithm, iterations, salt, hash] = storedHash.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, parseInt(iterations), HASH_KEY_LENGTH, algorithm).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

// Ensure admin_users table exists
async function ensureSchema() {
  await queryOne(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(512) NOT NULL,
      role VARCHAR(20) DEFAULT 'moderator',
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
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  try {
    const body = parseBody(event);
    const { email, password } = body;

    if (!email || !password) {
      return badRequest('Email and password are required', event.headers);
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return badRequest('Invalid email format', event.headers);
    }

    // Ensure schema exists
    await ensureSchema();

    // Find admin user
    const admin = await queryOne(
      'SELECT id, email, password_hash, role, is_active FROM admin_users WHERE email = ?',
      [trimmedEmail]
    );

    if (!admin) {
      // Don't reveal whether email exists
      return unauthorized('Invalid email or password', event.headers);
    }

    // Check if admin is active
    if (!admin.is_active) {
      return unauthorized('Account is disabled. Contact super admin.', event.headers);
    }

    // Verify password
    const valid = verifyPassword(password, admin.password_hash);
    if (!valid) {
      return unauthorized('Invalid email or password', event.headers);
    }

    // Update last login time
    await queryOne(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // Generate tokens (include role in payload)
    const accessToken = signAccessToken(admin.id, { role: admin.role });
    const refreshToken = signRefreshToken(admin.id, { role: admin.role });

    return ok({
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      accessToken,
      refreshToken,
    }, event.headers);

  } catch (err) {
    console.error('Admin login error:', err);
    return serverError('Login failed', event.headers);
  }
};
