/**
 * WarXOne - Migration Script: Create quiz_attempts table and add audit fields
 * Run: node scripts/migrate-quiz-attempts.js
 */

const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'warxone_db',
    });

    console.log('Connected to database');

    // Check if quiz_attempts table exists
    const [tables] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [process.env.DB_NAME || 'warxone_db', 'quiz_attempts']
    );

    if (tables.length === 0) {
      console.log('Creating quiz_attempts table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          difficulty VARCHAR(20) NOT NULL,
          questions JSON NOT NULL,
          answers JSON NOT NULL,
          score INT DEFAULT 0,
          tokens_earned DECIMAL(10,2) DEFAULT 0,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          reconnect_state JSON NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_started_at (started_at),
          INDEX idx_difficulty (difficulty)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ quiz_attempts table created');
    } else {
      console.log('✓ quiz_attempts table already exists');
    }

    // Check if created_by column exists in quiz_questions
    const [columns] = await connection.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [process.env.DB_NAME || 'warxone_db', 'quiz_questions', 'created_by']
    );

    if (columns.length === 0) {
      console.log('Adding audit fields to quiz_questions...');
      await connection.query('ALTER TABLE quiz_questions ADD COLUMN created_by VARCHAR(36) NULL AFTER is_active');
      await connection.query('ALTER TABLE quiz_questions ADD COLUMN updated_by VARCHAR(36) NULL AFTER created_by');
      console.log('✓ Audit fields added to quiz_questions');
    } else {
      console.log('✓ quiz_questions audit fields already exist');
    }

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

migrate();
