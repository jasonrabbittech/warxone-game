/**
 * WarXOne - Admin Quiz Update (SCF)
 * PUT /api/admin/quiz-update
 * Body: {id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active}
 *
 * Updates an existing quiz question.
 */

const { query } = require('./shared/db');
const { verifyAdminToken } = require('./shared/adminAuth');
const { ok, unauthorized, badRequest, notFound, serverError, handlePreflight } = require('./shared/response');

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

    // Validate required field: id
    const { id } = body;
    if (!id) {
      return badRequest('Missing required field: id', event.headers);
    }

    // Check if question exists
    const [existing] = await query(
      'SELECT id FROM quiz_questions WHERE id = ?',
      [id]
    );

    if (!existing || existing.length === 0) {
      return notFound('Quiz question not found', event.headers);
    }

    // Build dynamic UPDATE query
    const updates = [];
    const params = [];

    if (body.question !== undefined) {
      updates.push('question = ?');
      params.push(body.question);
    }

    if (body.option_a !== undefined) {
      updates.push('option_a = ?');
      params.push(body.option_a);
    }

    if (body.option_b !== undefined) {
      updates.push('option_b = ?');
      params.push(body.option_b);
    }

    if (body.option_c !== undefined) {
      updates.push('option_c = ?');
      params.push(body.option_c);
    }

    if (body.option_d !== undefined) {
      updates.push('option_d = ?');
      params.push(body.option_d);
    }

    if (body.correct_answer !== undefined) {
      if (!['A', 'B', 'C', 'D'].includes(body.correct_answer.toUpperCase())) {
        return badRequest('correct_answer must be A, B, C, or D', event.headers);
      }
      updates.push('correct_answer = ?');
      params.push(body.correct_answer.toUpperCase());
    }

    if (body.explanation !== undefined) {
      updates.push('explanation = ?');
      params.push(body.explanation);
    }

    if (body.difficulty !== undefined) {
      const validDifficulties = ['easy', 'medium', 'hard', 'super_hard', 'invincible_hard'];
      if (!validDifficulties.includes(body.difficulty)) {
        return badRequest(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`, event.headers);
      }
      updates.push('difficulty = ?');
      params.push(body.difficulty);
    }

    if (body.category !== undefined) {
      updates.push('category = ?');
      params.push(body.category);
    }

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active);
    }

    // Always update updated_by and updated_at
    updates.push('updated_by = ?');
    params.push(admin.userId);

    updates.push('updated_at = NOW()');

    // Add WHERE clause parameter
    params.push(id);

    // Execute update
    if (updates.length > 0) {
      await query(
        `UPDATE quiz_questions SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Fetch updated question
    const [rows] = await query(
      `SELECT * FROM quiz_questions WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return serverError('Failed to fetch updated question', event.headers);
    }

    const updated = rows[0];

    return ok({
      message: 'Quiz question updated successfully',
      question: {
        id: updated.id,
        question: updated.question,
        options: {
          A: updated.option_a,
          B: updated.option_b,
          C: updated.option_c,
          D: updated.option_d,
        },
        correctAnswer: updated.correct_answer,
        explanation: updated.explanation,
        difficulty: updated.difficulty,
        category: updated.category,
        isActive: updated.is_active,
        createdBy: updated.created_by,
        updatedBy: updated.updated_by,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    }, event.headers);

  } catch (err) {
    console.error('Admin quiz update error:', err);
    return serverError('Failed to update quiz question', event.headers);
  }
};
