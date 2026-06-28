-- WarXone Game Database Schema
-- TDSQL-C Serverless MySQL 8.0
-- Generated: 2026-06-27

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `level` INT UNSIGNED DEFAULT 1,
  `xp` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `game_saves`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `game_saves` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `save_name` VARCHAR(100) DEFAULT 'Default',
  `save_data` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_game_saves_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `cards`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cards` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `rarity` ENUM('common', 'rare', 'super_rare', 'mythic', 'legendary', 'ultra_legendary') NOT NULL,
  `population` INT UNSIGNED DEFAULT 0,
  `military` INT UNSIGNED DEFAULT 0,
  `gold` INT UNSIGNED DEFAULT 0,
  `food` INT UNSIGNED DEFAULT 0,
  `airports` INT UNSIGNED DEFAULT 0,
  `train_stations` INT UNSIGNED DEFAULT 0,
  `military_units` INT UNSIGNED DEFAULT 0,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  KEY `idx_rarity` (`rarity`),
  CONSTRAINT `fk_cards_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `territories`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `territories` (
  `id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `world` ENUM('earth', 'mars') NOT NULL,
  `owner_type` ENUM('player', 'ai', 'neutral') DEFAULT 'neutral',
  `military` INT UNSIGNED DEFAULT 0,
  `population` INT UNSIGNED DEFAULT 0,
  `adjacent` JSON DEFAULT NULL,
  `svg_path` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `connections`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `connections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `territory1_id` VARCHAR(20) NOT NULL,
  `territory2_id` VARCHAR(20) NOT NULL,
  `type` ENUM('airport', 'train', 'military') NOT NULL,
  `bonus` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_connections_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `alliances`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `alliances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user1_id` BIGINT UNSIGNED NOT NULL,
  `user2_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('pending', 'active', 'broken') DEFAULT 'pending',
  `benefits` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user1_id` (`user1_id`),
  KEY `idx_user2_id` (`user2_id`),
  CONSTRAINT `fk_alliances_user1_id` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alliances_user2_id` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `weapons`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `weapons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `category` ENUM('sea', 'land', 'air', 'cyber') NOT NULL,
  `weapon_type` ENUM('attack', 'defense') NOT NULL,
  `effect_value` INT UNSIGNED DEFAULT 0,
  `energy_cost` INT UNSIGNED DEFAULT 0,
  `level` INT UNSIGNED DEFAULT 0,
  `evolution_levels` INT UNSIGNED DEFAULT 0,
  `unlock_requirements` JSON DEFAULT NULL,
  `tradeable` BOOLEAN DEFAULT true,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  CONSTRAINT `fk_weapons_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `gift_packs`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gift_packs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `contents` JSON NOT NULL,
  `rarity` ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  `created_by` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_gift_packs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Data
-- --------------------------------------------------------

-- Insert admin user (password: admin123, hashed with bcrypt)
-- In production, generate this with: bcrypt.hash('admin123', 10)
INSERT INTO `users` (`username`, `password_hash`, `email`, `level`, `xp`) VALUES
('admin', '$2b$10$YourBcryptHashHere', 'admin@warxone.com', 1, 0)
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Insert sample territories (Earth)
-- In production, run scripts/seed-territories.js to seed all territories
INSERT INTO `territories` (`id`, `name`, `world`, `adjacent`) VALUES
('CN-BJ', 'Beijing', 'earth', '["CN-TJ", "CN-HE"]'),
('CN-TJ', 'Tianjin', 'earth', '["CN-BJ", "CN-HE"]'),
('CN-SH', 'Shanghai', 'earth', '["CN-JS", "CN-ZJ"]')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Insert sample cards
-- In production, run scripts/seed-cards.js to seed all cards
INSERT INTO `cards` (`name`, `rarity`, `population`, `military`, `gold`, `food`, `airports`, `train_stations`, `military_units`) VALUES
('Beijing', 'legendary', 20000, 5000, 1000, 500, 2, 5, 10),
('Shanghai', 'legendary', 25000, 4000, 2000, 600, 2, 4, 8),
('Tianjin', 'rare', 5000, 2000, 500, 200, 1, 2, 3)
ON DUPLICATE KEY UPDATE `name`=`name`;
