/**
 * Generate PBKDF2 hash for admin password
 * Usage: node scripts/generate-admin-hash.js <password>
 */

const crypto = require('crypto');

const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const HASH_ALGORITHM = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM).toString('hex');
  return `${HASH_ALGORITHM}:${HASH_ITERATIONS}:${salt}:${hash}`;
}

const password = process.argv[2] || 'Admin@2026';
const hash = hashPassword(password);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nSQL INSERT:');
console.log(`INSERT INTO admin_users (id, email, password_hash, role, is_active) VALUES (UUID(), 'admin@warxone.com', '${hash}', 'super_admin', TRUE) ON DUPLICATE KEY UPDATE password_hash = '${hash}';`);
