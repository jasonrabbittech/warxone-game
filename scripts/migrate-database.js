#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs schema.sql against TDSQL-C Serverless MySQL
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function migrate() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      multipleStatements: true, // Allow multiple SQL statements
    });

    console.log('Connected to database');

    // Read schema.sql
    const schemaPath = path.join(__dirname, '../backend/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('Running schema.sql...');
    await connection.query(schema);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migrate();
