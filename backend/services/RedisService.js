/**
 * Redis Service for Multiplayer System
 * Provides high-level Redis operations for multiplayer features
 * Uses the existing redis.js from _common for low-level operations
 */

import { getRedisClient, setWithExpiry, get, del } from '../functions/_common/redis.js';

/**
 * Connection state key prefix
 */
const CONNECTION_KEY_PREFIX = 'connection:';

/**
 * Player online status key prefix
 */
const PLAYER_ONLINE_KEY_PREFIX = 'player:';

/**
 * Chat message key prefix
 */
const CHAT_KEY_PREFIX = 'chat:';

/**
 * Game room key prefix
 */
const ROOM_KEY_PREFIX = 'room:';

/**
 * Battle state key prefix
 */
const BATTLE_KEY_PREFIX = 'battle:';

/**
 * Leaderboard key prefix
 */
const LEADERBOARD_KEY_PREFIX = 'leaderboard:';

/**
 * Rate limit key prefix
 */
const RATELIMIT_KEY_PREFIX = 'ratelimit:';

/**
 * Set connection state
 * @param {string} connectionId - WebSocket connection ID
 * @param {object} data - Connection data
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<string>}
 */
export async function setConnection(connectionId, data, ttl = 3600) {
  const client = getRedisClient();
  const key = `${CONNECTION_KEY_PREFIX}${connectionId}`;
  return await client.setex(key, ttl, JSON.stringify(data));
}

/**
 * Get connection state
 * @param {string} connectionId - WebSocket connection ID
 * @returns {Promise<object|null>} - Connection data or null
 */
export async function getConnection(connectionId) {
  const client = getRedisClient();
  const key = `${CONNECTION_KEY_PREFIX}${connectionId}`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Remove connection state
 * @param {string} connectionId - WebSocket connection ID
 * @returns {Promise<number>}
 */
export async function removeConnection(connectionId) {
  const client = getRedisClient();
  const key = `${CONNECTION_KEY_PREFIX}${connectionId}`;
  return await client.del(key);
}

/**
 * Set player online status
 * @param {string} playerId - Player ID
 * @param {boolean} status - Online status (true/false)
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<string>}
 */
export async function setPlayerOnline(playerId, status, ttl = 3600) {
  const client = getRedisClient();
  const key = `${PLAYER_ONLINE_KEY_PREFIX}${playerId}:online`;
  return await client.setex(key, ttl, status ? 'true' : 'false');
}

/**
 * Check if player is online
 * @param {string} playerId - Player ID
 * @returns {Promise<boolean>}
 */
export async function isPlayerOnline(playerId) {
  const client = getRedisClient();
  const key = `${PLAYER_ONLINE_KEY_PREFIX}${playerId}:online`;
  const status = await client.get(key);
  return status === 'true';
}

/**
 * Add chat message to channel history
 * @param {string} channel - Chat channel ("global", "alliance-{id}", "private-{player1}-{player2}")
 * @param {object} message - Message object
 * @param {number} maxLength - Max messages to keep (default: 100)
 * @returns {Promise<number>} - Number of messages in channel
 */
export async function addChatMessage(channel, message, maxLength = 100) {
  const client = getRedisClient();
  const key = `${CHAT_KEY_PREFIX}${channel}`;
  
  // Add message to list
  await client.lpush(key, JSON.stringify(message));
  
  // Trim list to max length
  await client.ltrim(key, 0, maxLength - 1);
  
  // Set TTL (24 hours)
  await client.expire(key, 86400);
  
  // Return list length
  return await client.llen(key);
}

/**
 * Get chat message history
 * @param {string} channel - Chat channel
 * @param {number} limit - Max messages to retrieve (default: 100)
 * @returns {Promise<Array>} - Array of message objects
 */
export async function getChatHistory(channel, limit = 100) {
  const client = getRedisClient();
  const key = `${CHAT_KEY_PREFIX}${channel}`;
  
  // Get messages (newest first)
  const messages = await client.lrange(key, 0, limit - 1);
  
  // Parse JSON strings
  return messages.map(msg => JSON.parse(msg)).reverse();
}

/**
 * Set game room state
 * @param {string} roomId - Room ID
 * @param {object} data - Room data
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<string>}
 */
export async function setRoom(roomId, data, ttl = 3600) {
  const client = getRedisClient();
  const key = `${ROOM_KEY_PREFIX}${roomId}`;
  return await client.setex(key, ttl, JSON.stringify(data));
}

/**
 * Get game room state
 * @param {string} roomId - Room ID
 * @returns {Promise<object|null>} - Room data or null
 */
export async function getRoom(roomId) {
  const client = getRedisClient();
  const key = `${ROOM_KEY_PREFIX}${roomId}`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Remove game room
 * @param {string} roomId - Room ID
 * @returns {Promise<number>}
 */
export async function removeRoom(roomId) {
  const client = getRedisClient();
  const key = `${ROOM_KEY_PREFIX}${roomId}`;
  return await client.del(key);
}

/**
 * Set battle state
 * @param {string} battleId - Battle ID
 * @param {object} data - Battle data
 * @param {number} ttl - Time to live in seconds (default: 600)
 * @returns {Promise<string>}
 */
export async function setBattle(battleId, data, ttl = 600) {
  const client = getRedisClient();
  const key = `${BATTLE_KEY_PREFIX}${battleId}`;
  return await client.setex(key, ttl, JSON.stringify(data));
}

/**
 * Get battle state
 * @param {string} battleId - Battle ID
 * @returns {Promise<object|null>} - Battle data or null
 */
export async function getBattle(battleId) {
  const client = getRedisClient();
  const key = `${BATTLE_KEY_PREFIX}${battleId}`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Remove battle state
 * @param {string} battleId - Battle ID
 * @returns {Promise<number>}
 */
export async function removeBattle(battleId) {
  const client = getRedisClient();
  const key = `${BATTLE_KEY_PREFIX}${battleId}`;
  return await client.del(key);
}

/**
 * Update leaderboard (sorted set)
 * @param {string} category - Leaderboard category ("territories", "military", "resources", "pvp_wins")
 * @param {string} timeframe - Time frame ("daily", "weekly", "all_time")
 * @param {string} playerId - Player ID
 * @param {number} score - Score value
 * @returns {Promise<number>}
 */
export async function updateLeaderboard(category, timeframe, playerId, score) {
  const client = getRedisClient();
  const key = `${LEADERBOARD_KEY_PREFIX}${category}:${timeframe}`;
  return await client.zadd(key, score, playerId);
}

/**
 * Get leaderboard
 * @param {string} category - Leaderboard category
 * @param {string} timeframe - Time frame
 * @param {number} start - Start rank (0-based)
 * @param {number} stop - Stop rank (inclusive)
 * @returns {Promise<Array>} - Array of [playerId, score] pairs
 */
export async function getLeaderboard(category, timeframe, start = 0, stop = 99) {
  const client = getRedisClient();
  const key = `${LEADERBOARD_KEY_PREFIX}${category}:${timeframe}`;
  return await client.zrevrange(key, start, stop, 'WITHSCORES');
}

/**
 * Get player rank on leaderboard
 * @param {string} category - Leaderboard category
 * @param {string} timeframe - Time frame
 * @param {string} playerId - Player ID
 * @returns {Promise<number>} - Rank (0-based, -1 if not on leaderboard)
 */
export async function getPlayerRank(category, timeframe, playerId) {
  const client = getRedisClient();
  const key = `${LEADERBOARD_KEY_PREFIX}${category}:${timeframe}`;
  return await client.zrevrank(key, playerId);
}

/**
 * Check rate limit
 * @param {string} playerId - Player ID
 * @param {string} action - Action type ("chat", "battle")
 * @param {number} maxRequests - Max requests per window (default: 10)
 * @param {number} windowSeconds - Window size in seconds (default: 60)
 * @returns {Promise<boolean>} - True if rate limit exceeded
 */
export async function checkRateLimit(playerId, action, maxRequests = 10, windowSeconds = 60) {
  const client = getRedisClient();
  const key = `${RATELIMIT_KEY_PREFIX}${playerId}:${action}`;
  
  // Get current count
  const count = await client.get(key);
  const currentCount = count ? parseInt(count) : 0;
  
  // Check if rate limit exceeded
  if (currentCount >= maxRequests) {
    return true;
  }
  
  // Increment count
  await client.incr(key);
  
  // Set TTL if first request
  if (currentCount === 0) {
    await client.expire(key, windowSeconds);
  }
  
  return false;
}

/**
 * Send message to specific player via WebSocket
 * Note: This function requires API Gateway management API to send messages
 * In production, use AWS SDK or Tencent Cloud SDK to call API Gateway
 * @param {string} playerId - Player ID
 * @param {object} message - Message object
 * @returns {Promise<void>}
 */
export async function sendToPlayer(playerId, message) {
  // TODO: Implement WebSocket message sending via API Gateway
  // This requires the connection ID for the player
  // For now, this is a stub
  console.log(`[RedisService] Would send message to player ${playerId}:`, message);
}

/**
 * Send message to channel (all players in channel)
 * @param {string} channel - Channel name
 * @param {object} message - Message object
 * @returns {Promise<void>}
 */
export async function sendToChannel(channel, message) {
  // TODO: Implement channel message broadcasting
  // This requires getting all connections in the channel
  // For now, this is a stub
  console.log(`[RedisService] Would send message to channel ${channel}:`, message);
}

/**
 * Broadcast message to all connected players
 * @param {object} message - Message object
 * @returns {Promise<void>}
 */
export async function broadcast(message) {
  // TODO: Implement message broadcasting to all connections
  // This requires scanning all connection keys
  // For now, this is a stub
  console.log(`[RedisService] Would broadcast message:`, message);
}
