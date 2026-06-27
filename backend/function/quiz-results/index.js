/**
 * WarXOne - Quiz Results (SCF)
 * GET /api/quiz-results?attempt_id=xxx
 *
 * Returns quiz results with per-question breakdown.
 */

const { queryOne } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { ok, badRequest, unauthorized, serverError, handlePreflight } = require('./shared/response');

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

    // Get attempt ID from query string or POST body
    let attemptId = null;
    
    // Try GET query string first
    if (event.queryStringParameters && event.queryStringParameters.attempt_id) {
      attemptId = event.queryStringParameters.attempt_id;
    }
    
    // Try POST body if not found in query string
    if (!attemptId && event.body) {
      try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        attemptId = body.attempt_id;
      } catch (e) {
        // Ignore JSON parse error
      }
    }
    
    if (!attemptId) {
      return badRequest('Missing attempt_id parameter', event.headers);
    }

    // Get quiz attempt
    const attempt = await queryOne(
      'SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?',
      [attemptId, userId]
    );

    if (!attempt) {
      return badRequest('Quiz attempt not found', event.headers);
    }

    if (!attempt.completed_at) {
      return badRequest('Quiz not yet completed', event.headers);
    }

    // Parse questions and answers
    // Parse questions and answers (handle both JSON string and object)
    const questions = typeof attempt.questions === 'string' ? JSON.parse(attempt.questions) : attempt.questions;
    const answers = typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : (attempt.answers || []);

    // Get question details for per-question breakdown
    const questionIds = questions.map(q => q.id);
    const questionDetails = await Promise.all(
      questionIds.map(id => 
        queryOne('SELECT id, question, option_a, option_b, option_c, option_d, correct_answer, explanation FROM quiz_questions WHERE id = ?', [id])
      )
    );

    // Build per-question breakdown
    const questionBreakdown = answers.map((answer, index) => {
      const qDetail = questionDetails[index];
      return {
        question: qDetail?.question || '',
        selected: answer.selected,
        correct: qDetail?.correct_answer || '',
        is_correct: answer.is_correct,
        is_timeout: answer.is_timeout,
        explanation: qDetail?.explanation || '',
        tokens: answer.tokens,
      };
    });

    return ok({
      attemptId: attempt.id,
      difficulty: attempt.difficulty,
      score: attempt.score,
      total: questions.length,
      correctCount: answers.filter(a => a.is_correct).length,
      incorrectCount: answers.filter(a => !a.is_correct && !a.is_timeout).length,
      timeoutCount: answers.filter(a => a.is_timeout).length,
      tokensEarned: attempt.tokens_earned,
      questions: questionBreakdown,
      message: 'Results retrieved successfully',
    }, event.headers);

  } catch (err) {
    console.error('Quiz results error:', err);
    return serverError('Failed to get results: ' + err.message, event.headers);
  }
};
