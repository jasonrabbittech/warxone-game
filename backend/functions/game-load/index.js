/**
 * Game Load SCF Function
 * Loads game state from TDSQL-C Serverless MySQL
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

  const { saveName = 'Default' } = body;

  let connection;
  try {
    connection = await getDBConnection();

    // Load save
    const [rows] = await connection.execute(
      'SELECT save_data, created_at, updated_at FROM game_saves WHERE user_id =? AND save_name =? ORDER BY updated_at DESC LIMIT 1',
      [userId, saveName]
    );

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'No save found' }),
      };
    }

    const saveData = rows[0].save_data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          gameState: typeof saveData === 'string'? JSON.parse(saveData) : saveData,
          savedAt: rows[0].updated_at,
        },
      }),
    };
  } catch (error) {
    console.error('Load failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Load failed: ' + error.message }),
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
