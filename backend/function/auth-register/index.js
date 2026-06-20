/**
 * WarXOne - Auth Register (SCF)
 * POST /api/auth/register
 * Body: { email, password }
 *
 * Creates a new user account with email + hashed password.
 * Returns access + refresh JWT tokens.
 */

const { query, execute, queryOne } = require('./shared/db');
const { signAccessToken, signRefreshToken } = require('./shared/jwt');
const { ok, created, badRequest, conflict, serverError, parseBody, handlePreflight } = require('./shared/response');
const { isValidEmail, validatePassword } = require('./shared/validators');
const crypto = require('crypto');

// Simple bcrypt alternative using Node.js crypto (SCF doesn't have native bcrypt)
// Uses PBKDF2 with 100,000 iterations (OWASP recommended)
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const HASH_ALGORITHM = 'sha512';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM).toString('hex');
  return `${HASH_ALGORITHM}:${HASH_ITERATIONS}:${salt}:${hash}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, iterations, salt, hash] = storedHash.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, parseInt(iterations), HASH_KEY_LENGTH, algorithm).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

// Ensure users table exists (idempotent)
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
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  try {
    const body = parseBody(event);
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return badRequest('Email and password are required', event.headers);
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return badRequest('Invalid email format', event.headers);
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return badRequest(pwCheck.message, event.headers);
    }

    // Ensure schema exists
    await ensureSchema();

    // Check if email already registered
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing) {
      return conflict('Email already registered', event.headers);
    }

    // Hash password and create user
    const userId = crypto.randomUUID();
    const hashedPw = await hashPassword(password);

    await execute(
      'INSERT INTO users (id, email, password_hash, auth_provider) VALUES (?, ?, ?, ?)',
      [userId, trimmedEmail, hashedPw, 'email']
    );

    // Generate tokens
    const accessToken = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);

    return created({
      user: { id: userId, email: trimmedEmail },
      accessToken,
      refreshToken,
    }, event.headers);

  } catch (err) {
    console.error('Register error:', err);
    return serverError('Registration failed', event.headers);
  }
};

// Export verifyPassword for use by auth-login
exports.verifyPassword = verifyPassword;
exports.hashPassword = hashPassword;
