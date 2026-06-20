-- WarXOne Database Schema
-- For TDSQL-C Serverless MySQL
-- Run this manually after Terraform creates the database instance
-- (SCF functions also auto-create tables via CREATE TABLE IF NOT EXISTS)

CREATE DATABASE IF NOT EXISTS warxone_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE warxone_db;

-- Users table: supports email/password and Google SSO
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(512) NOT NULL DEFAULT '',  -- empty for Google SSO users
  display_name VARCHAR(50) DEFAULT '',
  auth_provider VARCHAR(20) DEFAULT 'email',       -- 'email' or 'google'
  provider_id VARCHAR(255) DEFAULT '',              -- Google sub for SSO users
  refresh_token_version INT DEFAULT 1,              -- bumped on logout to revoke refresh tokens
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_provider (auth_provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game saves: one save slot per user
-- NOTE: No FOREIGN KEY constraint because TDSQL-C Serverless user may lack REFERENCES privilege.
-- Referential integrity is enforced at the application level (auth check before save/load/delete).
CREATE TABLE IF NOT EXISTS game_saves (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  game_state JSON NOT NULL,
  country_name VARCHAR(50) DEFAULT '',
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_user_id (user_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
