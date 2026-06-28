/**
 * Battle Start SCF Function
 * Handles requests to start a PvP battle
 * Validates attack is legal and initiates battle
 */

exports.main = async (event, context) => {
  try {
    console.log('[BattleStart] Event received:', JSON.stringify(event));

    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Method not allowed' })
      };
    }

    // Validate JWT token
    const token = event.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Invalid request body' })
      };
    }

    const { territoryId, defenderId } = body;

    // Validate input
    if (!territoryId || !defenderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Missing territoryId or defenderId' })
      };
    }

    // Import BattleService dynamically (ES module)
    const { startBattle } = await import('../../services/BattleService.js');

    // Get user ID from token (stub - implement proper JWT validation)
    const userId = 'user_' + Date.now(); // TODO: Decode from JWT

    // Start battle
    const battleState = await startBattle(userId, defenderId, territoryId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          battleId: battleState.battleId,
          status: battleState.status,
          startTime: battleState.startTime
        }
      })
    };
  } catch (error) {
    console.error('[BattleStart] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
