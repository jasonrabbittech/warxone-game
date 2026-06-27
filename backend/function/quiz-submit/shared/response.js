/**
 * WarXOne - Standard HTTP Response Helpers
 * Handles CORS headers and consistent JSON response format
 * Environment variable: ALLOWED_ORIGIN
 */

const ALLOWED_ORIGINS = [
  'https://warxone-game-dpzpjjtty6i7.edgeone.dev',
  'http://localhost:3000',   // Vite dev server
  'http://localhost:5173',   // Vite default dev port
];

/**
 * Get CORS headers for the response
 * @param {object} eventHeaders - Incoming request headers
 * @returns {object} CORS headers object
 */
function getCorsHeaders(eventHeaders) {
  const origin = (eventHeaders && (
    eventHeaders.Origin || eventHeaders.origin ||
    eventHeaders.ORIGIN || ''
  )).toLowerCase();

  // Allow if origin matches allowed list, or is an EdgeOne preview domain
  const allowed = ALLOWED_ORIGINS.some(o => o.toLowerCase() === origin) ||
    origin.includes('.edgeoneapp.com') ||
    origin.includes('.edgeone.dev');

  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Build a standard API Gateway response
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body (will be JSON-stringified)
 * @param {object} eventHeaders - Incoming request headers (for CORS)
 * @returns {object} API Gateway response object
 */
function buildResponse(statusCode, body, eventHeaders) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getCorsHeaders(eventHeaders),
    },
    body: JSON.stringify(body),
  };
}

/**
 * 200 OK response
 */
function ok(data, eventHeaders) {
  return buildResponse(200, { success: true, data }, eventHeaders);
}

/**
 * 201 Created response
 */
function created(data, eventHeaders) {
  return buildResponse(201, { success: true, data }, eventHeaders);
}

/**
 * 400 Bad Request response
 */
function badRequest(message, eventHeaders) {
  return buildResponse(400, { success: false, error: message || 'Bad request' }, eventHeaders);
}

/**
 * 401 Unauthorized response
 */
function unauthorized(message, eventHeaders) {
  return buildResponse(401, { success: false, error: message || 'Unauthorized' }, eventHeaders);
}

/**
 * 403 Forbidden response
 */
function forbidden(message, eventHeaders) {
  return buildResponse(403, { success: false, error: message || 'Forbidden' }, eventHeaders);
}

/**
 * 404 Not Found response
 */
function notFound(message, eventHeaders) {
  return buildResponse(404, { success: false, error: message || 'Not found' }, eventHeaders);
}

/**
 * 409 Conflict response (e.g., duplicate email)
 */
function conflict(message, eventHeaders) {
  return buildResponse(409, { success: false, error: message || 'Conflict' }, eventHeaders);
}

/**
 * 500 Internal Server Error response
 */
function serverError(message, eventHeaders) {
  return buildResponse(500, { success: false, error: message || 'Internal server error' }, eventHeaders);
}

/**
 * Handle CORS preflight (OPTIONS) request
 */
function handlePreflight(eventHeaders) {
  return {
    statusCode: 204,
    headers: getCorsHeaders(eventHeaders),
    body: '',
  };
}

/**
 * Parse the request body from API Gateway event
 * Handles both string and already-parsed body
 * @param {object} event - API Gateway event
 * @returns {object} Parsed body
 */
function parseBody(event) {
  if (!event.body) return {};
  if (typeof event.body === 'string') {
    try {
      return JSON.parse(event.body);
    } catch {
      return {};
    }
  }
  return event.body;
}

module.exports = {
  getCorsHeaders,
  buildResponse,
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  handlePreflight,
  parseBody,
};
