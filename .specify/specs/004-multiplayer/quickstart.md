# Quickstart: Multiplayer System / 多人游戏系统快速入门

**Feature / 功能**: Multiplayer System / 多人游戏系统
**Date / 日期**: 2026-06-27

---

## Prerequisites / 前置条件

Before implementing the multiplayer system, ensure you have:

在实现多人游戏系统之前，请确保你有：

1. **Tencent Cloud Account** with API Gateway and SCF access / 具有 API 网关和 SCF 访问权限的腾讯云账户
2. **Redis Instance** (Tencent Cloud Redis or local) / Redis 实例（腾讯云 Redis 或本地）
3. **Node.js 22.x** installed / 安装 Node.js 22.x
4. **SCF CLI** installed for local testing / 安装 SCF CLI 以进行本地测试

---

## Step 1: Set Up WebSocket Infrastructure / 第 1 步：设置 WebSocket 基础设施

### 1.1 Configure API Gateway / 1.1 配置 API 网关

1. Log in to Tencent Cloud Console / 登录腾讯云控制台
2. Navigate to API Gateway → Create API / 导航到 API 网关 → 创建 API
3. Select "WebSocket" as protocol / 选择"WebSocket"作为协议
4. Configure routes: / 配置路由：
   - `$connect` → `websocket-connect` SCF function / → `websocket-connect` SCF 函数
   - `$disconnect` → `websocket-disconnect` SCF function / → `websocket-disconnect` SCF 函数
   - `$default` → `websocket-message` SCF function / → `websocket-message` SCF 函数
5. Deploy API to "prod" stage / 将 API 部署到"prod"阶段

### 1.2 Set Up Redis / 1.2 设置 Redis

**Option A: Tencent Cloud Redis / 选项 A：腾讯云 Redis**
1. Navigate to Tencent Cloud Redis / 导航到腾讯云 Redis
2. Create instance (basic configuration) / 创建实例（基本配置）
3. Get connection details (host, port, password) / 获取连接详细信息（主机、端口、密码）
4. Add to SCF environment variables / 添加到 SCF 环境变量

**Option B: Local Redis (for development) / 选项 B：本地 Redis（用于开发）**
```bash
# Install Redis / 安装 Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis / 启动 Redis
redis-server
```

### 1.3 Create SCF Functions / 1.3 创建 SCF 函数

Create the following SCF functions: / 创建以下 SCF 函数：

#### `websocket-connect.js`
```javascript
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

exports.handler = async (event, context) => {
    const token = event.queryStringParameters?.token;
    
    // Validate JWT / 验证 JWT
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const playerId = decoded.playerId;
        
        // Store connection / 存储连接
        await redis.hset(`connection:${event.requestContext.connectionId}`, {
            playerId,
            connectedAt: Date.now(),
            lastHeartbeat: Date.now(),
            status: 'connected'
        });
        
        // Set TTL (1 hour) / 设置 TTL（1 小时）
        await redis.expire(`connection:${event.requestContext.connectionId}`, 3600);
        
        return { statusCode: 200, body: 'Connected' };
    } catch (err) {
        return { statusCode: 401, body: 'Unauthorized' };
    }
};
```

#### `websocket-disconnect.js`
```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

exports.handler = async (event, context) => {
    const connectionId = event.requestContext.connectionId;
    
    // Remove connection / 删除连接
    await redis.del(`connection:${connectionId}`);
    
    return { statusCode: 200, body: 'Disconnected' };
};
```

#### `websocket-message.js`
```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

exports.handler = async (event, context) => {
    const connectionId = event.requestContext.connectionId;
    const message = JSON.parse(event.body);
    
    // Route message based on type / 根据类型路由消息
    switch (message.type) {
        case 'battle_attack':
            // Handle battle attack / 处理战斗攻击
            break;
        case 'chat_send':
            // Handle chat message / 处理聊天消息
            break;
        case 'heartbeat':
            // Update heartbeat / 更新心跳
            await redis.hset(`connection:${connectionId}`, 'lastHeartbeat', Date.now());
            return {
                statusCode: 200,
                body: JSON.stringify({
                    type: 'heartbeat_ack',
                    payload: { serverTimestamp: Date.now() }
                })
            };
        default:
            return {
                statusCode: 400,
                body: JSON.stringify({
                    type: 'error',
                    payload: { code: 'INVALID_MESSAGE', message: 'Unknown message type' }
                })
            };
    }
};
```

---

## Step 2: Test WebSocket Connection / 第 2 步：测试 WebSocket 连接

### 2.1 Using wscat / 2.1 使用 wscat

```bash
# Install wscat / 安装 wscat
npm install -g wscat

# Connect to WebSocket / 连接到 WebSocket
wscat -c "wss://{api-gateway-url}/prod?token={jwt_token}"

# Send heartbeat / 发送心跳
{"type":"heartbeat","payload":{},"timestamp":1234567890}
```

### 2.2 Using Simple HTML Client / 2.2 使用简单的 HTML 客户端

Create `test-websocket.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test</title>
</head>
<body>
    <button onclick="connect()">Connect</button>
    <button onclick="sendHeartbeat()">Send Heartbeat</button>
    <div id="log"></div>
    
    <script>
        let ws;
        
        function connect() {
            ws = new WebSocket('wss://{api-gateway-url}/prod?token={jwt_token}');
            
            ws.onopen = () => {
                log('Connected');
            };
            
            ws.onmessage = (event) => {
                log('Received: ' + event.data);
            };
            
            ws.onclose = () => {
                log('Disconnected');
            };
        }
        
        function sendHeartbeat() {
            ws.send(JSON.stringify({
                type: 'heartbeat',
                payload: {},
                timestamp: Date.now()
            }));
        }
        
        function log(msg) {
            document.getElementById('log').innerHTML += '<br>' + msg;
        }
    </script>
</body>
</html>
```

---

## Step 3: Implement Battle System / 第 3 步：实现战斗系统

### 3.1 Create Battle Service / 3.1 创建战斗服务

Create `backend/services/BattleService.js`:

```javascript
const Redis = require('ioredis');
const WebSocketService = require('./WebSocketService');

const redis = new Redis(process.env.REDIS_URL);

class BattleService {
    static async startBattle(attackerId, defenderId, territoryId) {
        // Create battle record / 创建战斗记录
        const battleId = 'battle_' + Date.now();
        const battle = {
            id: battleId,
            attackerId,
            defenderId,
            territoryId,
            startTime: Date.now(),
            status: 'ongoing'
        };
        
        // Store in Redis / 存储在 Redis 中
        await redis.hset(`battle:${battleId}`, battle);
        await redis.expire(`battle:${battleId}`, 600); // TTL 10 minutes
        
        // Notify defender / 通知防御者
        await WebSocketService.sendToPlayer(defenderId, {
            type: 'battle_started',
            payload: battle
        });
        
        // Start battle calculation (simplified) / 开始战斗计算（简化）
        this.calculateBattle(battleId);
        
        return battle;
    }
    
    static async calculateBattle(battleId) {
        // Simplified battle calculation / 简化的战斗计算
        const battle = await redis.hgetall(`battle:${battleId}`);
        
        // Simulate battle (in real implementation, use proper formula) / 模拟战斗（在实际实现中，使用正确的公式）
        const attackerWin = Math.random() > 0.5;
        
        const result = {
            battleId,
            status: attackerWin ? 'attacker_wins' : 'defender_wins',
            territoryId: battle.territoryId,
            newOwnerId: attackerWin ? battle.attackerId : battle.defenderId
        };
        
        // Update battle status / 更新战斗状态
        await redis.hset(`battle:${battleId}`, 'status', result.status);
        
        // Notify both players / 通知两个玩家
        await WebSocketService.sendToPlayer(battle.attackerId, {
            type: 'battle_result',
            payload: result
        });
        await WebSocketService.sendToPlayer(battle.defenderId, {
            type: 'battle_result',
            payload: result
        });
    }
}

module.exports = BattleService;
```

---

## Step 4: Implement Chat System / 第 4 步：实现聊天系统

### 4.1 Create Chat Service / 4.1 创建聊天服务

Create `backend/services/ChatService.js`:

```javascript
const Redis = require('ioredis');
const WebSocketService = require('./WebSocketService');

const redis = new Redis(process.env.REDIS_URL);

class ChatService {
    static async sendMessage(senderId, channel, content) {
        // Validate / 验证
        if (content.length > 500) {
            throw new Error('Message too long');
        }
        
        // Rate limiting / 速率限制
        const rateKey = `ratelimit:${senderId}:chat`;
        const count = await redis.incr(rateKey);
        if (count === 1) {
            await redis.expire(rateKey, 60); // Reset every 60 seconds
        }
        if (count > 10) {
            throw new Error('Rate limit exceeded');
        }
        
        // Create message / 创建消息
        const message = {
            id: 'msg_' + Date.now(),
            senderId,
            content,
            timestamp: Date.now()
        };
        
        // Store in Redis (last 100 messages) / 存储在 Redis 中（最后 100 条消息）
        await redis.lpush(`chat:${channel}`, JSON.stringify(message));
        await redis.ltrim(`chat:${channel}`, 0, 99);
        await redis.expire(`chat:${channel}`, 86400); // TTL 24 hours
        
        // Send to channel / 发送到频道
        await WebSocketService.sendToChannel(channel, {
            type: 'chat_message',
            payload: message
        });
        
        return message;
    }
}

module.exports = ChatService;
```

---

## Step 5: Test Multiplayer Features / 第 5 步：测试多人游戏功能

### 5.1 Test PvP Battle / 5.1 测试 PvP 战斗

1. Open two browser windows (Player A and Player B) / 打开两个浏览器窗口（玩家 A 和玩家 B）
2. Connect both to WebSocket / 将两个都连接到 WebSocket
3. Player A attacks Player B's territory / 玩家 A 攻击玩家 B 的领土
4. Verify both players receive battle notifications / 验证两个玩家都收到战斗通知

### 5.2 Test Chat / 5.2 测试聊天

1. Player A sends global message / 玩家 A 发送全局消息
2. Verify Player B receives it / 验证玩家 B 收到它
3. Test rate limiting (send 11 messages in 1 minute) / 测试速率限制（1 分钟内发送 11 条消息）

---

## Next Steps / 下一步

1. Implement alliance system (see `spec.md`) / 实现联盟系统（参见 `spec.md`）
2. Implement leaderboard system (see `spec.md`) / 实现排行榜系统（参见 `spec.md`）
3. Implement game room system (see `spec.md`) / 实现游戏房间系统（参见 `spec.md`）
4. Load test with multiple concurrent players / 使用多个并发玩家进行负载测试
5. Deploy to production / 部署到生产环境

---

## Troubleshooting / 故障排除

### WebSocket Connection Fails / WebSocket 连接失败

**Problem / 问题**: 401 Unauthorized / 401 未授权
**Solution / 解决方案**: Check JWT token is valid and not expired. Verify `JWT_SECRET` in SCF environment variables. / 检查 JWT 令牌是否有效且未过期。验证 SCF 环境变量中的 `JWT_SECRET`。

### Redis Connection Fails / Redis 连接失败

**Problem / 问题**: Cannot connect to Redis / 无法连接到 Redis
**Solution / 解决方案**: Verify Redis URL in SCF environment variables. Check network connectivity. / 验证 SCF 环境变量中的 Redis URL。检查网络连接。

### Messages Not Delivered / 消息未传递

**Problem / 问题**: Messages sent but not received / 消息已发送但未收到
**Solution / 解决方案**: Check API Gateway WebSocket route configuration. Verify SCF function logs. / 检查 API 网关 WebSocket 路由配置。验证 SCF 函数日志。

---

**Author / 作者**: AI Assistant
**Date / 日期**: 2026-06-27
**Status / 状态**: Complete / 完成
