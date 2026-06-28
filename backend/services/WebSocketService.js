/**
 * WebSocket Service for Multiplayer System
 * Provides WebSocket-related operations for real-time communication
 * Uses Tencent Cloud API Gateway (WebSocket) for message delivery
 */

import { getConnection, getPlayerOnline } from './RedisService.js';
import { query } from '../functions/_common/db.js';
import jwt from 'jsonwebtoken';

/**
 * Validate JWT token
 * @param {string} token - JWT token
 * @returns {Promise<object|null>} - Decoded token payload or null
 */
export async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    console.error('[WebSocketService] Token validation failed:', error.message);
    return null;
  }
}

/**
 * Get connection ID for a player
 * @param {string} playerId - Player ID
 * @returns {Promise<string|null>} - Connection ID or null
 */
async function getConnectionIdForPlayer(playerId) {
  // This function requires scanning all connection keys in Redis
  // to find the connection with matching playerId
  // For now, return null as stub
  console.log(`[WebSocketService] Would get connection ID for player ${playerId}`);
  return null;
}

/**
 * Send message to specific player via WebSocket
 * @param {string} playerId - Player ID
 * @param {object} message - Message object
 * @returns {Promise<boolean>} - True if message sent successfully
 */
export async function sendToPlayer(playerId, message) {
  try {
    // Check if player is online
    const isOnline = await getPlayerOnline(playerId);
    if (!isOnline) {
      console.log(`[WebSocketService] Player ${playerId} is offline, message not sent`);
      return false;
    }

    // Get connection ID for player
    const connectionId = await getConnectionIdForPlayer(playerId);
    if (!connectionId) {
      console.log(`[WebSocketService] No active connection found for player ${playerId}`);
      return false;
    }

    // Send message via API Gateway
    // TODO: Implement actual API Gateway call
    // For Tencent Cloud API Gateway, use the management API to post to connection
    console.log(`[WebSocketService] Would send message to connection ${connectionId}:`, message);
    
    return true;
  } catch (error) {
    console.error('[WebSocketService] Error sending message to player:', error);
    return false;
  }
}

/**
 * Send message to channel (all players in channel)
 * @param {string} channel - Channel name ("global", "alliance-{id}", "private-{player1}-{player2}")
 * @param {object} message - Message object
 * @returns {Promise<number>} - Number of messages sent
 */
export async function sendToChannel(channel, message) {
  try {
    // Get all players in channel
    // For global channel, get all online players
    // For alliance channel, get all online alliance members
    // For private channel, get the two players
    // TODO: Implement channel membership tracking
    console.log(`[WebSocketService] Would send message to channel ${channel}:`, message);
    return 0;
  } catch (error) {
    console.error('[WebSocketService] Error sending message to channel:', error);
    return 0;
  }
}

/**
 * Broadcast message to all connected players
 * @param {object} message - Message object
 * @returns {Promise<number>} - Number of messages sent
 */
export async function broadcast(message) {
  try {
    // Get all active connections from Redis
    // TODO: Implement connection scanning
    console.log(`[WebSocketService] Would broadcast message:`, message);
    return 0;
  } catch (error) {
    console.error('[WebSocketService] Error broadcasting message:', error);
    return 0;
  }
}

/**
 * Handle WebSocket connection
 * @param {object} event - API Gateway event
 * @returns {Promise<object>} - Response
 */
export async function handleConnect(event) {
  try {
    // Get token from query parameters
    const token = event.queryStringParameters?.token;
    if (!token) {
      console.error('[WebSocketService] No token provided');
      return { statusCode: 401, body: 'Unauthorized: No token provided' };
    }

    // Validate token
    const decoded = await validateToken(token);
    if (!decoded) {
      console.error('[WebSocketService] Invalid token');
      return { statusCode: 401, body: 'Unauthorized: Invalid token' };
    }

    const playerId = decoded.userId || decoded.uid;
    const connectionId = event.requestContext?.connectionId;
    
    if (!connectionId) {
      console.error('[WebSocketService] No connection ID in event');
      return { statusCode: 500, body: 'Internal Server Error: No connection ID' };
    }

    // Store connection state in Redis
    const { setConnection, setPlayerOnline } = await import('./RedisService.js');
    await setConnection(connectionId, {
      playerId,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      currentRoom: null,
      status: 'connected'
    });

    // Set player online status
    await setPlayerOnline(playerId, true);

    console.log(`[WebSocketService] Player ${playerId} connected with connection ${connectionId}`);
    return { statusCode: 200, body: 'Connected successfully' };
  } catch (error) {
    console.error('[WebSocketService] Error handling connect:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

/**
 * Handle WebSocket disconnection
 * @param {object} event - API Gateway event
 * @returns {Promise<object>} - Response
 */
export async function handleDisconnect(event) {
  try {
    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
      console.error('[WebSocketService] No connection ID in event');
      return { statusCode: 500, body: 'Internal Server Error: No connection ID' };
    }

    // Get connection state from Redis
    const { getConnection, removeConnection, setPlayerOnline } = await import('./RedisService.js');
    const connectionData = await getConnection(connectionId);
    
    if (connectionData) {
      const playerId = connectionData.playerId;
      
      // Remove connection state
      await removeConnection(connectionId);
      
      // Check if player has other active connections
      // TODO: Implement multi-connection check
      // For now, set player offline
      await setPlayerOnline(playerId, false);
      
      console.log(`[WebSocketService] Player ${playerId} disconnected from connection ${connectionId}`);
    } else {
      console.log(`[WebSocketService] No connection data found for ${connectionId}`);
    }

    return { statusCode: 200, body: 'Disconnected successfully' };
  } catch (error) {
    console.error('[WebSocketService] Error handling disconnect:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

/**
 * Handle incoming WebSocket message
 * @param {object} event - API Gateway event
 * @returns {Promise<object>} - Response
 */
export async function handleMessage(event) {
  try {
    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
      console.error('[WebSocketService] No connection ID in event');
      return { statusCode: 500, body: 'Internal Server Error: No connection ID' };
    }

    // Get connection state from Redis
    const { getConnection } = await import('./RedisService.js');
    const connectionData = await getConnection(connectionId);
    
    if (!connectionData) {
      console.error(`[WebSocketService] No connection data found for ${connectionId}`);
      return { statusCode: 401, body: 'Unauthorized: Connection not found' };
    }

    const playerId = connectionData.playerId;
    
    // Parse message
    let message;
    try {
      message = JSON.parse(event.body);
    } catch (error) {
      console.error('[WebSocketService] Invalid message format:', error);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          type: 'error', 
          payload: { code: 'INVALID_MESSAGE', message: 'Message format is invalid' } 
        }) 
      };
    }

    // Validate message format
    if (!message.type || !message.payload) {
      console.error('[WebSocketService] Invalid message structure');
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          type: 'error', 
          payload: { code: 'INVALID_MESSAGE', message: 'Message must have type and payload' } 
        }) 
      };
    }

    // Route message to appropriate handler
    const { routeMessage } = await import('./MessageRouter.js');
    const response = await routeMessage(playerId, connectionId, message);
    
    return { statusCode: 200, body: 'Message processed successfully' };
  } catch (error) {
    console.error('[WebSocketService] Error handling message:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

/**
 * Send error message to connection
 * @param {string} connectionId - WebSocket connection ID
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {string} details - Error details (optional)
 * @returns {Promise<void>}
 */
export async function sendError(connectionId, code, message, details = null) {
  const errorMsg = {
    type: 'error',
    payload: {
      code,
      message
    },
    timestamp: Date.now()
  };
  
  if (details) {
    errorMsg.payload.details = details;
  }
  
  // TODO: Send via API Gateway
  console.log(`[WebSocketService] Would send error to ${connectionId}:`, errorMsg);
}
