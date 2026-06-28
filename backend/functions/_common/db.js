// Database connection pooling for SCF functions
// Uses mysql2 with global scope for connection reuse
import mysql from 'mysql2/promise';

// Global connection pool (reused across SCF invocations)
let pool = null;

/**
 * Get database connection pool
 * @returns {Promise<mysql.Pool>}
 */
export async function getPool() {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 1, // SCF serverless: 1 connection per instance
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  pool = mysql.createPool(config);
  
  // Test connection
  try {
    await pool.getConnection();
    console.log('[DB] Connection pool created successfully');
  } catch (err) {
    console.error('[DB] Failed to create connection pool:', err);
    pool = null;
    throw err;
  }

  return pool;
}

/**
 * Execute SQL query with parameterized statements
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
export async function query(sql, params = []) {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Close database connections (called on SCF instance cleanup)
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Connection pool closed');
  }
}
