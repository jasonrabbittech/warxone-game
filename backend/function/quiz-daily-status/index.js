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
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

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

    // Get current time in Hong Kong timezone (UTC+8)
    const now = dayjs();
    const hkNow = now.utcOffset(8);
    
    // Convert HK day range to UTC for database query (started_at is now stored as UTC)
    const hkTodayStart = hkNow.startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const hkTodayEnd = hkNow.endOf('day').format('YYYY-MM-DD HH:mm:ss');
    
    // Convert to UTC for database query
    const hkTodayStartUTC = dayjs(hkTodayStart).utc().format('YYYY-MM-DD HH:mm:ss');
    const hkTodayEndUTC = dayjs(hkTodayEnd).utc().format('YYYY-MM-DD HH:mm:ss');

    console.log('Checking daily limit for user:', userId);
    console.log('HK Now:', hkNow.format('YYYY-MM-DD HH:mm:ss'));
    console.log('HK Today Start (LOCAL):', hkTodayStart);
    console.log('HK Today End (LOCAL):', hkTodayEnd);
    console.log('HK Today Start (UTC):', hkTodayStartUTC);
    console.log('HK Today End (UTC):', hkTodayEndUTC);

    // First, let's check ALL recent attempts for this user (for debugging)
    const allAttempts = await query(
      `SELECT id, started_at, completed_at, DATE(started_at) as started_date 
       FROM quiz_attempts 
       WHERE user_id = ? 
       ORDER BY started_at DESC 
       LIMIT 5`,
      [userId]
    );
    console.log('All recent attempts:', JSON.stringify(allAttempts));

    // Check if player already has a completed attempt today (HK time = UTC+8)
    // started_at is now stored as UTC from Node.js, so we compare with UTC time range
    const attempt = await queryOne(
      `SELECT id, started_at, completed_at FROM quiz_attempts 
       WHERE user_id = ? 
       AND started_at >= ?
       AND started_at <= ?
       AND completed_at IS NOT NULL
       LIMIT 1`,
      [userId, hkTodayStartUTC, hkTodayEndUTC]
    );

    console.log('Found attempt (completed today):', attempt);

    if (attempt) {
      // Already played today, calculate time until next attempt (midnight Hong Kong time)
      const nextMidnight = hkNow.endOf('day').add(1, 'second');
      const nextAttemptIn = nextMidnight.diff(dayjs().utcOffset(8), 'second');
      
      console.log('Already played today, next attempt in:', nextAttemptIn, 'seconds');
      console.log('Attempt details:', attempt);
      
      return ok({
        canPlay: false,
        nextAttemptIn: Math.max(0, nextAttemptIn),
        message: 'You have already completed a quiz today. Come back tomorrow!',
      }, event.headers);
    }

    // Also check for abandoned attempts > 1 hour old (release daily limit slot)
    // Use UTC time for database query (started_at is stored as UTC)
    const oneHourAgoUTC = dayjs().utc().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
    await query(
      `UPDATE quiz_attempts 
       SET completed_at = ? 
       WHERE user_id = ? 
       AND started_at < ?
       AND completed_at IS NULL`,
      ['abandoned', userId, oneHourAgoUTC]
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
