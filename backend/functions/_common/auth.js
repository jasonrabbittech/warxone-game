// JWT authentication middleware for SCF functions
import jwt from 'jsonwebtoken';

/**
 * JWT authentication middleware
 * Verifies the Authorization header and decodes the JWT token
 * @param {Object} event - SCF event object
 * @returns {Object} - Decoded token or throws error
 */
export function authenticate(event) {
  // Get Authorization header
  const authHeader = event.headers?.['Authorization'] || event.headers?.['authorization'];
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  // Extract token (format: "Bearer <token>")
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    throw new Error('Missing JWT token');
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('JWT token expired');
    } else if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid JWT token');
    } else {
      throw new Error(`JWT verification failed: ${err.message}`);
    }
  }
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration (default: 7d)
 * @returns {string} - JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * SCF handler wrapper with authentication
 * @param {Function} handler - SCF handler function
 * @returns {Function} - Wrapped handler with auth
 */
export function withAuth(handler) {
  return async (event, context) => {
    try {
      // Authenticate
      const decoded = authenticate(event);
      
      // Add user info to event
      event.user = decoded;
      
      // Call handler
      return await handler(event, context);
    } catch (err) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: err.message
        })
      };
    }
  };
}
