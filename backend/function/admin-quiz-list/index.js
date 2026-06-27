/**
 * WarXOne - Admin Quiz List (SCF)
 * GET /api/admin/quiz-list?page=1&limit=20&difficulty=easy&category=general&is_active=true&sortBy=created_at&sortOrder=DESC
 *
 * Lists quiz questions with pagination, filtering, sorting.
 */

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

    // Parse query parameters
    const params = event.queryString || {};
    const page = parseInt(params.page) || 1;
    const limit = Math.min(parseInt(params.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const difficulty = params.difficulty || null;
    const category = params.category || null;
    const isActive = params.is_active !== undefined ? params.is_active === 'true' : null;
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'DESC';

    // Validate sortBy to prevent SQL injection
    const allowedSortBy = ['created_at', 'updated_at', 'difficulty', 'category', 'id'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
    
    // Validate sortOrder
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (difficulty) {
      whereClause += ' AND difficulty = ?';
      queryParams.push(difficulty);
    }

    if (category) {
      whereClause += ' AND category = ?';
      queryParams.push(category);
    }

    if (isActive !== null) {
      whereClause += ' AND is_active = ?';
      queryParams.push(isActive);
    }

    // Get total count
    const [countRows] = await query(
      `SELECT COUNT(*) as total FROM quiz_questions ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Get questions with pagination
    const [rows] = await query(
      `SELECT id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, 
              difficulty, category, is_active, created_by, updated_by, created_at, updated_at
       FROM quiz_questions 
       ${whereClause}
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Format questions
    const questions = rows.map(row => ({
      id: row.id,
      question: row.question,
      options: {
        A: row.option_a,
        B: row.option_b,
        C: row.option_c,
        D: row.option_d,
      },
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      category: row.category,
      isActive: row.is_active,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return ok({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, event.headers);

  } catch (err) {
    console.error('Admin quiz list error:', err);
    return serverError('Failed to fetch quiz questions', event.headers);
  }
};
