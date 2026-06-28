/**
 * WebSocket Disconnect SCF Function
 * Handles WebSocket disconnection requests from API Gateway
 * Removes connection state from Redis and updates player online status
 */

exports.main = async (event, context) => {
  try {
    console.log('[WebSocketDisconnect] Event received:', JSON.stringify(event));

    // Import WebSocketService dynamically (ES module)
    const { handleDisconnect } = await import('../../services/WebSocketService.js');

    // Handle disconnection
    const response = await handleDisconnect(event);

    console.log('[WebSocketDisconnect] Response:', response);
    return response;
  } catch (error) {
    console.error('[WebSocketDisconnect] Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
