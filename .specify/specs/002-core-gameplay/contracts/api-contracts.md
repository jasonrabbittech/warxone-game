# API Contracts: Core Gameplay System / 核心游戏玩法系统 API 契约

**Date / 日期**: 2026-06-27
**Feature / 功能**: 002-core-gameplay
**Base URL / 基础 URL**: `https://your-api-gateway-domain.com/api`

---

## 1. Authentication Endpoints / 认证端点

### 1.1 POST /auth/register

**Description / 描述**: 用户注册。

**Request / 请求**:
```json
{
  "username": "player1",
  "password": "password123",
  "email": "player1@example.com"
}
```

**Validation / 验证**:
- `username`: 3-50 字符，字母数字下划线
- `password`: ≥ 8 字符
- `email`: 有效邮箱格式

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "data": {
    "user_id": 123,
    "username": "player1",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error) / 响应（错误）**:
```json
{
  "status": "error",
  "message": "Username already exists / 用户名已存在",
  "code": "USERNAME_EXISTS"
}
```

**HTTP Status / HTTP 状态**:
- 201 Created: 注册成功
- 400 Bad Request: 验证失败
- 409 Conflict: 用户名或邮箱已存在

---

### 1.2 POST /auth/login

**Description / 描述**: 用户登录。

**Request / 请求**:
```json
{
  "username": "player1",
  "password": "password123"
}
```

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "data": {
    "user_id": 123,
    "username": "player1",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "level": 1,
    "xp": 0
  }
}
```

**Response (Error) / 响应（错误）**:
```json
{
  "status": "error",
  "message": "Invalid credentials / 凭证无效",
  "code": "INVALID_CREDENTIALS"
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 登录成功
- 401 Unauthorized: 凭证无效

---

## 2. Game Save/Load Endpoints / 游戏存档端点

### 2.1 POST /game/save

**Description / 描述**: 保存游戏状态（每 30 秒自动保存，或重要操作后保存）。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token}
```

**Request / 请求**:
```json
{
  "save_name": "Default",
  "save_data": {
    "player": { "name": "Player1", "tokens": 10 },
    "territories": ["CN-BJ", "CN-SH"],
    "resources": { "population": 10000, "gold": 500, "food": 2000, "tokens": 10 },
    "military": 100,
    "cards": [ ... ],
    "connections": [ ... ],
    "currentWorld": "earth",
    "marsUnlocked": false
  }
}
```

**Validation / 验证**:
- `save_data`: 有效 JSON，包含所有必需字段

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "message": "Game saved successfully / 游戏保存成功",
  "data": {
    "save_id": 456,
    "updated_at": "2026-06-27T22:00:00Z"
  }
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 保存成功
- 400 Bad Request: 验证失败
- 401 Unauthorized: Token 无效

---

### 2.2 GET /game/load

**Description / 描述**: 加载游戏状态。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token}
```

**Query Parameters / 查询参数**:
- `save_name` (optional): 存档名称，默认 "Default"

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "data": {
    "save_id": 456,
    "save_name": "Default",
    "save_data": {
      "player": { "name": "Player1", "tokens": 10 },
      "territories": ["CN-BJ", "CN-SH"],
      ...
    },
    "created_at": "2026-06-27T20:00:00Z",
    "updated_at": "2026-06-27T22:00:00Z"
  }
}
```

**Response (Error) / 响应（错误）**:
```json
{
  "status": "error",
  "message": "No save found / 未找到存档",
  "code": "SAVE_NOT_FOUND"
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 加载成功
- 401 Unauthorized: Token 无效
- 404 Not Found: 未找到存档

---

## 3. Card System Endpoints / 卡牌系统端点

### 3.1 POST /card/purchase

**Description / 描述**: 购买卡包（消耗 5 代币）。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token}
```

**Request / 请求**:
```json
{
  "pack_type": "standard"
}
```

**Validation / 验证**:
- `pack_type`: 必须是 "standard"（未来可扩展）

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "message": "Card pack purchased / 卡包已购买",
  "data": {
    "card": {
      "name": "Beijing",
      "rarity": "legendary",
      "population": 20000,
      "military": 200,
      "gold": 10000,
      "food": 5000,
      "airports": 3,
      "train_stations": 10,
      "military_units": 50
    },
    "remaining_tokens": 5
  }
}
```

**Response (Error) / 响应（错误）**:
```json
{
  "status": "error",
  "message": "Not enough tokens / 代币不足",
  "code": "INSUFFICIENT_TOKENS"
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 购买成功
- 400 Bad Request: 验证失败
- 401 Unauthorized: Token 无效
- 402 Payment Required: 代币不足

---

## 4. Military Training Endpoint / 军事训练端点

### 4.1 POST /military/train

**Description / 描述**: 训练军事单位（消耗 1000 人口 + 5 代币，获得 10 军事力量）。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token}
```

**Request / 请求**:
```json
{
  "amount": 10
}
```

**Validation / 验证**:
- `amount`: 必须是 10 的倍数

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "message": "Military trained / 军事已训练",
  "data": {
    "military_gained": 10,
    "remaining_population": 9000,
    "remaining_tokens": 5
  }
}
```

**Response (Error) / 响应（错误）**:
```json
{
  "status": "error",
  "message": "Not enough population or tokens / 人口或代币不足",
  "code": "INSUFFICIENT_RESOURCES"
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 训练成功
- 400 Bad Request: 验证失败
- 401 Unauthorized: Token 无效
- 402 Payment Required: 资源不足

---

## 5. Admin Gift Pack Endpoints / 管理员礼包端点

### 5.1 POST /admin/gift-pack/create

**Description / 描述**: 管理员创建礼包（仅管理员）。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token} (admin only)
```

**Request / 请求**:
```json
{
  "name": "Welcome Gift",
  "description": "Welcome gift for new players",
  "contents": {
    "cards": [
      { "rarity": "common", "weight": 70 },
      { "rarity": "rare", "weight": 25 }
    ],
    "gold": 1000,
    "food": 500,
    "tokens": 10,
    "population": 5000
  },
  "rarity": "common"
}
```

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "message": "Gift pack created / 礼包已创建",
  "data": {
    "gift_pack_id": 789
  }
}
```

**HTTP Status / HTTP 状态**:
- 201 Created: 创建成功
- 400 Bad Request: 验证失败
- 401 Unauthorized: Token 无效
- 403 Forbidden: 非管理员

---

### 5.2 POST /admin/gift-pack/distribute

**Description / 描述**: 管理员发放礼包给玩家（仅管理员）。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token} (admin only)
```

**Request / 请求**:
```json
{
  "gift_pack_id": 789,
  "user_ids": [123, 456, 789]
}
```

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "message": "Gift pack distributed / 礼包已发放",
  "data": {
    "distributed_count": 3
  }
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 发放成功
- 400 Bad Request: 验证失败
- 401 Unauthorized: Token 无效
- 403 Forbidden: 非管理员

---

### 5.3 POST /gift-pack/claim

**Description / 描述**: 玩家领取礼包。

**Headers / 请求头**:
```
Authorization: Bearer {JWT_token}
```

**Request / 请求**:
```json
{
  "gift_pack_id": 789
}
```

**Response (Success) / 响应（成功）**:
```json
{
  "status": "success",
  "message": "Gift pack claimed / 礼包已领取",
  "data": {
    "cards": [ ... ],
    "gold": 1000,
    "food": 500,
    "tokens": 10,
    "population": 5000
  }
}
```

**HTTP Status / HTTP 状态**:
- 200 OK: 领取成功
- 400 Bad Request: 验证失败
- 401 Unauthorized: Token 无效
- 404 Not Found: 礼包不存在或已领取

---

## 6. Error Codes / 错误代码

| Code / 代码 | Description / 描述 | HTTP Status / HTTP 状态 |
|--------------|-------------------|---------------------|
| `USERNAME_EXISTS` | 用户名已存在 | 409 |
| `EMAIL_EXISTS` | 邮箱已存在 | 409 |
| `INVALID_CREDENTIALS` | 凭证无效 | 401 |
| `TOKEN_INVALID` | Token 无效 | 401 |
| `TOKEN_EXPIRED` | Token 过期 | 401 |
| `INSUFFICIENT_TOKENS` | 代币不足 | 402 |
| `INSUFFICIENT_RESOURCES` | 资源不足 | 402 |
| `SAVE_NOT_FOUND` | 未找到存档 | 404 |
| `CARD_NOT_FOUND` | 未找到卡牌 | 404 |
| `GIFT_PACK_NOT_FOUND` | 未找到礼包 | 404 |
| `VALIDATION_ERROR` | 验证错误 | 400 |
| `FORBIDDEN` | 禁止访问（非管理员） | 403 |

---

## 7. Authentication / 认证

所有 API 端点（除了 `/auth/register` 和 `/auth/login`）都需要在 `Authorization` header 中提供有效的 JWT token：

```
Authorization: Bearer {JWT_token}
```

**JWT Token Structure / JWT Token 结构**:
```json
{
  "user_id": 123,
  "username": "player1",
  "level": 1,
  "xp": 0,
  "is_admin": false,
  "exp": 1735459200  // 过期时间戳
}
```

**Token Expiration / Token 过期**: 7 天

---

**End of Document / 文档结束**
