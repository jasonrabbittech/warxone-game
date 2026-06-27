/**
 * WarXOne - Quiz Start (SCF)
 * POST /api/quiz-start
 * Body: { difficulty }
 *
 * Checks daily limit, gets 5 random questions, creates quiz attempt.
 */

const { query, execute, queryOne } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { checkDailyLimit, getTimerConfig } = require('./shared/quiz');
const { ok, badRequest, unauthorized, serverError, parseBody, handlePreflight } = require('./shared/response');

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

    const body = parseBody(event);
    const { difficulty } = body;

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard', 'super_hard', 'invincible_hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return badRequest('Invalid difficulty. Must be one of: ' + validDifficulties.join(', '), event.headers);
    }

    // Check daily limit
    const now = new Date();
    const dailyCheck = await checkDailyLimit(userId, now.toISOString());
    
    if (!dailyCheck.canPlay) {
      return ok({
        canPlay: false,
        nextAttemptIn: dailyCheck.nextAttemptIn,
        message: 'You have already completed a quiz today. Come back tomorrow!',
      }, event.headers);
    }

    // Get 5 random questions for the difficulty (without correct answers)
    const questions = await query(
      `SELECT id, question, option_a, option_b, option_c, option_d, explanation 
       FROM quiz_questions 
       WHERE difficulty = ? AND is_active = TRUE 
       ORDER BY RAND() 
       LIMIT 5`,
      [difficulty]
    );

    if (questions.length < 5) {
      return badRequest('Not enough questions in pool. Please contact admin.', event.headers);
    }

    // Get timer config
    const timerConfig = getTimerConfig(difficulty);

    // Create quiz attempt record
    const attemptId = require('crypto').randomUUID();
    const questionsJson = JSON.stringify(questions.map(q => ({ id: q.id, time_spent: 0 })));
    const answersJson = JSON.stringify([]);
    
    // Use explicit UTC timestamp (not MySQL NOW() to avoid timezone issues)
    const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await execute(
      `INSERT INTO quiz_attempts (id, user_id, difficulty, questions, answers, started_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [attemptId, userId, difficulty, questionsJson, answersJson, startedAt]
    );

    // Return questions (without correct answers) and attempt ID
    const questionsForClient = questions.map(q => ({
      id: q.id,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      explanation: q.explanation, // Include explanation (shown after answer)
    }));

    return ok({
      canPlay: true,
      attemptId,
      difficulty,
      timerPerQuestion: timerConfig.timer,
      questions: questionsForClient,
      message: 'Quiz started successfully',
    }, event.headers);

  } catch (err) {
    console.error('Quiz start error:', err);
    return serverError('Failed to start quiz: ' + err.message, event.headers);
  }
};
