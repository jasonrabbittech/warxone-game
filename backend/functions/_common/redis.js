// Redis client initialization for SCF functions
// Uses ioredis with global scope for connection reuse
import Redis from 'ioredis';

// Global Redis client (reused across SCF invocations)
let redisClient = null;

/**
 * Get Redis client
 * @returns {Redis} - Redis client instance
 */
export function getRedisClient() {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  // Create new Redis client
  const config = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3
  };

  redisClient = new Redis(config);

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
  });

  return redisClient;
}

/**
 * Close Redis connection (called on SCF instance cleanup)
 */
export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Client closed');
  }
}

/**
 * Set key with expiration
 * @param {string} key - Redis key
 * @param {string} value - Value to set
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<string>}
 */
export async function setWithExpiry(key, value, ttl) {
  const client = getRedisClient();
  return await client.setex(key, ttl, value);
}

/**
 * Get value by key
 * @param {string} key - Redis key
 * @returns {Promise<string|null>}
 */
export async function get(key) {
  const client = getRedisClient();
  return await client.get(key);
}

/**
 * Delete key
 * @param {string} key - Redis key
 * @returns {Promise<number>}
 */
export async function del(key) {
  const client = getRedisClient();
  return await client.del(key);
}
