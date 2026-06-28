# Research Findings: Core Gameplay System / 核心游戏玩法系统研究结论

**Date / 日期**: 2026-06-27
**Feature / 功能**: 002-core-gameplay

---

## 1. SCF 数据库连接池 (Research Task 1)

### Decision / 决策
使用 `mysql2` 库在 SCF 全局作用域初始化连接池，池大小设置为 1（适配 SCF 单实例场景）。优先使用腾讯云官方 `scf-nodejs-serverlessdb-sdk`。

### Rationale / 理由
- SCF 实例可复用，全局初始化连接池可避免重复连接开销
- 池大小=1 足够 SCF 单实例低并发场景，不浪费数据库资源
- 官方 SDK 已内置最优实践（自动重连、连接健康检测）

### Implementation / 实现
```javascript
// 全局作用域初始化（不是 handler 内部）
const promisePool = require('mysql2').createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 1, // SCF 场景适配
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
}).promise();

exports.main_handler = async (event, context) => {
  let result = await promisePool.query('SELECT * FROM game_saves WHERE user_id = ?', [userId]);
  return result;
};
```

### Alternatives Considered / 考虑的替代方案
- **每次调用新建连接**：❌ 禁止（消耗数据库资源，可能导致连接数打满）
- **池大小 > 1**：❌ 浪费资源（SCF 单实例并发度低）

### References / 参考
- [腾讯云文档：Serverless 应用中心 连接 MySQL 数据库](https://cloud.tencent.com/document/product/1154/51858)
- [腾讯云文档：云函数 云函数接入数据库](https://cloud.tencent.com/document/product/583/51935)

---

## 2. Redis 集成 SCF (Research Task 2)

### Decision / 决策
使用腾讯云 Redis SDK (`ioredis` 或 `redis`) 在 SCF 全局作用域初始化客户端。连接参数通过环境变量注入。

### Rationale / 理由
- Redis 用于 ephemeral 游戏状态（活跃战斗、玩家会话），需要低延迟访问
- 全局初始化客户端可复用连接，避免每次调用新建连接
- 腾讯云 Redis 支持 VPC 内网访问，延迟 < 10ms

### Implementation / 实现
```javascript
// 全局作用域初始化
const Redis = require('ioredis');
let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }
  return redisClient;
}

exports.main_handler = async (event, context) => {
  const redis = getRedisClient();
  await redis.set('active_battle:' + userId, JSON.stringify(battleState), 'EX', 300); // 5分钟过期
  return { status: 'success' };
};
```

### Alternatives Considered / 考虑的替代方案
- **不使用 Redis**：❌ 直接访问 TDSQL-C 会超过 500ms API 响应目标
- **使用 Memcached**：❌ 腾讯云 Redis 功能更全，支持数据结构更丰富

### References / 参考
- [腾讯云 Redis 文档](https://cloud.tencent.com/document/product/239)
- [ioredis GitHub](https://github.com/luin/ioredis)

---

## 3. WebSocket 实时通信 (Research Task 3)

### Decision / 决策
Phase 1（单人游戏）不需要实时通信。Phase 2（多人游戏）使用腾讯云 API Gateway WebSocket 协议，配合 SCF 函数和 Redis 管理连接状态。

### Rationale / 理由
- Phase 1 是单人 vs AI，无需实时通信
- 腾讯云 API Gateway 支持 WebSocket 协议，可自动管理连接生命周期
- Redis 用于存储 WebSocket 连接 ID 和玩家映射关系

### Implementation (Phase 2) / 实现（第2阶段）
```
[客户端] ←WebSocket→ [API Gateway] ←→ [SCF 函数]
                                    ↓
                                [Redis: 连接状态]
```

- **连接建立**: 客户端通过 WebSocket 连接到 API Gateway，触发 SCF 函数 `websocket-connect`
- **消息路由**: 客户端发送消息到 API Gateway，触发 SCF 函数 `websocket-message`
- **连接断开**: 客户端断开连接，触发 SCF 函数 `websocket-disconnect`

### Alternatives Considered / 考虑的替代方案
- **长轮询 (Long Polling)**：❌ 浪费资源，增加延迟
- **Socket.io 自建服务器**：❌ 违反宪法原则 I（Serverless-First）

### References / 参考
- [腾讯云 API Gateway WebSocket 文档](https://cloud.tencent.com/document/product/628/64543)

---

## 4. 前端游戏状态管理 (Research Task 4)

### Decision / 决策
使用模块化状态管理：将 `main.js` (44KB 单体) 重构为多个模块（`GameState.js`, `battle.js`, `resources.js`, `cards.js` 等）。使用事件驱动更新 UI。

### Rationale / 理由
- 单体 44KB 文件难以维护
- 模块化提高代码可读性和可测试性
- 事件驱动避免直接 DOM 操作，提高性能

### Implementation / 实现
```javascript
// GameState.js - 单一状态源
class GameState {
  constructor() {
    this.player = { population: 1000, gold: 0, food: 500, tokens: 10, ... };
    this.territories = [];
    this.cards = [];
    this.listeners = {};
  }

  // 事件系统
  on(event, callback) { this.listeners[event] = this.listeners[event] || []; this.listeners[event].push(callback); }
  emit(event, data) { (this.listeners[event] || []).forEach(cb => cb(data)); }

  // 状态更新（自动触发事件）
  updatePlayer(updates) {
    Object.assign(this.player, updates);
    this.emit('playerUpdated', this.player);
  }
}

// 全局实例
window.GameState = new GameState();

// battle.js - 战斗逻辑
function startBattle(territoryId) {
  // ... 战斗计算
  GameState.emit('battleCompleted', { result: 'win', territoryId });
}

// main.js - UI 更新（监听事件）
GameState.on('playerUpdated', (player) => updateResourceDisplay(player));
GameState.on('battleCompleted', (data) => showBattleResult(data));
```

### Alternatives Considered / 考虑的替代方案
- **使用 React/Vue**：❌ 当前项目是 Vanilla JS，引入框架增加打包体积
- **使用 Redux/Zustand**：❌ 过度设计，Vanilla JS 项目不需要

---

## 5. SVG 地图交互优化 (Research Task 5)

### Decision / 决策
使用 `viewBox` 操作实现缩放/平移（不操作 DOM 元素）。使用 `requestAnimationFrame` 实现平滑动画。对触摸事件使用被动监听器（passive listener）。

### Rationale / 理由
- 操作 `viewBox` 比缩放/移动单个 SVG 元素性能更好
- `requestAnimationFrame` 确保动画流畅（60fps）
- 被动监听器提高触摸事件响应速度

### Implementation / 实现
```javascript
// 缩放（操作 viewBox）
function zoomMap(delta) {
  const svg = document.getElementById('map-svg');
  const viewBox = svg.viewBox.baseVal;
  const zoomFactor = delta > 0 ? 1.1 : 0.9;
  viewBox.width *= zoomFactor;
  viewBox.height *= zoomFactor;
  // 保持缩放中心
  viewBox.x = mouseX - viewBox.width / 2;
  viewBox.y = mouseY - viewBox.height / 2;
}

// 平移动画（使用 requestAnimationFrame）
function panMap(dx, dy) {
  const svg = document.getElementById('map-svg');
  const viewBox = svg.viewBox.baseVal;
  function animate() {
    viewBox.x += dx * 0.1;
    viewBox.y += dy * 0.1;
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

// 触摸事件（被动监听器）
svg.addEventListener('touchstart', handleTouchStart, { passive: true });
svg.addEventListener('touchmove', handleTouchMove, { passive: true });
```

### Alternatives Considered / 考虑的替代方案
- **使用 Canvas 替代 SVG**：❌ Canvas 不支持 DOM 事件，需要实现点击检测
- **使用 WebGL (PixiJS)**：❌ 过度设计，SVG 足够满足 200+ 领土

---

## 6. 宪法原则检查（Post-Research）

### Principle III: Stateless Game Logic / 无状态游戏逻辑

**Status / 状态**: ✅ PASS（研究后）

**Clarification / 澄清**:
- 游戏状态不得存储在 SCF 函数内存中（宪法原则 III）
- ✅ 前端作为权威来源（`GameState.js`），后端仅用于持久化
- ✅ SCF 函数处理认证、数据持久化，不存储游戏状态
- ✅ Redis 仅用于 ephemeral 状态（活跃战斗、玩家会话），不存储完整游戏状态

### Principle IV: Security by Default / 默认安全

**Status / 状态**: ✅ PASS（研究后）

**Clarification / 澄清**:
- ✅ JWT 验证：所有 API 端点需要 `Authorization` header
- ✅ 输入验证：使用 `validator` 库验证用户输入
- ✅ SQL 参数化查询：使用 `mysql2` 预处理语句
- ✅ 密钥管理：数据库凭证、JWT 密钥存储在 SCF 环境变量中

### Principle VII: Real-Time Communication / 实时通信

**Status / 状态**: ✅ PASS（研究后）

**Clarification / 澄清**:
- ✅ Phase 1 是单人游戏，不需要实时通信
- ✅ Phase 2 使用腾讯云 API Gateway WebSocket 协议
- ✅ Redis 用于存储 WebSocket 连接状态

---

## Summary / 总结

所有 NEEDS CLARIFICATION 项目已解决：

| # | 研究任务 | 决策 | 状态 |
|---|---------|------|------|
| 1 | SCF 数据库连接池 | 全局初始化，池大小=1，优先使用官方 SDK | ✅ 完成 |
| 2 | Redis 集成 SCF | 全局初始化客户端，环境变量注入 | ✅ 完成 |
| 3 | WebSocket 实时通信 | Phase 2 使用 API Gateway WebSocket | ✅ 完成 |
| 4 | 前端游戏状态管理 | 模块化 + 事件驱动 | ✅ 完成 |
| 5 | SVG 地图交互优化 | viewBox 操作 + requestAnimationFrame | ✅ 完成 |

**Gate Decision / 门决策**: ✅ PASS - 所有宪法原则已通过，可以进入 Phase 1 设计。
