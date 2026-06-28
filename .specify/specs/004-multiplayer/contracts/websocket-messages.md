# API Contracts: WebSocket Messages / WebSocket 消息 API 契约

**Feature / 功能**: Multiplayer System / 多人游戏系统
**Date / 日期**: 2026-06-27

---

## 1. WebSocket Connection / WebSocket 连接

### 1.1 Connection URL / 连接 URL

```
wss://{api-gateway-url}/prod?token={jwt_token}
```

**Parameters / 参数**:
- `token`: JWT token for authentication (required) / 用于认证的 JWT 令牌（必需）

**Example / 示例**:
```
wss://abc123.tencentcloudapi.com/prod?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Client-to-Server Messages / 客户端到服务器消息

### 2.1 Battle Attack / 战斗攻击

**Message Type / 消息类型**: `battle_attack`

**Payload / 负载**:
```json
{
  "type": "battle_attack",
  "payload": {
    "territoryId": "territory_123",
    "defenderId": "player_456"
  },
  "timestamp": 1234567890
}
```

**Validation / 验证**:
- `territoryId`: Must be valid territory ID (string, required) / 必须是有效的领土 ID（字符串，必需）
- `defenderId`: Must be valid player ID (string, required) / 必须是有效的玩家 ID（字符串，必需）
- Player must have military units / 玩家必须有军事单位
- Territory must be adjacent to player's territory / 领土必须与玩家的领土相邻

**Response / 响应**: Server sends `battle_started` message to both players. / 服务器向两个玩家发送 `battle_started` 消息。

---

### 2.2 Battle Retreat / 战斗撤退

**Message Type / 消息类型**: `battle_retreat`

**Payload / 负载**:
```json
{
  "type": "battle_retreat",
  "payload": {
    "battleId": "battle_789"
  },
  "timestamp": 1234567890
}
```

**Validation / 验证**:
- `battleId`: Must be valid battle ID (string, required) / 必须是有效的战斗 ID（字符串，必需）
- Player must be participant in the battle / 玩家必须是战斗的参与者

**Response / 响应**: Server sends `battle_result` message with retreat result. / 服务器发送带有撤退结果的 `battle_result` 消息。

---

### 2.3 Chat Message / 聊天消息

**Message Type / 消息类型**: `chat_send`

**Payload / 负载**:
```json
{
  "type": "chat_send",
  "payload": {
    "channel": "global",
    "content": "Hello, world!"
  },
  "timestamp": 1234567890
}
```

**Validation / 验证**:
- `channel`: Must be valid channel ("global", "alliance-{id}", "private-{player1}-{player2}") (string, required) / 必须是有效的频道（字符串，必需）
- `content`: Max 500 characters, no profanity (string, required) / 最多 500 字符，无亵渎性内容（字符串，必需）
- Rate limit: 10 messages per minute / 速率限制：每分钟 10 条消息

**Response / 响应**: Server sends `chat_message` to all players in channel. / 服务器向频道中的所有玩家发送 `chat_message`。

---

### 2.4 Alliance Request / 联盟请求

**Message Type / 消息类型**: `alliance_request`

**Payload / 负载**:
```json
{
  "type": "alliance_request",
  "payload": {
    "targetPlayerId": "player_456"
  },
  "timestamp": 1234567890
}
```

**Validation / 验证**:
- `targetPlayerId`: Must be valid player ID (string, required) / 必须是有效的玩家 ID（字符串，必需）
- Player must not already be allied with target / 玩家不得已经与目标结盟

**Response / 响应**: Server sends `alliance_request_received` to target player. / 服务器向目标玩家发送 `alliance_request_received`。

---

### 2.5 Heartbeat / 心跳

**Message Type / 消息类型**: `heartbeat`

**Payload / 负载**:
```json
{
  "type": "heartbeat",
  "payload": {},
  "timestamp": 1234567890
}
```

**Response / 响应**: Server sends `heartbeat_ack` with server timestamp. / 服务器发送带有服务器时间戳的 `heartbeat_ack`。

---

## 3. Server-to-Client Messages / 服务器到客户端消息

### 3.1 Battle Started / 战斗开始

**Message Type / 消息类型**: `battle_started`

**Payload / 负载**:
```json
{
  "type": "battle_started",
  "payload": {
    "battleId": "battle_789",
    "attackerId": "player_123",
    "defenderId": "player_456",
    "territoryId": "territory_123",
    "startTime": 1234567890
  },
  "timestamp": 1234567890
}
```

**Recipients / 接收者**: Attacker and defender / 攻击者和防御者

---

### 3.2 Battle Update / 战斗更新

**Message Type / 消息类型**: `battle_update`

**Payload / 负载**:
```json
{
  "type": "battle_update",
  "payload": {
    "battleId": "battle_789",
    "status": "ongoing",
    "progress": 45,
    "attackerCasualties": 100,
    "defenderCasualties": 120
  },
  "timestamp": 1234567890
}
```

**Recipients / 接收者**: Attacker and defender / 攻击者和防御者

---

### 3.3 Battle Result / 战斗结果

**Message Type / 消息类型**: `battle_result`

**Payload / 负载**:
```json
{
  "type": "battle_result",
  "payload": {
    "battleId": "battle_789",
    "status": "attacker_wins",
    "territoryId": "territory_123",
    "newOwnerId": "player_123",
    "attackerCasualties": 500,
    "defenderCasualties": 600,
    "rewards": {
      "tokens": 1,
      "population": 1000
    }
  },
  "timestamp": 1234567890
}
```

**Recipients / 接收者**: Attacker and defender / 攻击者和防御者

---

### 3.4 Chat Message / 聊天消息

**Message Type / 消息类型**: `chat_message`

**Payload / 负载**:
```json
{
  "type": "chat_message",
  "payload": {
    "messageId": "msg_123",
    "channel": "global",
    "senderId": "player_456",
    "senderName": "Player456",
    "content": "Hello, world!",
    "timestamp": 1234567890
  },
  "timestamp": 1234567890
}
```

**Recipients / 接收者**: All players in channel / 频道中的所有玩家

---

### 3.5 Alliance Request Received / 收到联盟请求

**Message Type / 消息类型**: `alliance_request_received`

**Payload / 负载**:
```json
{
  "type": "alliance_request_received",
  "payload": {
    "requestId": "req_123",
    "fromPlayerId": "player_123",
    "fromPlayerName": "Player123",
    "timestamp": 1234567890
  },
  "timestamp": 1234567890
}
```

**Recipients / 接收者**: Target player / 目标玩家

---

### 3.6 Alliance Formed / 联盟形成

**Message Type / 消息类型**: `alliance_formed`

**Payload / 负载**:
```json
{
  "type": "alliance_formed",
  "payload": {
    "allianceId": "alliance_789",
    "members": [
      {"playerId": "player_123", "playerName": "Player123"},
      {"playerId": "player_456", "playerName": "Player456"}
    ]
  },
  "timestamp": 1234567890
}
```

**Recipients / 接收者**: All alliance members / 所有联盟成员

---

### 3.7 Heartbeat Acknowledgment / 心跳确认

**Message Type / 消息类型**: `heartbeat_ack`

**Payload / 负载**:
```json
{
  "type": "heartbeat_ack",
  "payload": {
    "serverTimestamp": 1234567920
  },
  "timestamp": 1234567920
}
```

**Recipients / 接收者**: Sender (client who sent heartbeat) / 发送者（发送心跳的客户端）

---

### 3.8 Error / 错误

**Message Type / 消息类型**: `error`

**Payload / 负载**:
```json
{
  "type": "error",
  "payload": {
    "code": "INVALID_MESSAGE",
    "message": "Message format is invalid",
    "details": "Field 'territoryId' is required"
  },
  "timestamp": 1234567890
}
```

**Error Codes / 错误代码**:
- `INVALID_MESSAGE` - Message format is invalid / 消息格式无效
- `UNAUTHORIZED` - JWT token is invalid or expired / JWT 令牌无效或过期
- `RATE_LIMITED` - Rate limit exceeded / 超出速率限制
- `NOT_FOUND` - Resource not found / 资源未找到
- `ALREADY_EXISTS` - Resource already exists / 资源已存在
- `INVALID_STATE` - Invalid game state for operation / 操作无效游戏状态

**Recipients / 接收者**: Sender (client who caused the error) / 发送者（导致错误的客户端）

---

## 4. Message Flow Examples / 消息流示例

### 4.1 PvP Battle Flow / PvP 战斗流程

```
Client A (Attacker)                Server                Client B (Defender)
    |                                |                       |
    |-- battle_attack -------------->|                       |
    |                                |-- battle_started ---->|
    |<-- battle_started -------------|                       |
    |                                |                       |
    |                                |-- battle_update ---->| (every 1s)
    |<-- battle_update --------------|                       |
    |                                |                       |
    |                                |-- battle_result ---->|
    |<-- battle_result --------------|                       |
```

---

### 4.2 Chat Flow / 聊天流程

```
Client A                          Server                     Client B
    |                                |                       |
    |-- chat_send ------------------>|                       |
    |                                |-- chat_message ----->|
    |<-- chat_message ---------------|                       |
```

---

### 4.3 Alliance Flow / 联盟流程

```
Client A                          Server                     Client B
    |                                |                       |
    |-- alliance_request ----------->|                       |
    |                                |-- alliance_request -->|
    |                                |   _received          |
    |                                |                       |
    |                                |<-- alliance_respond --|
    |                                |   (accept)            |
    |                                |                       |
    |                                |-- alliance_formed -->|
    |<-- alliance_formed -------------|                       |
```

---

## 5. WebSocket Connection Lifecycle / WebSocket 连接生命周期

### 5.1 Connection / 连接

1. Client connects to `wss://{api-gateway-url}/prod?token={jwt_token}` / 客户端连接到 `wss://{api-gateway-url}/prod?token={jwt_token}`
2. API Gateway triggers `websocket-connect` SCF function / API 网关触发 `websocket-connect` SCF 函数
3. SCF function validates JWT token / SCF 函数验证 JWT 令牌
4. If valid, connection established and connection state stored in Redis / 如果有效，建立连接并将连接状态存储在 Redis 中
5. If invalid, connection rejected with 401 status / 如果无效，连接被拒绝，状态为 401

---

### 5.2 Message Exchange / 消息交换

1. Client sends message (JSON format) / 客户端发送消息（JSON 格式）
2. API Gateway triggers `websocket-message` SCF function / API 网关触发 `websocket-message` SCF 函数
3. SCF function parses message and routes to appropriate handler / SCF 函数解析消息并路由到适当的处理程序
4. Handler processes message and sends response via WebSocket / 处理程序处理消息并通过 WebSocket 发送响应

---

### 5.3 Heartbeat / 心跳

1. Client sends `heartbeat` message every 30 seconds / 客户端每 30 秒发送一次 `heartbeat` 消息
2. Server responds with `heartbeat_ack` / 服务器以 `heartbeat_ack` 响应
3. If client misses 2 consecutive heartbeats, marked as "disconnected" / 如果客户端错过 2 次连续心跳，标记为"断开连接"

---

### 5.4 Disconnection / 断开连接

1. Client disconnects (voluntarily or due to network issue) / 客户端断开连接（自愿或因网络问题）
2. API Gateway triggers `websocket-disconnect` SCF function / API 网关触发 `websocket-disconnect` SCF 函数
3. SCF function removes connection state from Redis / SCF 函数从 Redis 中删除连接状态
4. Player marked as "disconnected" / 玩家标记为"断开连接"

---

## 6. Error Handling / 错误处理

### 6.1 Connection Errors / 连接错误

| Error / 错误 | Cause / 原因 | Solution / 解决方案 |
|--------------|--------------|-------------------|
| 401 Unauthorized / 401 未授权 | Invalid JWT token / JWT 令牌无效 | Re-authenticate and get new token / 重新认证并获取新令牌 |
| 503 Service Unavailable / 503 服务不可用 | API Gateway down / API 网关宕机 | Retry with exponential backoff / 以指数退避重试 |

---

### 6.2 Message Errors / 消息错误

| Error / 错误 | Cause / 原因 | Solution / 解决方案 |
|--------------|--------------|-------------------|
| INVALID_MESSAGE / 无效消息 | Message format invalid / 消息格式无效 | Fix message format and resend / 修复消息格式并重新发送 |
| RATE_LIMITED / 速率限制 | Too many messages / 消息过多 | Wait and retry / 等待并重试 |
| NOT_FOUND / 未找到 | Resource not found / 资源未找到 | Check resource ID and retry / 检查资源 ID 并重试 |

---

**Author / 作者**: AI Assistant
**Date / 日期**: 2026-06-27
**Status / 状态**: Complete / 完成
