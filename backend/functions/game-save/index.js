/**
 * Game Save SCF Function
 * Saves game state to TDSQL-C Serverless MySQL
 */

const { getDBConnection } = require('../_common/db.js');
const { validateJWT } = require('../_common/auth.js');

exports.main_handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Validate JWT
  const authResult = validateJWT(event);
  if (!authResult.valid) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: 'Unauthorized' }),
    };
  }

  const userId = authResult.userId;

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid request body' }),
    };
  }

  const { gameState, saveName = 'Default' } = body;

  if (!gameState) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Missing gameState' }),
    };
  }

  let connection;
  try {
    connection = await getDBConnection();

    // Check if save exists
    const [existing] = await connection.execute(
      'SELECT id FROM game_saves WHERE user_id =? AND save_name =?',
      [userId, saveName]
    );

    if (existing.length > 0) {
      // Update existing save
      await connection.execute(
        'UPDATE game_saves SET save_data =?, updated_at = NOW() WHERE user_id =? AND save_name =?',
        [JSON.stringify(gameState), userId, saveName]
      );
    } else {
      // Create new save
      await connection.execute(
        'INSERT INTO game_saves (user_id, save_name, save_data) VALUES (?,?,?)',
        [userId, saveName, JSON.stringify(gameState)]
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Game saved successfully' }),
    };
  } catch (error) {
    console.error('Save failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Save failed: ' + error.message }),
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
