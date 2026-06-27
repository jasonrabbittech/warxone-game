-- WarXOne Admin Dashboard Database Schema
-- For TDSQL-C Serverless MySQL
-- Run this to create admin-related tables

USE warxone_db;

-- Admin users table: separate from players, with roles
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(512) NOT NULL,
  role VARCHAR(20) DEFAULT 'moderator',  -- 'super_admin' or 'moderator'
  refresh_token_version INT DEFAULT 1,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log: track all admin actions for security
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  admin_id VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,       -- e.g., 'player_ban', 'content_edit', 'config_update'
  target_type VARCHAR(50) NOT NULL,   -- e.g., 'player', 'country', 'config'
  target_id VARCHAR(36) NOT NULL,
  details JSON,                        -- additional context (old value, new value, etc.)
  ip_address VARCHAR(45),              -- support IPv6
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game configuration: dynamic settings manageable from admin dashboard
CREATE TABLE IF NOT EXISTS game_config (
  `key` VARCHAR(100) PRIMARY KEY,      -- e.g., 'population_growth_rate', 'battle_damage_multiplier'
  value TEXT NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string',  -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(36),             -- admin_users.id
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gift codes: admin-generated codes for player rewards
CREATE TABLE IF NOT EXISTS gift_codes (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  reward_type VARCHAR(50) NOT NULL,   -- e.g., 'tokens', 'population', 'card_pack'
  reward_amount INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  used_by VARCHAR(36) DEFAULT NULL,  -- users.id if used
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,           -- NULL means no expiration
  created_by VARCHAR(36) NOT NULL,    -- admin_users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance mode: simple key-value for system status
INSERT INTO game_config (`key`, value, value_type, description, updated_by)
VALUES ('maintenance_mode', 'false', 'boolean', 'Enable/disable player logins', NULL)
ON DUPLICATE KEY UPDATE value = value;

-- Default population growth rate
INSERT INTO game_config (`key`, value, value_type, description, updated_by)
VALUES ('population_growth_rate', '1.0', 'number', 'Multiplier for population growth per interval', NULL)
ON DUPLICATE KEY UPDATE value = value;

-- Default battle damage multiplier
INSERT INTO game_config (`key`, value, value_type, description, updated_by)
VALUES ('battle_damage_multiplier', '1.0', 'number', 'Multiplier for battle damage calculation', NULL)
ON DUPLICATE KEY UPDATE value = value;

-- Create default super admin account (password: Admin@2026)
-- In production, change this password immediately after first login!
-- Hash generated with PBKDF2-HMAC-SHA512, 100000 iterations
INSERT INTO admin_users (id, email, password_hash, role, is_active)
VALUES (
  UUID(),
  'admin@warxone.com',
  'sha512:100000:1e61cb6fd0edfdf9e427bc56b286fa33:2d8fe2bdefadbf1e52f3781fe57932d3727916adeb4839f1e578ab8eb84a2e7b76e12e8ea5a0e2666246bd5302e4e899d3b8565a925d2e780aa285a534c1ca32',
  'super_admin',
  TRUE
) ON DUPLICATE KEY UPDATE password_hash = 'sha512:100000:1e61cb6fd0edfdf9e427bc56b286fa33:2d8fe2bdefadbf1e52f3781fe57932d3727916adeb4839f1e578ab8eb84a2e7b76e12e8ea5a0e2666246bd5302e4e899d3b8565a925d2e780aa285a534c1ca32';
