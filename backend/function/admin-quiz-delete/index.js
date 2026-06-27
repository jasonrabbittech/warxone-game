/**
 * WarXOne - Admin Quiz Delete (SCF)
 * DELETE /api/admin/quiz-delete
 * Body: {id}
 *
 * Deletes a quiz question (soft delete by setting is_active=false).
 * If question has been attempted, it cannot be hard-deleted.
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
      'SELECT id, is_active FROM quiz_questions WHERE id = ?',
      [id]
    );

    if (!existing || existing.length === 0) {
      return notFound('Quiz question not found', event.headers);
    }

    // Soft delete: set is_active = false
    await query(
      'UPDATE quiz_questions SET is_active = false, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [admin.userId, id]
    );

    return ok({
      message: 'Quiz question deactivated successfully (soft delete)',
      id: id,
    }, event.headers);

  } catch (err) {
    console.error('Admin quiz delete error:', err);
    return serverError('Failed to delete quiz question', event.headers);
  }
};
