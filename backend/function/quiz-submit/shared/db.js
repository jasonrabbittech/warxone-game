/**
 * WarXOne - Database Connection Pool
 * Uses mysql2/promise for TDSQL-C Serverless MySQL
 * Environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warxone_db',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Serverless: shorter timeouts since cold starts may delay
    connectTimeout: 10000,
    // Use utf8mb4 for emoji support (flags like 🇫🇷)
    charset: 'utf8mb4',
  });

  return pool;
}

/**
 * Execute a SQL query with auto-connection
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  const p = getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

/**
 * Execute a SQL statement (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL statement with ? placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<object>} Result with insertId, affectedRows, etc.
 */
async function execute(sql, params = []) {
  const p = getPool();
  const [result] = await p.execute(sql, params);
  return result;
}

/**
 * Get a single row from a query
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<object|null>} Single row or null
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { getPool, query, execute, queryOne };
