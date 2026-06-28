# Data Model: Multiplayer System / 多人游戏系统数据模型

**Feature / 功能**: Multiplayer System / 多人游戏系统
**Date / 日期**: 2026-06-27

---

## 1. Database Schema Changes / 数据库架构更改

### 1.1 Alliances Table / 联盟表

```sql
CREATE TABLE alliances (
    id VARCHAR(36) PRIMARY KEY,
    members JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'disbanded') DEFAULT 'active',
    shared_vision BOOLEAN DEFAULT true,
    resource_sharing BOOLEAN DEFAULT false,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Fields / 字段**:
- `id`: Unique alliance ID (UUID) / 唯一的联盟 ID（UUID）
- `members`: JSON array of player IDs / 玩家 ID 的 JSON 数组
- `created_at`: Alliance creation timestamp / 联盟创建时间戳
- `status`: Alliance status (active/disbanded) / 联盟状态（活跃/解散）
- `shared_vision`: Whether shared vision is enabled / 是否启用共享视野
- `resource_sharing`: Whether resource sharing is enabled / 是否启用资源共享

**Notes / 备注**:
- `members` field stores up to 10 player IDs (max alliance size) / `members` 字段最多存储 10 个玩家 ID（最大联盟大小）
- Use JSON type for flexible member management / 使用 JSON 类型以灵活的成员管理

---

### 1.2 Battles Table / 战斗表

```sql
CREATE TABLE battles (
    id VARCHAR(36) PRIMARY KEY,
    attacker_id VARCHAR(36) NOT NULL,
    defender_id VARCHAR(36) NOT NULL,
    territory_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('ongoing', 'attacker_wins', 'defender_wins', 'retreat') DEFAULT 'ongoing',
    result JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_attacker (attacker_id),
    INDEX idx_defender (defender_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    FOREIGN KEY (attacker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (defender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Fields / 字段**:
- `id`: Unique battle ID (UUID) / 唯一的战斗 ID（UUID）
- `attacker_id`: Player ID of attacker / 攻击者的玩家 ID
- `defender_id`: Player ID of defender / 防御者的玩家 ID
- `territory_id`: Territory being attacked / 被攻击的领土
- `start_time`: Battle start timestamp / 战斗开始时间戳
- `end_time`: Battle end timestamp (null if ongoing) / 战斗结束时间戳（如果进行中为 null）
- `status`: Battle status / 战斗状态
- `result`: JSON object with battle details (casualties, territory change) / 带有战斗详情的 JSON 对象（伤亡、领土变化）

**Notes / 备注**:
- `result` field stores detailed battle log / `result` 字段存储详细的战斗日志
- Indexed by `attacker_id` and `defender_id` for quick lookup / 按 `attacker_id` 和 `defender_id` 索引以快速查找
- Indexed by `status` to find ongoing battles / 按 `status` 索引以查找进行中的战斗

---

### 1.3 Chat Messages Table (Optional - for persistence) / 聊天消息表（可选 - 用于持久化）

```sql
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    channel VARCHAR(50) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    INDEX idx_channel (channel),
    INDEX idx_timestamp (timestamp),
    INDEX idx_sender (sender_id),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Fields / 字段**:
- `id`: Unique message ID (UUID) / 唯一的消息 ID（UUID）
- `channel`: Chat channel ("global", "alliance-{id}", "private-{player1}-{player2}") / 聊天频道（"全局"、"联盟-{id}"、"私聊-{玩家1}-{玩家2}"）
- `sender_id`: Player ID who sent the message / 发送消息的玩家 ID
- `content`: Message content (max 500 chars) / 消息内容（最多 500 字符）
- `timestamp`: Message send timestamp / 消息发送时间戳
- `edited`: Whether message was edited / 消息是否被编辑
- `deleted`: Whether message was deleted / 消息是否被删除

**Notes / 备注**:
- This table is optional. For MVP, chat messages are stored only in Redis. / 此表是可选的。对于 MVP，聊天消息仅存储在 Redis 中。
- If persistence is needed, enable this table and implement backup from Redis to MySQL. / 如果需要持久化，启用此表并实现从 Redis 到 MySQL 的备份。

---

### 1.4 Game Rooms Table / 游戏房间表

```sql
CREATE TABLE game_rooms (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(6) NOT NULL UNIQUE,
    host_id VARCHAR(36) NOT NULL,
    settings JSON NOT NULL,
    members JSON NOT NULL,
    status ENUM('lobby', 'in_game', 'finished') DEFAULT 'lobby',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_host (host_id),
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Fields / 字段**:
- `id`: Unique room ID (UUID) / 唯一的房间 ID（UUID）
- `code`: Shareable room code (6 chars) / 可分享的房间代码（6 字符）
- `host_id`: Player ID of room creator / 房间创建者的玩家 ID
- `settings`: JSON object with room settings (map, max players, victory conditions) / 带有房间设置的 JSON 对象（地图、最大玩家数、胜利条件）
- `members`: JSON array of player IDs in room / 房间中的玩家 ID 数组
- `status`: Room status (lobby/in_game/finished) / 房间状态（大厅/游戏中/已完成）

**Notes / 备注**:
- Room state is primarily stored in Redis for fast access. This table is for persistence backup. / 房间状态主要存储在 Redis 中以快速访问。此表用于持久化备份。
- `code` is unique 6-character alphanumeric code for sharing / `code` 是用于分享的唯一 6 字符字母数字代码

---

### 1.5 Leaderboards Table (Cached in Redis) / 排行榜表（缓存在 Redis 中）

```sql
-- Leaderboards are calculated in real-time and cached in Redis.
-- This table is not needed for MVP. For future enhancement, can store historical leaderboards.
-- 排行榜是实时计算的并缓存在 Redis 中。
-- MVP 不需要此表。对于未来的增强，可以存储历史排行榜。
```

**Notes / 备注**:
- Leaderboards are calculated asynchronously every 60 seconds / 排行榜每 60 秒异步计算一次
- Results are cached in Redis for fast access / 结果缓存在 Redis 中以快速访问
- No need to store in MySQL for MVP / MVP 不需要存储在 MySQL 中

---

## 2. Redis Data Structure / Redis 数据结构

### 2.1 Connection State / 连接状态

```
Key: connection:{connectionId}
Type: Hash
Fields:
  - playerId: Player ID (string)
  - connectedAt: Timestamp (number)
  - lastHeartbeat: Timestamp (number)
  - currentRoom: Room ID (string, null if not in room)
  - status: "connected" | "disconnected" | "away" (string)
TTL: 3600 seconds (1 hour)
```

**Example / 示例**:
```
connection:abc123 => {
  "playerId": "player_456",
  "connectedAt": 1234567890,
  "lastHeartbeat": 1234567920,
  "currentRoom": "room_789",
  "status": "connected"
}
```

---

### 2.2 Player Online Status / 玩家在线状态

```
Key: player:{playerId}:online
Type: String
Value: "true" | "false"
TTL: 3600 seconds (1 hour)
```

**Example / 示例**:
```
player:player_456:online => "true"
```

---

### 2.3 Chat Message History / 聊天消息历史

```
Key: chat:{channel}
Type: List (sorted by timestamp)
Value: JSON string of message object
Max Length: 100 messages per channel
TTL: 86400 seconds (24 hours)
```

**Message Object / 消息对象**:
```json
{
  "id": "msg_123",
  "senderId": "player_456",
  "content": "Hello, world!",
  "timestamp": 1234567890,
  "edited": false,
  "deleted": false
}
```

**Channels / 频道**:
- `chat:global` - Global chat / 全局聊天
- `chat:alliance:{allianceId}` - Alliance chat / 联盟聊天
- `chat:private:{player1}:{player2}` - Private chat (sorted player IDs) / 私聊（排序的玩家 ID）

**Example / 示例**:
```
chat:global => [
  '{"id":"msg_1","senderId":"player_1","content":"Hello!","timestamp":1234567890}',
  '{"id":"msg_2","senderId":"player_2","content":"Hi!","timestamp":1234567895}'
]
```

---

### 2.4 Game Room State / 游戏房间状态

```
Key: room:{roomId}
Type: Hash
Fields:
  - code: Room code (string, 6 chars)
  - hostId: Host player ID (string)
  - settings: JSON string of room settings
  - members: JSON string of member array
  - status: "lobby" | "in_game" | "finished" (string)
  - createdAt: Timestamp (number)
TTL: 3600 seconds (1 hour)
```

**Example / 示例**:
```
room:room_789 => {
  "code": "ABC123",
  "hostId": "player_456",
  "settings": "{\"map\":\"earth\",\"maxPlayers\":4}",
  "members": "[\"player_456\",\"player_789\"]",
  "status": "lobby",
  "createdAt": 1234567890
}
```

---

### 2.5 Leaderboard Cache / 排行榜缓存

```
Key: leaderboard:{category}:{timeframe}
Type: Sorted Set
Member: Player ID (string)
Score: Score value (number)
TTL: 120 seconds (2 minutes, refreshed every 60 seconds)
```

**Categories / 类别**:
- `territories` - Number of territories controlled / 控制的领土数量
- `military` - Total military strength / 总军事力量
- `resources` - Total resources / 总资源
- `pvp_wins` - Number of PvP wins / PvP 胜利次数

**Timeframes / 时间范围**:
- `daily` - Resets daily / 每日重置
- `weekly` - Resets weekly / 每周重置
- `all_time` - Never resets / 从不重置

**Example / 示例**:
```
leaderboard:territories:daily => [
  {"member": "player_1", "score": 50},
  {"member": "player_2", "score": 45},
  {"member": "player_3", "score": 40}
]
```

---

### 2.6 Battle State (Ephemeral) / 战斗状态（临时）

```
Key: battle:{battleId}
Type: Hash
Fields:
  - attackerId: Attacker player ID (string)
  - defenderId: Defender player ID (string)
  - territoryId: Territory ID (string)
  - startTime: Timestamp (number)
  - status: "ongoing" | "attacker_wins" | "defender_wins" | "retreat" (string)
  - progress: Battle progress percentage (number, 0-100)
TTL: 600 seconds (10 minutes, enough for battle to complete)
```

**Example / 示例**:
```
battle:battle_123 => {
  "attackerId": "player_1",
  "defenderId": "player_2",
  "territoryId": "territory_456",
  "startTime": 1234567890,
  "status": "ongoing",
  "progress": 45
}
```

---

### 2.7 Rate Limiting / 速率限制

```
Key: ratelimit:{playerId}:{action}
Type: String
Value: Request count (number)
TTL: 60 seconds (1 minute)
```

**Actions / 操作**:
- `chat` - Chat message rate limit (10 messages/minute) / 聊天消息速率限制（10 条消息/分钟）
- `battle` - Battle attack rate limit (1 battle/10 seconds) / 战斗攻击速率限制（1 次战斗/10 秒）

**Example / 示例**:
```
ratelimit:player_456:chat => "7"  (7 messages sent in current minute)
```

---

## 3. Data Relationships / 数据关系

### 3.1 Entity Relationship Diagram (ERD) / 实体关系图 (ERD)

```
Users (现有)
  |
  |-- 1:N -- Battles (attacker_id, defender_id)
  |-- 1:N -- Chat Messages (sender_id)
  |-- 1:N -- Game Rooms (host_id)
  |-- M:N -- Alliances (via members JSON field)
```

**Notes / 备注**:
- `Users` table already exists in current schema. / `Users` 表已存在于当前架构中。
- `Battles` table references `Users` table twice (attacker and defender). / `Battles` 表引用 `Users` 表两次（攻击者和防御者）。
- `Alliances` table uses JSON field for members (flexible, but less efficient for querying). / `Alliances` 表对成员使用 JSON 字段（灵活，但查询效率较低）。

---

## 4. Data Migration / 数据迁移

### 4.1 Migration Script / 迁移脚本

```sql
-- Migration: Add multiplayer tables
-- Date: 2026-06-27
-- Author: AI Assistant

CREATE TABLE IF NOT EXISTS alliances (
    id VARCHAR(36) PRIMARY KEY,
    members JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'disbanded') DEFAULT 'active',
    shared_vision BOOLEAN DEFAULT true,
    resource_sharing BOOLEAN DEFAULT false,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS battles (
    id VARCHAR(36) PRIMARY KEY,
    attacker_id VARCHAR(36) NOT NULL,
    defender_id VARCHAR(36) NOT NULL,
    territory_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('ongoing', 'attacker_wins', 'defender_wins', 'retreat') DEFAULT 'ongoing',
    result JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_attacker (attacker_id),
    INDEX idx_defender (defender_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    FOREIGN KEY (attacker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (defender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_rooms (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(6) NOT NULL UNIQUE,
    host_id VARCHAR(36) NOT NULL,
    settings JSON NOT NULL,
    members JSON NOT NULL,
    status ENUM('lobby', 'in_game', 'finished') DEFAULT 'lobby',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_host (host_id),
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: Chat messages table (uncomment if needed)
-- CREATE TABLE IF NOT EXISTS chat_messages (
--     id VARCHAR(36) PRIMARY KEY,
--     channel VARCHAR(50) NOT NULL,
--     sender_id VARCHAR(36) NOT NULL,
--     content TEXT NOT NULL,
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     edited BOOLEAN DEFAULT false,
--     deleted BOOLEAN DEFAULT false,
--     INDEX idx_channel (channel),
--     INDEX idx_timestamp (timestamp),
--     INDEX idx_sender (sender_id),
--     FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Notes / 备注**:
- Run this script on TDSQL-C database to create new tables. / 在 TDSQL-C 数据库上运行此脚本以创建新表。
- Test on staging environment before production. / 在生产之前在预发布环境中测试。
- Backup database before running migration. / 在运行迁移之前备份数据库。

---

## 5. Data Access Patterns / 数据访问模式

### 5.1 Common Queries / 常见查询

#### Get Player's Alliance / 获取玩家的联盟
```sql
SELECT * FROM alliances 
WHERE JSON_CONTAINS(members, '"player_456"');
```

#### Get Player's Active Battles / 获取玩家的活跃战斗
```sql
SELECT * FROM battles 
WHERE (attacker_id = 'player_456' OR defender_id = 'player_456')
AND status = 'ongoing';
```

#### Get Leaderboard (from Redis cache) / 获取排行榜（来自 Redis 缓存）
```javascript
// Pseudo-code / 伪代码
const leaderboard = await redis.zrevrange('leaderboard:territories:daily', 0, 99, 'WITHSCORES');
```

#### Get Chat History (from Redis) / 获取聊天历史（来自 Redis）
```javascript
// Pseudo-code / 伪代码
const messages = await redis.lrange('chat:global', 0, 99);
```

---

## 6. Data Retention Policy / 数据保留策略

### 6.1 MySQL Data / MySQL 数据
- **Alliances**: Keep indefinitely / 无限期保留
- **Battles**: Keep last 30 days (archive older) / 保留最近 30 天（归档较旧的）
- **Game Rooms**: Keep last 7 days (ephemeral data) / 保留最近 7 天（临时数据）

### 6.2 Redis Data / Redis 数据
- **Connection State**: TTL 1 hour / TTL 1 小时
- **Chat Messages**: TTL 24 hours / TTL 24 小时
- **Game Rooms**: TTL 1 hour / TTL 1 小时
- **Battle State**: TTL 10 minutes / TTL 10 分钟
- **Leaderboard Cache**: TTL 2 minutes (refreshed every 60 seconds) / TTL 2 分钟（每 60 秒刷新一次）

---

**Author / 作者**: AI Assistant
**Date / 日期**: 2026-06-27
**Status / 状态**: Complete / 完成
