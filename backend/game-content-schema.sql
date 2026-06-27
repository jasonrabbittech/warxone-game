-- WarXOne Game Content Database Schema
-- For TDSQL-C Serverless MySQL
-- Run this to create game content tables (countries, quiz questions, etc.)

USE warxone_db;

-- Countries table: manageable from admin dashboard
CREATE TABLE IF NOT EXISTS countries (
  id VARCHAR(50) PRIMARY KEY,  -- e.g., 'afghanistan'
  name VARCHAR(100) NOT NULL,
  pop INT DEFAULT 0,
  level INT DEFAULT 1,
  military INT DEFAULT 1,
  airports INT DEFAULT 1,
  trains INT DEFAULT 1,
  adjacent JSON NOT NULL,  -- array of adjacent country IDs
  world VARCHAR(20) DEFAULT 'earth',  -- 'earth' or 'mars'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_world (world),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz questions table: manageable from admin dashboard
CREATE TABLE IF NOT EXISTS quiz_questions (
  id VARCHAR(36) PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,  -- 'A', 'B', 'C', 'D'
  explanation TEXT,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',  -- 'easy', 'medium', 'hard', 'super_hard', 'invincible_hard'
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36) NULL,  -- Admin user ID who created this question
  updated_by VARCHAR(36) NULL,  -- Admin user ID who last updated this question
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_difficulty (difficulty),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz attempts table: tracks player quiz attempts for daily limit and results
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,  -- 'easy', 'medium', 'hard', 'super_hard', 'invincible_hard'
  questions JSON NOT NULL,  -- [{"id": "xxx", "time_spent": 5}, ...]
  answers JSON NOT NULL,  -- [{"question_id": "xxx", "selected": "A", "is_correct": true, "is_timeout": false, "tokens": 1}, ...]
  score INT DEFAULT 0,  -- Number of correct answers
  tokens_earned DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,  -- NULL if abandoned
  reconnect_state JSON NULL,  -- {"current_question_index": 2, "seconds_left": 3, "disconnected_at": "2026-06-27T15:00:00Z"}
  INDEX idx_user_id (user_id),
  INDEX idx_started_at (started_at),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Card rarities table: manageable from admin dashboard
CREATE TABLE IF NOT EXISTS card_rarities (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  drop_rate DECIMAL(5,2) DEFAULT 0.00,  -- percentage
  effect_type VARCHAR(50) NOT NULL,  -- e.g., 'population_boost', 'military_boost'
  effect_value DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_countries_world_active ON countries(world, is_active);
CREATE INDEX idx_quiz_difficulty_active ON quiz_questions(difficulty, is_active);
CREATE INDEX idx_card_rarity_active ON card_rarities(is_active);

-- Initial data: Insert countries from frontend (run this once)
-- This is a placeholder; actual data will be inserted via migration script
-- INSERT INTO countries (id, name, pop, level, military, airports, trains, adjacent, world)
-- VALUES ('afghanistan', 'Afghanistan', 38000, 1, 1, 1, 1, '["india","pakistan","china"]', 'earth');
