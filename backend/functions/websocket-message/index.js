/**
 * WebSocket Message SCF Function
 * Handles incoming WebSocket messages from API Gateway
 * Routes messages to appropriate handlers based on message type
 */

exports.main = async (event, context) => {
  try {
    console.log('[WebSocketMessage] Event received:', JSON.stringify(event));

    // Import WebSocketService dynamically (ES module)
    const { handleMessage } = await import('../../services/WebSocketService.js');

    // Handle message
    const response = await handleMessage(event);

    console.log('[WebSocketMessage] Response:', response);
    return response;
  } catch (error) {
    console.error('[WebSocketMessage] Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
