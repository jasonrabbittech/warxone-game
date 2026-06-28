/**
 * WebSocket Connect SCF Function
 * Handles WebSocket connection requests from API Gateway
 * Validates JWT token and stores connection state in Redis
 */

exports.main = async (event, context) => {
  try {
    console.log('[WebSocketConnect] Event received:', JSON.stringify(event));

    // Import WebSocketService dynamically (ES module)
    const { handleConnect } = await import('../../services/WebSocketService.js');

    // Handle connection
    const response = await handleConnect(event);

    console.log('[WebSocketConnect] Response:', response);
    return response;
  } catch (error) {
    console.error('[WebSocketConnect] Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
