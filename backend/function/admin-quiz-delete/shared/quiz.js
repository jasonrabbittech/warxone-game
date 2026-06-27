/**
 * WarXOne - Shared Quiz Logic
 * Token calculation, timer config, difficulty config, daily limit check
 */

const mysql = require('mysql2/promise');

/**
 * Difficulty configurations
 * @type {Object.<string, {reward: number, penalty: number, timer: number}>}
 */
const DIFFICULTY_CONFIG = {
  easy: { reward: 1, penalty: 0, timer: 5 },
  medium: { reward: 2, penalty: 1, timer: 10 },
  hard: { reward: 3, penalty: 2, timer: 15 },
  super_hard: { reward: 5, penalty: 3, timer: 10 },
  invincible_hard: { reward: 10, penalty: 5, timer: 10 },
};

/**
 * Unlock levels for hidden difficulties
 * @type {Object.<string, number>}
 */
const UNLOCK_LEVEL = {
  super_hard: 10,
  invincible_hard: 20,
};

/**
 * Get timer config for difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {{timer: number}} Timer config (seconds per question)
 */
function getTimerConfig(difficulty) {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }
  return { timer: config.timer };
}

/**
 * Get difficulty config (reward, penalty)
 * @param {string} difficulty - Difficulty level
 * @returns {{reward: number, penalty: number}} Difficulty config
 */
function getDifficultyConfig(difficulty) {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }
  return { reward: config.reward, penalty: config.penalty };
}

/**
 * Calculate tokens earned/deducted for a quiz attempt
 * @param {string} difficulty - Difficulty level
 * @param {number} correctCount - Number of correct answers
 * @param {number} incorrectCount - Number of incorrect answers (excluding timeouts)
 * @returns {number} Tokens earned (can be negative)
 */
function calculateTokens(difficulty, correctCount, incorrectCount) {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }
  
  const earned = correctCount * config.reward;
  const deducted = incorrectCount * config.penalty;
  return earned - deducted;
}

/**
 * Get unlock level for difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {number} Required player level (0 if not hidden)
 */
function getUnlockLevel(difficulty) {
  return UNLOCK_LEVEL[difficulty] || 0;
}

/**
 * Check if difficulty is unlocked for player
 * @param {string} difficulty - Difficulty level
 * @param {number} playerLevel - Player's current level
 * @returns {boolean} True if unlocked
 */
function isDifficultyUnlocked(difficulty, playerLevel) {
  const requiredLevel = getUnlockLevel(difficulty);
  return requiredLevel === 0 || playerLevel >= requiredLevel;
}

/**
 * Check daily limit for player (Hong Kong time UTC+8)
 * @param {string} userId - Player user ID
 * @param {string} startedAt - Start time (ISO string or Date)
 * @returns {Promise<{canPlay: boolean, nextAttemptIn: number}>}
 */
async function checkDailyLimit(userId, startedAt) {
  const dayjs = require('dayjs');
  const utcOffset = require('dayjs/plugin/utc');
  dayjs.extend(utcOffset);

  // Convert to Hong Kong time (UTC+8)
  const hkTime = dayjs(startedAt).utcOffset(8);
  const hkDayStart = hkTime.startOf('day');
  const hkDayEnd = hkTime.endOf('day');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'warxone_db',
    });

    // Check if player already has a completed attempt today (Hong Kong time)
    const [rows] = await connection.query(
      `SELECT id FROM quiz_attempts 
       WHERE user_id = ? 
       AND started_at >= ? 
       AND started_at <= ?
       AND completed_at IS NOT NULL
       LIMIT 1`,
      [userId, hkDayStart.toDate(), hkDayEnd.toDate()]
    );

    if (rows.length > 0) {
      // Already played today, calculate time until next attempt (midnight Hong Kong time)
      const nextMidnight = hkDayEnd.add(1, 'second');
      const nextAttemptIn = nextMidnight.diff(dayjs().utcOffset(8), 'second');
      return { canPlay: false, nextAttemptIn: Math.max(0, nextAttemptIn) };
    }

    // Also check for abandoned attempts > 1 hour old (release daily limit slot)
    await connection.query(
      `UPDATE quiz_attempts 
       SET completed_at = ? 
       WHERE user_id = ? 
       AND started_at < ? 
       AND completed_at IS NULL`,
      ['abandoned', userId, dayjs().utcOffset(8).subtract(1, 'hour').toDate()]
    );

    return { canPlay: true, nextAttemptIn: 0 };
  } catch (error) {
    console.error('Error checking daily limit:', error);
    // Fail open (allow play) if database error
    return { canPlay: true, nextAttemptIn: 0 };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  getTimerConfig,
  getDifficultyConfig,
  calculateTokens,
  getUnlockLevel,
  isDifficultyUnlocked,
  checkDailyLimit,
  DIFFICULTY_CONFIG,
  UNLOCK_LEVEL,
};
