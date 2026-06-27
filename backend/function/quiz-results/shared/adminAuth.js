/**
 * WarXOne Admin - Admin Authentication Middleware
 * Verifies admin JWT tokens and extracts admin info from Authorization header.
 */

const { verifyToken } = require('./jwt');

/**
 * Extract admin info from Authorization header
 * @param {object} headers - Request headers (case-insensitive keys)
 * @returns {object|null} { adminId, role } if valid admin token, null otherwise
 */
function getAdminInfoFromHeaders(headers) {
  if (!headers) return null;

  // API Gateway may lowercase headers
  const authHeader = headers.Authorization || headers.authorization || headers.AUTHORIZATION;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'access') return null;

  // Check if this is an admin token (has role field)
  if (!payload.role) return null;

  return {
    adminId: payload.sub,
    role: payload.role
  };
}

/**
 * Admin authentication middleware (for SCF functions)
 * @param {object} event - SCF event object
 * @returns {object|null} admin info if authenticated, or error response object
 */
function requireAdmin(event) {
  const adminInfo = getAdminInfoFromHeaders(event.headers);
  if (!adminInfo) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
    };
  }

  // Attach admin info to event for use by handler
  event.admin = adminInfo;
  return null; // null means authenticated
}

/**
 * Super admin only middleware (for sensitive operations)
 * @param {object} event - SCF event object
 * @returns {object|null} admin info if super admin, or error response object
 */
function requireSuperAdmin(event) {
  const authError = requireAdmin(event);
  if (authError) return authError;

  if (event.admin.role !== 'super_admin') {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ error: 'Forbidden. Super admin access required.' }),
    };
  }

  return null;
}

module.exports = {
  getAdminInfoFromHeaders,
  requireAdmin,
  requireSuperAdmin,
};
