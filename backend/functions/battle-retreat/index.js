/**
 * Battle Retreat SCF Function
 * Handles requests to retreat from a battle
 * Applies retreat penalty (49.9% chance defender wins)
 */

exports.main = async (event, context) => {
  try {
    console.log('[BattleRetreat] Event received:', JSON.stringify(event));

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

    const { battleId } = body;

    // Validate input
    if (!battleId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Missing battleId' })
      };
    }

    // Import BattleService dynamically (ES module)
    const { retreatBattle } = await import('../../services/BattleService.js');

    // Get user ID from token (stub - implement proper JWT validation)
    const userId = 'user_' + Date.now(); // TODO: Decode from JWT

    // Retreat from battle
    const result = await retreatBattle(battleId, userId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          battleId: result.battleState.battleId,
          retreatSuccess: result.retreatSuccess,
          status: result.battleState.status,
          attackerCasualties: result.battleState.attackerCasualties,
          defenderCasualties: result.battleState.defenderCasualties
        }
      })
    };
  } catch (error) {
    console.error('[BattleRetreat] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
