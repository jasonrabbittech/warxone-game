// Input validation utilities for SCF functions
// Uses validator library for common validations
import validator from 'validator';

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return validator.isEmail(email) && email.length <= 100;
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {boolean}
 */
export function isValidUsername(username) {
  return validator.isAlphanumeric(username, 'en-US', { ignore: '_' }) &&
         username.length >= 3 &&
         username.length <= 50;
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {boolean}
 */
export function isValidPassword(password) {
  return password.length >= 8 && password.length <= 128;
}

/**
 * Sanitize string (prevent XSS)
 * @param {string} input - String to sanitize
 * @returns {string}
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return validator.escape(input.trim());
}

/**
 * Validate integer range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
export function isValidIntegerRange(value, min, max) {
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validate UUID v4
 * @param {string} uuid - UUID to validate
 * @returns {boolean}
 */
export function isValidUUID(uuid) {
  return validator.isUUID(uuid, 4);
}

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {boolean}
 */
export function isValidJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validate required fields in object
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - Required field names
 * @returns {Object} - { valid: boolean, missing: Array<string> }
 */
export function validateRequiredFields(obj, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validate game state JSON structure
 * @param {Object} gameState - Game state to validate
 * @returns {Object} - { valid: boolean, errors: Array<string> }
 */
export function validateGameState(gameState) {
  const errors = [];

  if (!gameState || typeof gameState !== 'object') {
    errors.push('Game state must be an object');
    return { valid: false, errors };
  }

  // Check required fields
  const required = ['player', 'territories', 'resources'];
  const { missing } = validateRequiredFields(gameState, required);
  
  if (missing.length > 0) {
    errors.push(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate player object
  if (gameState.player) {
    if (typeof gameState.player.tokens !== 'number' || gameState.player.tokens < 0) {
      errors.push('player.tokens must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
