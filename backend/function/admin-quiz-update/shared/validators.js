/**
 * WarXOne - Input Validation Utilities
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified - covers 99% of real emails
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 letter and 1 number
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate country/capital name
 * @param {string} name
 * @param {number} maxLength
 * @returns {{ valid: boolean, message: string }}
 */
function validateName(name, maxLength = 20) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: 'Name cannot be blank' };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, message: `Name must be ${maxLength} characters or less` };
  }
  // No special characters that could be used for XSS
  if (/[<>\"\'&]/.test(trimmed)) {
    return { valid: false, message: 'Name contains invalid characters' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate game state data before saving
 * @param {object} state - Game state object
 * @returns {{ valid: boolean, message: string }}
 */
function validateGameState(state) {
  if (!state || typeof state !== 'object') {
    return { valid: false, message: 'Game state is required' };
  }
  // Rough size check - game state shouldn't exceed 1MB JSON
  const jsonSize = JSON.stringify(state).length;
  if (jsonSize > 1024 * 1024) {
    return { valid: false, message: 'Game state is too large (max 1MB)' };
  }
  return { valid: true, message: '' };
}

/**
 * Sanitize string input (trim + escape HTML)
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  isValidEmail,
  validatePassword,
  validateName,
  validateGameState,
  sanitize,
};
