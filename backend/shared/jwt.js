/**
 * WarXOne - JWT Token Utilities
 * HMAC-SHA256 signed tokens using Node.js crypto (no external deps)
 * Environment variable: JWT_SECRET
 *
 * Token format: base64url(header).base64url(payload).base64url(signature)
 */

const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRY = 15 * 60;       // 15 minutes (seconds)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 3600; // 7 days (seconds)

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Base64URL encode a buffer
 */
function base64UrlEncode(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode to buffer
 */
function base64UrlDecode(str) {
  // Restore standard base64 padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Sign a JWT token
 * @param {object} payload - Token payload (must include sub)
 * @param {number} expiresIn - Expiry in seconds from now
 * @returns {string} Signed JWT token
 */
function signToken(payload, expiresIn) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded payload if valid, null if invalid/expired
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // Verify signature
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', getSecret())
      .update(signingInput)
      .digest();

    const actualSig = base64UrlDecode(signatureB64);

    if (!crypto.timingSafeEqual(expectedSig, actualSig)) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Sign an access token (short-lived: 15 min)
 * @param {string} userId - User ID
 * @param {object} extra - Additional payload fields
 * @returns {string} Access token
 */
function signAccessToken(userId, extra = {}) {
  return signToken({ sub: userId, type: 'access', ...extra }, ACCESS_TOKEN_EXPIRY);
}

/**
 * Sign a refresh token (long-lived: 7 days)
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
function signRefreshToken(userId) {
  return signToken({ sub: userId, type: 'refresh' }, REFRESH_TOKEN_EXPIRY);
}

/**
 * Extract user ID from Authorization header
 * @param {object} headers - Request headers (case-insensitive keys)
 * @returns {string|null} User ID if valid token, null otherwise
 */
function getUserIdFromHeaders(headers) {
  if (!headers) return null;

  // API Gateway may lowercase headers
  const authHeader = headers.Authorization || headers.authorization || headers.AUTHORIZATION;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'access') return null;

  return payload.sub;
}

module.exports = {
  signToken,
  verifyToken,
  signAccessToken,
  signRefreshToken,
  getUserIdFromHeaders,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
