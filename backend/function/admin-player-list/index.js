/**
 * WarXOne Admin - Player List (SCF)
 * GET /api/admin/players?page=1&limit=20&search=email
 *
 * Returns paginated list of players with search/filter support.
 * Requires admin authentication.
 */

const { query, queryOne } = require('./shared/db');
const { requireAdmin, requireSuperAdmin } = require('./shared/adminAuth');
const { ok, badRequest, serverError, handlePreflight } = require('./shared/response');

async function ensureSchema() {
  // Ensure users table exists
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(512) NOT NULL DEFAULT '',
      display_name VARCHAR(50) DEFAULT '',
      auth_provider VARCHAR(20) DEFAULT 'email',
      provider_id VARCHAR(255) DEFAULT '',
      refresh_token_version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_provider (auth_provider, provider_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Ensure game_saves table exists
  await query(`
    CREATE TABLE IF NOT EXISTS game_saves (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      game_state JSON NOT NULL,
      country_name VARCHAR(50) DEFAULT '',
      level INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_user_id (user_id),
      INDEX idx_level (level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

exports.main_handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handlePreflight(event.headers);
  }

  // Check admin authentication
  const authError = requireAdmin(event);
  if (authError) return authError;

  try {
    // Ensure schema exists
    await ensureSchema();

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const search = queryParams.search || '';
    const sortBy = queryParams.sortBy || 'created_at';
    const sortOrder = queryParams.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Validate parameters
    if (page < 1) return badRequest('Page must be >= 1', event.headers);
    if (limit < 1 || limit > 100) return badRequest('Limit must be between 1 and 100', event.headers);

    const offset = (page - 1) * limit;

    // Build query
    let whereClause = '';
    let queryParamsArr = [];

    if (search) {
      whereClause = 'WHERE u.email LIKE ?';
      queryParamsArr.push(`%${search}%`);
    }

    // Get total count
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParamsArr
    );
    const total = countResult.total;

    // Get players with game progress
    const players = await query(
      `SELECT u.id, u.email, u.display_name, u.auth_provider, u.created_at, u.updated_at,
              gs.level, gs.country_name, gs.updated_at as last_save
       FROM users u
       LEFT JOIN game_saves gs ON u.id = gs.user_id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...queryParamsArr, limit, offset]
    );

    // Format response
    const formattedPlayers = players.map(p => ({
      id: p.id,
      email: p.email,
      displayName: p.display_name,
      authProvider: p.auth_provider,
      level: p.level || 0,
      countryName: p.country_name || '',
      createdAt: p.created_at,
      lastLogin: p.updated_at,
      lastSave: p.last_save,
    }));

    return ok({
      players: formattedPlayers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, event.headers);

  } catch (err) {
    console.error('Admin player list error:', err);
    return serverError('Failed to fetch player list', event.headers);
  }
};
