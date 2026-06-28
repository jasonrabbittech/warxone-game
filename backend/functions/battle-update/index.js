/**
 * Battle Update SCF Function
 * Handles requests to get battle updates
 * Returns current battle state and progress
 */

exports.main = async (event, context) => {
  try {
    console.log('[BattleUpdate] Event received:', JSON.stringify(event));

    // Only accept GET requests
    if (event.httpMethod !== 'GET') {
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

    // Get battle ID from query parameters
    const battleId = event.queryStringParameters?.battleId;
    if (!battleId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Missing battleId' })
      };
    }

    // Import BattleService dynamically (ES module)
    const { getBattleStatus } = await import('../../services/BattleService.js');

    // Get battle status
    const battleState = await getBattleStatus(battleId);
    
    if (!battleState) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Battle not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          battleId: battleState.battleId,
          status: battleState.status,
          progress: battleState.progress,
          attackerCasualties: battleState.attackerCasualties,
          defenderCasualties: battleState.defenderCasualties,
          currentTurn: battleState.currentTurn,
          startTime: battleState.startTime
        }
      })
    };
  } catch (error) {
    console.error('[BattleUpdate] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
