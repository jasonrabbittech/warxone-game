/**
 * WarXOne - Auth Google SSO (SCF)
 * POST /api/auth/google
 * Body: { code, redirectUri }
 *
 * OAuth 2.0 authorization code flow with Google.
 * Exchanges authorization code for user info, creates/finds user.
 *
 * Phase D: This is a stub that will be activated when user has GCP account.
 * Currently returns 501 Not Implemented.
 */

const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight, getCorsHeaders } = require('./shared/response');

exports.main_handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  // Check if Google SSO is configured (trim handles empty/whitespace strings from Terraform)
  if (!process.env.GOOGLE_CLIENT_ID?.trim() || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    return {
      statusCode: 501,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...getCorsHeaders(event.headers),
      },
      body: JSON.stringify({
        success: false,
        error: 'Google SSO is not configured yet. Please use email/password login.',
      }),
    };
  }

  try {
    const body = parseBody(event);
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return badRequest('Authorization code and redirect URI are required', event.headers);
    }

    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.json();
      console.error('Google token exchange failed:', errData);
      return unauthorized('Google authentication failed', event.headers);
    }

    const tokenData = await tokenResponse.json();
    const { id_token } = tokenData;

    // Step 2: Decode ID token to get user info
    // (In production, verify the token signature; for now, decode the payload)
    const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString('utf8'));
    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name || '';

    if (!email) {
      return badRequest('Google account did not provide email', event.headers);
    }

    // Step 3: Find or create user
    const { queryOne, execute } = require('./shared/db');
    const { signAccessToken, signRefreshToken } = require('./shared/jwt');

    await ensureSchema();

    // Check if user exists with this Google ID
    let user = await queryOne(
      'SELECT id, email, display_name FROM users WHERE auth_provider = ? AND provider_id = ?',
      ['google', googleId]
    );

    if (!user) {
      // Check if email already registered via email/password
      user = await queryOne('SELECT id, email FROM users WHERE email = ?', [email.toLowerCase()]);
      if (user) {
        // Link Google account to existing user
        await execute(
          'UPDATE users SET auth_provider = ?, provider_id = ? WHERE id = ?',
          ['google', googleId, user.id]
        );
      } else {
        // Create new user
        const userId = require('crypto').randomUUID();
        await execute(
          'INSERT INTO users (id, email, password_hash, display_name, auth_provider, provider_id) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, email.toLowerCase(), '', displayName, 'google', googleId]
        );
        user = { id: userId, email: email.toLowerCase(), display_name: displayName };
      }
    }

    // Generate tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return ok({
      user: { id: user.id, email: user.email, displayName: user.display_name || displayName },
      accessToken,
      refreshToken,
    }, event.headers);

  } catch (err) {
    console.error('Google auth error:', err);
    return serverError('Google authentication failed', event.headers);
  }
};

async function ensureSchema() {
  const { query } = require('./shared/db');
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
