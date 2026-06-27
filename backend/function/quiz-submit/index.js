/**
 * WarXOne - Quiz Submit (SCF)
 * POST /api/quiz-submit
 * Body: { attempt_id, question_index, selected, is_timeout, time_spent }
 *
 * Validates answer, calculates tokens, updates quiz attempt.
 */

const { query, execute, queryOne } = require('./shared/db');
const { getUserIdFromHeaders } = require('./shared/jwt');
const { calculateTokens, getDifficultyConfig } = require('./shared/quiz');
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
    const { attempt_id, question_index, selected, is_timeout, time_spent } = body;

    // Validate input
    if (!attempt_id || question_index === undefined || !time_spent) {
      return badRequest('Missing required fields: attempt_id, question_index, time_spent', event.headers);
    }

    // Get quiz attempt
    const attempt = await queryOne(
      'SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?',
      [attempt_id, userId]
    );

    if (!attempt) {
      return badRequest('Quiz attempt not found', event.headers);
    }

    // Check if quiz is already completed (completed_at is not NULL and not 'abandoned')
    if (attempt.completed_at && attempt.completed_at !== 'abandoned') {
      console.log('Quiz already completed at:', attempt.completed_at);
      return badRequest('Quiz already completed', event.headers);
    }
    
    console.log('Submitting answer for question_index:', question_index);
    console.log('Attempt completed_at:', attempt.completed_at);

    // Parse questions and answers (handle both JSON string and object)
    const questions = typeof attempt.questions === 'string' ? JSON.parse(attempt.questions) : attempt.questions;
    const answers = typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : (attempt.answers || []);

    // Get current question
    if (question_index >= questions.length) {
      return badRequest('Invalid question index', event.headers);
    }

    const questionId = questions[question_index].id;

    // Get correct answer from database
    const question = await queryOne(
      'SELECT correct_answer FROM quiz_questions WHERE id = ?',
      [questionId]
    );

    if (!question) {
      return badRequest('Question not found', event.headers);
    }

    // Calculate result
    const isCorrect = !is_timeout && selected === question.correct_answer;
    const isTimeout = is_timeout === true;
    
    // Get difficulty config for token calculation
    const config = getDifficultyConfig(attempt.difficulty);
    let tokens = 0;
    
    if (isTimeout) {
      // Timeout: no token change
      tokens = 0;
    } else if (isCorrect) {
      // Correct: reward
      tokens = config.reward;
    } else {
      // Incorrect: penalty
      tokens = -config.penalty;
    }

    // Add answer to answers array
    answers.push({
      question_id: questionId,
      selected: selected || null,
      is_correct: isCorrect,
      is_timeout: isTimeout,
      tokens: tokens,
      time_spent: time_spent,
    });

    // Update questions time_spent
    questions[question_index].time_spent = time_spent;

    // Check if this was the last question (index 4 = 5th question)
    const isLastQuestion = question_index >= 4;
    const now = new Date();

    if (isLastQuestion) {
      // Calculate final score and tokens
      const correctCount = answers.filter(a => a.is_correct).length;
      const incorrectCount = answers.filter(a => !a.is_correct && !a.is_timeout).length;
      const totalTokens = answers.reduce((sum, a) => sum + a.tokens, 0);

      // Update attempt as completed
      await execute(
        'UPDATE quiz_attempts SET questions = ?, answers = ?, score = ?, tokens_earned = ?, completed_at = ? WHERE id = ?',
        [JSON.stringify(questions), JSON.stringify(answers), correctCount, totalTokens, now, attempt_id]
      );

      return ok({
        is_correct: isCorrect,
        tokens: tokens,
        is_last_question: true,
        score: correctCount,
        total: questions.length,
        total_tokens: totalTokens,
        message: 'Quiz completed!',
      }, event.headers);
    } else {
      // Update attempt (not completed yet)
      await execute(
        'UPDATE quiz_attempts SET questions = ?, answers = ? WHERE id = ?',
        [JSON.stringify(questions), JSON.stringify(answers), attempt_id]
      );

      return ok({
        is_correct: isCorrect,
        tokens: tokens,
        is_last_question: false,
        message: isCorrect ? 'Correct!' : (isTimeout ? 'Time is up!' : 'Incorrect.'),
      }, event.headers);
    }

  } catch (err) {
    console.error('Quiz submit error:', err);
    return serverError('Failed to submit answer: ' + err.message, event.headers);
  }
};
