/**
 * WarXOne - Quiz Daily Status (SCF)
 * GET /api/quiz-daily-status
 *
 * Checks if player can play quiz today.
 */

const { query, queryOne } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { ok, unauthorized, serverError, handlePreflight } = require('./shared/response');
const dayjs = require('dayjs');
require('dayjs/plugin/utc');

exports.main_handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  try {
    // Verify JWT token
    const userId = getUserIdFromHeaders(event.headers);
    if (!userId) {
      return unauthorized('Authentication required', event.headers);
    }

    // Convert to Hong Kong time (UTC+8)
    const now = dayjs().utcOffset(8);
    const hkDayStart = now.startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const hkDayEnd = now.endOf('day').format('YYYY-MM-DD HH:mm:ss');

    console.log('Checking daily limit for user:', userId);
    console.log('HK Day Start:', hkDayStart);
    console.log('HK Day End:', hkDayEnd);

    // Check if player already has a completed attempt today (Hong Kong time)
    const attempt = await queryOne(
      `SELECT id, started_at, completed_at FROM quiz_attempts 
       WHERE user_id = ? 
       AND started_at >= ?
       AND started_at <= ?
       AND completed_at IS NOT NULL
       LIMIT 1`,
      [userId, hkDayStart, hkDayEnd]
    );

    console.log('Found attempt:', attempt);

    if (attempt) {
      // Already played today, calculate time until next attempt (midnight Hong Kong time)
      const nextMidnight = now.endOf('day').add(1, 'second');
      const nextAttemptIn = nextMidnight.diff(dayjs().utcOffset(8), 'second');
      
      console.log('Already played today, next attempt in:', nextAttemptIn, 'seconds');
      
      return ok({
        canPlay: false,
        nextAttemptIn: Math.max(0, nextAttemptIn),
        message: 'You have already completed a quiz today. Come back tomorrow!',
      }, event.headers);
    }

    // Also check for abandoned attempts > 1 hour old (release daily limit slot)
    const oneHourAgo = now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
    await query(
      `UPDATE quiz_attempts 
       SET completed_at = ? 
       WHERE user_id = ? 
       AND started_at < ? 
       AND completed_at IS NULL`,
      ['abandoned', userId, oneHourAgo]
    );

    console.log('Can play quiz today');

    return ok({
      canPlay: true,
      nextAttemptIn: 0,
      message: 'You can play quiz today!',
    }, event.headers);

  } catch (err) {
    console.error('Quiz daily status error:', err);
    // Fail open (allow play) if database error
    return ok({
      canPlay: true,
      nextAttemptIn: 0,
      message: 'You can play quiz today!',
    }, event.headers);
  }
};
