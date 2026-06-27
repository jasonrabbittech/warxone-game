/**
 * WarXOne - Admin Quiz Create (SCF)
 * POST /api/admin/quiz-create
 * Body: {question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category}
 *
 * Creates a new quiz question.
 */

const crypto = require('crypto');
const { query } = require('./shared/db');
const { verifyAdminToken } = require('./shared/adminAuth');
const { ok, unauthorized, badRequest, serverError, handlePreflight } = require('./shared/response');

exports.main_handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  try {
    // Verify admin JWT token
    const admin = verifyAdminToken(event.headers);
    if (!admin) {
      return unauthorized('Admin authentication required', event.headers);
    }

    // Parse request body
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return badRequest('Invalid JSON body', event.headers);
    }

    // Validate required fields
    const { question, option_a, option_b, option_c, option_d, correct_answer } = body;
    
    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return badRequest('Missing required fields', event.headers);
    }

    // Validate correct_answer
    if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
      return badRequest('correct_answer must be A, B, C, or D', event.headers);
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard', 'super_hard', 'invincible_hard'];
    const difficulty = body.difficulty || 'easy';
    if (!validDifficulties.includes(difficulty)) {
      return badRequest(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`, event.headers);
    }

    // Generate UUID
    const id = crypto.randomUUID();

    // Insert into database
    await query(
      `INSERT INTO quiz_questions 
       (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer.toUpperCase(),
        body.explanation || null,
        difficulty,
        body.category || 'general',
        body.is_active !== undefined ? body.is_active : true,
        admin.userId,  // created_by
        admin.userId,  // updated_by
      ]
    );

    // Fetch created question
    const [rows] = await query(
      `SELECT * FROM quiz_questions WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return serverError('Failed to fetch created question', event.headers);
    }

    const created = rows[0];

    return ok({
      message: 'Quiz question created successfully',
      question: {
        id: created.id,
        question: created.question,
        options: {
          A: created.option_a,
          B: created.option_b,
          C: created.option_c,
          D: created.option_d,
        },
        correctAnswer: created.correct_answer,
        explanation: created.explanation,
        difficulty: created.difficulty,
        category: created.category,
        isActive: created.is_active,
        createdBy: created.created_by,
        updatedBy: created.updated_by,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      },
    }, event.headers);

  } catch (err) {
    console.error('Admin quiz create error:', err);
    return serverError('Failed to create quiz question', event.headers);
  }
};
