/**
 * WarXOne - Auth Login (SCF)
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Verifies credentials and returns JWT tokens.
 */

const { queryOne, query } = require('./shared/db');
const { signAccessToken, signRefreshToken } = require('./shared/jwt');
const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');
const { isValidEmail } = require('./shared/validators');
const crypto = require('crypto');

const HASH_KEY_LENGTH = 64;

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

function verifyPassword(password, storedHash) {
  const [algorithm, iterations, salt, hash] = storedHash.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, parseInt(iterations), HASH_KEY_LENGTH, algorithm).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
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

    // Find user
    const user = await queryOne(
      'SELECT id, email, password_hash, display_name, auth_provider FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (!user) {
      // Don't reveal whether email exists (security best practice)
      return unauthorized('Invalid email or password', event.headers);
    }

    // For Google-auth users, don't allow password login
    if (user.auth_provider === 'google') {
      return unauthorized('Please login with Google', event.headers);
    }

    // Verify password
    const valid = verifyPassword(password, user.password_hash);
    if (!valid) {
      return unauthorized('Invalid email or password', event.headers);
    }

    // Generate tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return ok({
      user: { id: user.id, email: user.email, displayName: user.display_name },
      accessToken,
      refreshToken,
    }, event.headers);

  } catch (err) {
    console.error('Login error:', err);
    return serverError('Login failed', event.headers);
  }
};
