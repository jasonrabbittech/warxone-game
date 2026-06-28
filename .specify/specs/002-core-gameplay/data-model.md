# Data Model: Core Gameplay System / 核心游戏玩法系统数据模型

**Date / 日期**: 2026-06-27
**Feature / 功能**: 002-core-gameplay
**Database / 数据库**: TDSQL-C Serverless MySQL 8.0

---

## 1. Entity Relationship Diagram (ERD) / 实体关系图

```
+---------------+       +----------------+       +-------------+
|   users       |       | game_saves    |       |   cards    |
|---------------|       |----------------|       |-------------|
| id (PK)      |<----->| user_id (FK) |       | id (PK)   |
| username      |       | save_data     |       | name       |
| password_hash |       | created_at    |       | rarity     |
| email         |       | updated_at    |       | ...        |
| level         |       +----------------+       +-------------+
| xp            |
| created_at    |
+---------------+

+----------------+       +----------------+       +----------------+
|   territories  |       |   connections  |       |   alliances   |
|----------------|       |----------------|       |----------------|
| id (PK)       |       | id (PK)       |       | id (PK)       |
| name           |       | user_id (FK)  |       | user1_id (FK) |
| owner_type     |       | territory1_id  |       | user2_id (FK) |
| ...            |       | territory2_id  |       | status        |
+----------------+       | type           |       | created_at    |
                        +----------------+       +----------------+

+----------------+       +----------------+
|    weapons    |       |    chests     |
|----------------|       |----------------|
| id (PK)       |       | id (PK)       |
| name           |       | user_id (FK)  |
| category       |       | territory_id  |
| ...            |       | type           |
+----------------+       | loot_data     |
                                        +----------------+
```

---

## 2. Entity Definitions / 实体定义

### 2.1 User / 用户

**Table Name / 表名**: `users`

**Description / 描述**: 全局用户账户（跨游戏存档）。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 用户 ID |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| `password_hash` | VARCHAR(255) | NOT NULL | 密码哈希 (bcrypt) |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| `level` | INT UNSIGNED | DEFAULT 1 | 玩家等级（全局属性） |
| `xp` | INT UNSIGNED | DEFAULT 0 | 经验值 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes / 索引**:
- `idx_username`: INDEX (`username`)
- `idx_email`: INDEX (`email`)

**Validation Rules / 验证规则**:
- `username`: 3-50 字符，字母数字下划线
- `password_hash`: bcrypt 哈希（非空）
- `email`: 有效邮箱格式

---

### 2.2 Game Save / 游戏存档

**Table Name / 表名**: `game_saves`

**Description / 描述**: 玩家游戏状态（JSON 格式）。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 存档 ID |
| `user_id` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`), NOT NULL | 用户 ID |
| `save_name` | VARCHAR(100) | DEFAULT 'Default' | 存档名称 |
| `save_data` | JSON | NOT NULL | 游戏状态（JSON） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Foreign Keys / 外键**:
- `fk_game_saves_user_id`: FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Indexes / 索引**:
- `idx_user_id`: INDEX (`user_id`)

**Save Data JSON Schema / 存档数据 JSON 模式**:
```json
{
  "player": {
    "name": "Player1",
    "flag": "🏳️",
    "level": 1,
    "tokens": 10
  },
  "territories": ["CN-BJ", "CN-SH"],
  "resources": {
    "population": 10000,
    "gold": 500,
    "food": 2000,
    "tokens": 10
  },
  "military": 100,
  "cards": [
    { "name": "Beijing", "rarity": "legendary", "population": 20000, ... }
  ],
  "cardCollection": [ ... ],
  "connections": [
    { "id": 1, "territory1": "CN-BJ", "territory2": "CN-TJ", "type": "train" }
  ],
  "alliances": [],
  "weapons": [],
  "infrastructure": {
    "totalAirports": 5,
    "totalTrainStations": 20,
    "totalMilitaryUnits": 50
  },
  "cooldowns": {
    "battle": null,
    "quiz": null
  },
  "currentWorld": "earth",
  "marsUnlocked": false
}
```

---

### 2.3 Card / 卡牌

**Table Name / 表名**: `cards`

**Description / 描述**: 卡牌定义（管理员配置）。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 卡牌 ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | 卡牌名称（城市名） |
| `rarity` | ENUM('common', 'rare', 'super_rare', 'mythic', 'legendary', 'ultra_legendary') | NOT NULL | 稀有度 |
| `population` | INT UNSIGNED | DEFAULT 0 | 人口加成 |
| `military` | INT UNSIGNED | DEFAULT 0 | 军事力量加成 |
| `gold` | INT UNSIGNED | DEFAULT 0 | 金币加成 |
| `food` | INT UNSIGNED | DEFAULT 0 | 食物加成 |
| `airports` | INT UNSIGNED | DEFAULT 0 | 机场数量 |
| `train_stations` | INT UNSIGNED | DEFAULT 0 | 火车站数量 |
| `military_units` | INT UNSIGNED | DEFAULT 0 | 军事单位数量 |
| `created_by` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`) | 创建者（管理员） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**Foreign Keys / 外键**:
- `fk_cards_created_by`: FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL

**Indexes / 索引**:
- `idx_rarity`: INDEX (`rarity`)

**Validation Rules / 验证规则**:
- `name`: 唯一城市名
- `rarity`: 必须是 6 种稀有度之一
- `population`, `military`, `gold`, `food`: ≥ 0

---

### 2.4 Territory / 领土

**Table Name / 表名**: `territories`

**Description / 描述**: 领土定义（硬编码在前端，后端用于验证）。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | VARCHAR(20) | PRIMARY KEY | 领土 ID（例如 "CN-BJ"） |
| `name` | VARCHAR(100) | NOT NULL | 领土名称 |
| `world` | ENUM('earth', 'mars') | NOT NULL | 所属世界 |
| `owner_type` | ENUM('player', 'ai', 'neutral') | DEFAULT 'neutral' | 拥有者类型 |
| `military` | INT UNSIGNED | DEFAULT 0 | 防御军事力量 |
| `population` | INT UNSIGNED | DEFAULT 0 | 人口 |
| `adjacent` | JSON | DEFAULT NULL | 相邻领土 ID 数组 |
| `svg_path` | TEXT | DEFAULT NULL | SVG 路径数据 |

**Validation Rules / 验证规则**:
- `id`: 唯一标识符
- `adjacent`: 有效的领土 ID 数组

**Note / 注意**: 在 Phase 1，领土数据硬编码在前端（`frontend/src/game/countries.js` 和 `marsCountries.js`）。后端表用于验证和多人游戏。

---

### 2.5 Connection / 连接

**Table Name / 表名**: `connections`

**Description / 描述**: 玩家建立的连接。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 连接 ID |
| `user_id` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`), NOT NULL | 用户 ID |
| `territory1_id` | VARCHAR(20) | NOT NULL | 领土 1 ID |
| `territory2_id` | VARCHAR(20) | NOT NULL | 领土 2 ID |
| `type` | ENUM('airport', 'train', 'military') | NOT NULL | 连接类型 |
| `bonus` | JSON | DEFAULT NULL | 连接奖励 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**Foreign Keys / 外键**:
- `fk_connections_user_id`: FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Indexes / 索引**:
- `idx_user_id`: INDEX (`user_id`)

---

### 2.6 Alliance / 联盟

**Table Name / 表名**: `alliances`

**Description / 描述**: 玩家联盟（Phase 2 功能）。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 联盟 ID |
| `user1_id` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`), NOT NULL | 用户 1 ID |
| `user2_id` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`), NOT NULL | 用户 2 ID |
| `status` | ENUM('pending', 'active', 'broken') | DEFAULT 'pending' | 联盟状态 |
| `benefits` | JSON | DEFAULT NULL | 联盟福利 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Foreign Keys / 外键**:
- `fk_alliances_user1_id`: FOREIGN KEY (`user1_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
- `fk_alliances_user2_id`: FOREIGN KEY (`user2_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Indexes / 索引**:
- `idx_user1_id`: INDEX (`user1_id`)
- `idx_user2_id`: INDEX (`user2_id`)

---

### 2.7 Weapon / 武器

**Table Name / 表名**: `weapons`

**Description / 描述**: 武器定义（Phase 3 功能）。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 武器 ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | 武器名称 |
| `category` | ENUM('sea', 'land', 'air', 'cyber') | NOT NULL | 武器类别 |
| `weapon_type` | ENUM('attack', 'defense') | NOT NULL | 武器类型 |
| `effect_value` | INT UNSIGNED | DEFAULT 0 | 效果值 |
| `energy_cost` | INT UNSIGNED | DEFAULT 0 | 能量消耗 |
| `level` | INT UNSIGNED | DEFAULT 0 | 当前等级 |
| `evolution_levels` | INT UNSIGNED | DEFAULT 0 | 最大进化等级 |
| `unlock_requirements` | JSON | DEFAULT NULL | 解锁要求 |
| `tradeable` | BOOLEAN | DEFAULT true | 是否可交易 |
| `created_by` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`) | 创建者（管理员） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**Foreign Keys / 外键**:
- `fk_weapons_created_by`: FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL

---

### 2.8 Chest / 宝箱

**Description / 描述**: 宝箱是前端临时对象，不存储在数据库中。宝箱生成和打开逻辑在前端实现。

**Data Structure / 数据结构**（前端）:
```javascript
{
  id: Date.now(),
  type: 'normal' | 'giant',
  territoryId: 'CN-BJ',
  lootData: {
    gold: 500  // 0 表示无金币
  }
}
```

---

### 2.9 GiftPack / 礼包

**Table Name / 表名**: `gift_packs`

**Description / 描述**: 管理员创建的礼包。

**Fields / 字段**:

| Field / 字段 | Type / 类型 | Constraints / 约束 | Description / 描述 |
|---------------|--------------|-------------------|-------------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | 礼包 ID |
| `name` | VARCHAR(100) | NOT NULL | 礼包名称 |
| `description` | TEXT | DEFAULT NULL | 礼包描述 |
| `contents` | JSON | NOT NULL | 礼包内容 |
| `rarity` | ENUM('common', 'rare', 'epic', 'legendary') | DEFAULT 'common' | 礼包稀有度 |
| `created_by` | BIGINT UNSIGNED | FOREIGN KEY (`users`.`id`), NOT NULL | 创建者（管理员） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**`contents` JSON Schema / `contents` JSON 模式**:
```json
{
  "cards": [
    { "rarity": "common", "weight": 70 },
    { "rarity": "rare", "weight": 25 },
    { "name": "Beijing", "rarity": "legendary" }  // 指定卡牌
  ],
  "gold": 1000,
  "food": 500,
  "tokens": 10,
  "population": 5000
}
```

**Foreign Keys / 外键**:
- `fk_gift_packs_created_by`: FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE

---

## 3. State Transitions / 状态转换

### 3.1 Alliance Status / 联盟状态

```
[pending] --accept--> [active]
[pending] --reject--> [broken]
[active] --break--> [broken]
```

### 3.2 Battle Cooldown / 战斗冷却

```
[ready] --battle_start--> [cooldown] --30s-5min--> [ready]
```

---

## 4. Validation Rules Summary / 验证规则总结

| Entity / 实体 | Field / 字段 | Validation / 验证 |
|----------------|---------------|----------------|
| `users` | `username` | 3-50 字符，字母数字下划线 |
| `users` | `email` | 有效邮箱格式 |
| `users` | `password_hash` | bcrypt 哈希 |
| `game_saves` | `save_data` | 有效 JSON |
| `cards` | `rarity` | 必须是 6 种稀有度之一 |
| `territories` | `adjacent` | 有效的领土 ID 数组 |
| `connections` | `type` | 必须是 3 种类型之一 |
| `alliances` | `status` | 必须是 3 种状态之一 |
| `weapons` | `category` | 必须是 4 种类别之一 |
| `gift_packs` | `contents` | 有效 JSON |

---

## 5. Indexes for Performance / 性能索引

| Table / 表 | Index / 索引 | Purpose / 用途 |
|-------------|---------------|----------------|
| `users` | `idx_username` | 快速用户名查找 |
| `users` | `idx_email` | 快速邮箱查找 |
| `game_saves` | `idx_user_id` | 快速查询用户存档 |
| `cards` | `idx_rarity` | 快速按稀有度查询 |
| `connections` | `idx_user_id` | 快速查询用户连接 |
| `alliances` | `idx_user1_id`, `idx_user2_id` | 快速查询用户联盟 |

---

## 6. Database Schema Creation Script / 数据库模式创建脚本

参见 `backend/schema.sql`（由 `/speckit.tasks` 命令生成）。

---

**End of Document / 文档结束**
