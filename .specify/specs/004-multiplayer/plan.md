# Implementation Plan: Multiplayer System / 多人游戏系统实施计划

**Feature / 功能**: Multiplayer System / 多人游戏系统
**Branch / 分支**: `feat/multiplayer-system`
**Created / 创建日期**: 2026-06-27
**Estimated Total Time / 预计总时间**: 29 hours / 29 小时

---

## Overview / 概述

This plan outlines the implementation of the multiplayer system for WarXOne, including real-time communication infrastructure, PvP battles, alliance system, chat system, leaderboards, and game rooms. The implementation follows the project constitution's principles, particularly Principle VII (Real-Time Communication).

本计划概述了 WarXOne 多人游戏系统的实现，包括实时通信基础设施、PvP 战斗、联盟系统、聊天系统、排行榜和游戏房间。实现遵循项目宪法的原则，特别是原则 VII（实时通信）。

---

## Prerequisites / 前置条件

Before starting implementation, ensure the following are set up:

在开始实现之前，请确保已设置以下内容：

1. **Tencent Cloud API Gateway (WebSocket)** configured / 配置腾讯云 API 网关（WebSocket）
2. **Redis instance** running and accessible / Redis 实例运行并可访问
3. **JWT token validation** working in existing SCF functions / JWT 令牌验证在现有 SCF 函数中工作
4. **Frontend build system** (Vite) configured for new modules / 前端构建系统（Vite）已配置用于新模块

---

## Phase 1: WebSocket Infrastructure (Priority: P1) / 第 1 阶段：WebSocket 基础设施（优先级：P1）

**Estimated Time / 预计时间**: 4 hours / 4 小时

### Tasks / 任务

- [ ] **Task 1.1**: Set up Tencent Cloud API Gateway with WebSocket support / 设置腾讯云 API 网关，支持 WebSocket
  - Configure WebSocket route in API Gateway / 在 API 网关中配置 WebSocket 路由
  - Test WebSocket connection using wscat or similar tool / 使用 wscat 或类似工具测试 WebSocket 连接

- [ ] **Task 1.2**: Implement `backend/functions/websocket-connect.js` / 实现 `backend/functions/websocket-connect.js`
  - Validate JWT token from query parameters / 验证来自查询参数的 JWT 令牌
  - Store connection state in Redis / 在 Redis 中存储连接状态
  - Return 401 if token invalid / 如果令牌无效，返回 401

- [ ] **Task 1.3**: Implement `backend/functions/websocket-disconnect.js` / 实现 `backend/functions/websocket-disconnect.js`
  - Remove connection state from Redis / 从 Redis 中删除连接状态
  - Update player online status / 更新玩家在线状态
  - Notify allies (optional) / 通知盟友（可选）

- [ ] **Task 1.4**: Implement `backend/functions/websocket-message.js` / 实现 `backend/functions/websocket-message.js`
  - Parse incoming WebSocket message / 解析传入的 WebSocket 消息
  - Route message to appropriate handler based on `type` / 根据 `type` 将消息路由到适当的处理程序
  - Validate message format and content / 验证消息格式和内容

- [ ] **Task 1.5**: Create `backend/services/WebSocketService.js` / 创建 `backend/services/WebSocketService.js`
  - `sendToPlayer(playerId, message)` - Send message to specific player / 向特定玩家发送消息
  - `sendToChannel(channel, message)` - Send message to channel / 向频道发送消息
  - `broadcast(message)` - Send to all connected players / 发送给所有连接的玩家
  - `validateToken(token)` - Validate JWT token / 验证 JWT 令牌

- [ ] **Task 1.6**: Create `backend/services/RedisService.js` / 创建 `backend/services/RedisService.js`
  - `setConnection(connectionId, data)` - Store connection state / 存储连接状态
  - `getConnection(connectionId)` - Retrieve connection state / 检索连接状态
  - `removeConnection(connectionId)` - Remove connection state / 删除连接状态
  - `setPlayerOnline(playerId, status)` - Set player online status / 设置玩家在线状态
  - `isPlayerOnline(playerId)` - Check if player is online / 检查玩家是否在线

- [ ] **Task 1.7**: Test WebSocket connection / 测试 WebSocket 连接
  - Use simple HTML/JS client to connect / 使用简单的 HTML/JS 客户端连接
  - Verify connection state stored in Redis / 验证连接状态存储在 Redis 中
  - Verify disconnection handled correctly / 验证断开连接正确处理

---

## Phase 2: Real-time PvP Battle System (Priority: P1) / 第 2 阶段：实时 PvP 战斗系统（优先级：P1）

**Estimated Time / 预计时间**: 6 hours / 6 小时

### Tasks / 任务

- [ ] **Task 2.1**: Create `backend/services/BattleService.js` / 创建 `backend/services/BattleService.js`
  - `startBattle(attackerId, defenderId, territoryId)` - Start PvP battle / 开始 PvP 战斗
  - `calculateBattle(attackerId, defenderId, territoryId)` - Authoritative battle calculation / 权威战斗计算
  - `retreatBattle(battleId, playerId)` - Retreat from battle / 从战斗撤退
  - `getBattleStatus(battleId)` - Get battle status / 获取战斗状态

- [ ] **Task 2.2**: Implement `backend/functions/battle-start.js` / 实现 `backend/functions/battle-start.js`
  - Validate attack is legal (territory adjacent, player has military) / 验证攻击是否合法（领土相邻，玩家有军事单位）
  - Call `BattleService.startBattle()` / 调用 `BattleService.startBattle()`
  - Return battle ID and initial status / 返回战斗 ID 和初始状态

- [ ] **Task 2.3**: Implement `backend/functions/battle-update.js` / 实现 `backend/functions/battle-update.js`
  - Handle battle progress updates / 处理战斗进度更新
  - Push updates to both players via WebSocket / 通过 WebSocket 向两个玩家推送更新

- [ ] **Task 2.4**: Implement `backend/functions/battle-retreat.js` / 实现 `backend/functions/battle-retreat.js`
  - Handle retreat request / 处理撤退请求
  - Calculate retreat penalty (49.9% chance defender wins) / 计算撤退惩罚（49.9% 几率防御者获胜）

- [ ] **Task 2.5**: Create `frontend/src/game/BattleManager.js` / 创建 `frontend/src/game/BattleManager.js`
  - Handle incoming battle notifications / 处理传入的战斗通知
  - Display battle progress animation / 显示战斗进度动画
  - Handle battle result / 处理战斗结果

- [ ] **Task 2.6**: Update `frontend/src/main.js` to integrate battle system / 更新 `frontend/src/main.js` 以集成战斗系统
  - Add "Attack" button for adjacent enemy territories / 为相邻的敌方领土添加"攻击"按钮
  - Call `battle-start.js` when attacking / 攻击时调用 `battle-start.js`
  - Display battle notification when under attack / 被攻击时显示战斗通知

- [ ] **Task 2.7**: Test PvP battle with 2 clients / 使用 2 个客户端测试 PvP 战斗
  - Player A attacks Player B / 玩家 A 攻击玩家 B
  - Verify both players see real-time battle progress / 验证两个玩家都看到实时战斗进度
  - Verify battle result syncs correctly / 验证战斗结果正确同步

---

## Phase 3: Alliance System (Priority: P1) / 第 3 阶段：联盟系统（优先级：P1）

**Estimated Time / 预计时间**: 5 hours / 5 小时

### Tasks / 任务

- [ ] **Task 3.1**: Create `backend/services/AllianceService.js` / 创建 `backend/services/AllianceService.js`
  - `sendRequest(fromPlayerId, toPlayerId)` - Send alliance request / 发送联盟请求
  - `acceptRequest(requestId)` - Accept alliance request / 接受联盟请求
  - `declineRequest(requestId)` - Decline alliance request / 拒绝联盟请求
  - `leaveAlliance(allianceId, playerId)` - Leave alliance / 离开联盟
  - `disbandAlliance(allianceId)` - Disband alliance / 解散联盟
  - `getAlliance(allianceId)` - Get alliance details / 获取联盟详情
  - `getPlayerAlliance(playerId)` - Get player's alliance / 获取玩家的联盟

- [ ] **Task 3.2**: Implement `backend/functions/alliance-request.js` / 实现 `backend/functions/alliance-request.js`
  - Send alliance request to another player / 向另一个玩家发送联盟请求
  - Store request in MySQL / 在 MySQL 中存储请求
  - Notify target player via WebSocket / 通过 WebSocket 通知目标玩家

- [ ] **Task 3.3**: Implement `backend/functions/alliance-respond.js` / 实现 `backend/functions/alliance-respond.js`
  - Accept or decline alliance request / 接受或拒绝联盟请求
  - Create alliance record in MySQL / 在 MySQL 中创建联盟记录
  - Notify requester via WebSocket / 通过 WebSocket 通知请求者

- [ ] **Task 3.4**: Implement `backend/functions/alliance-leave.js` / 实现 `backend/functions/alliance-leave.js`
  - Leave alliance / 离开联盟
  - Notify other alliance members via WebSocket / 通过 WebSocket 通知其他联盟成员

- [ ] **Task 3.5**: Implement shared vision in `GameState.js` / 在 `GameState.js` 中实现共享视野
  - When players are allied, show ally's territories on map / 当玩家结盟时，在地图上显示盟友的领土
  - Update map rendering to show ally territories / 更新地图渲染以显示盟友领土

- [ ] **Task 3.6**: Implement resource sharing / 实现资源共享
  - Add "Share Resources" button in alliance UI / 在联盟 UI 中添加"共享资源"按钮
  - Call SCF function to transfer resources / 调用 SCF 函数转移资源
  - Notify recipient via WebSocket / 通过 WebSocket 通知接收者

- [ ] **Task 3.7**: Create alliance UI in frontend / 在前端创建联盟 UI
  - Alliance management page / 联盟管理页面
  - Alliance chat (reuse chat system) / 联盟聊天（重用聊天系统）
  - Shared vision toggle / 共享视野切换

- [ ] **Task 3.8**: Test alliance system / 测试联盟系统
  - Player A sends alliance request to Player B / 玩家 A 向玩家 B 发送联盟请求
  - Player B accepts / 玩家 B 接受
  - Verify shared vision works / 验证共享视野工作
  - Test resource sharing / 测试资源共享
  - Test alliance chat / 测试联盟聊天

---

## Phase 4: Chat System (Priority: P2) / 第 4 阶段：聊天系统（优先级：P2）

**Estimated Time / 预计时间**: 4 hours / 4 小时

### Tasks / 任务

- [ ] **Task 4.1**: Create `backend/services/ChatService.js` / 创建 `backend/services/ChatService.js`
  - `sendMessage(senderId, channel, content)` - Send chat message / 发送聊天消息
  - `getHistory(channel, limit)` - Get chat history / 获取聊天历史
  - `filterProfanity(content)` - Filter profanity / 过滤亵渎性内容
  - `checkRateLimit(playerId)` - Check rate limit / 检查速率限制

- [ ] **Task 4.2**: Implement `backend/functions/chat-send.js` / 实现 `backend/functions/chat-send.js`
  - Validate message (length, content) / 验证消息（长度、内容）
  - Check rate limit (10 messages/minute) / 检查速率限制（10 条消息/分钟）
  - Filter profanity / 过滤亵渎性内容
  - Store in Redis (last 100 messages per channel) / 存储在 Redis 中（每个频道最后 100 条消息）
  - Send to channel via WebSocket / 通过 WebSocket 发送到频道

- [ ] **Task 4.3**: Implement `backend/functions/chat-history.js` / 实现 `backend/functions/chat-history.js`
  - Retrieve last 100 messages from Redis / 从 Redis 检索最后 100 条消息
  - Return as JSON array / 作为 JSON 数组返回

- [ ] **Task 4.4**: Create `frontend/src/components/ChatWindow.js` / 创建 `frontend/src/components/ChatWindow.js`
  - Chat window UI with channel tabs / 带有频道选项卡的聊天窗口 UI
  - Message input with send button / 带发送按钮的消息输入框
  - Auto-scroll to latest message / 自动滚动到最新消息
  - Display online status of players / 显示玩家的在线状态

- [ ] **Task 4.5**: Integrate chat with WebSocket / 集成聊天与 WebSocket
  - Listen for `chat_message` events / 监听 `chat_message` 事件
  - Display incoming messages in chat window / 在聊天窗口中显示传入的消息
  - Send messages via WebSocket / 通过 WebSocket 发送消息

- [ ] **Task 4.6**: Test chat system / 测试聊天系统
  - Player A sends global message / 玩家 A 发送全局消息
  - Player B sees it in global chat / 玩家 B 在全局聊天中看到它
  - Test alliance-only chat / 测试仅联盟聊天
  - Test private chat / 测试私聊
  - Verify message history loads correctly / 验证消息历史正确加载

---

## Phase 5: Leaderboard System (Priority: P2) / 第 5 阶段：排行榜系统（优先级：P2）

**Estimated Time / 预计时间**: 3 hours / 3 小时

### Tasks / 任务

- [ ] **Task 5.1**: Create `backend/services/LeaderboardService.js` / 创建 `backend/services/LeaderboardService.js`
  - `calculateLeaderboard(category, timeframe)` - Calculate leaderboard / 计算排行榜
  - `getLeaderboard(category, timeframe, limit)` - Get leaderboard / 获取排行榜
  - `getPlayerRank(playerId, category, timeframe)` - Get player's rank / 获取玩家的排名

- [ ] **Task 5.2**: Implement `backend/functions/leaderboard-get.js` / 实现 `backend/functions/leaderboard-get.js`
  - Accept `category` and `timeframe` parameters / 接受 `category` 和 `timeframe` 参数
  - Return top 100 players from Redis cache / 从 Redis 缓存返回前 100 名玩家
  - If cache miss, calculate leaderboard / 如果缓存未命中，计算排行榜

- [ ] **Task 5.3**: Set up SCF cron job for leaderboard calculation / 设置 SCF 定时任务以计算排行榜
  - Run every 60 seconds / 每 60 秒运行一次
  - Calculate all leaderboards (4 categories × 3 timeframes = 12 leaderboards) / 计算所有排行榜（4 个类别 × 3 个时间范围 = 12 个排行榜）
  - Store results in Redis / 将结果存储在 Redis 中

- [ ] **Task 5.4**: Create leaderboard UI in frontend / 在前端创建排行榜 UI
  - Leaderboard page with category tabs / 带有类别选项卡的排行榜页面
  - Display top 100 players with stats / 显示前 100 名玩家及其统计数据
  - Highlight current player's rank / 突出显示当前玩家的排名

- [ ] **Task 5.5**: Test leaderboard system / 测试排行榜系统
  - Conquer territories, check leaderboard updates / 征服领土，检查排行榜更新
  - Verify rank calculation / 验证排名计算
  - Test different categories / 测试不同类别
  - Test time-based leaderboards / 测试基于时间的排行榜

---

## Phase 6: Game Room System (Priority: P3) / 第 6 阶段：游戏房间系统（优先级：P3）

**Estimated Time / 预计时间**: 4 hours / 4 小时

### Tasks / 任务

- [ ] **Task 6.1**: Create `backend/services/RoomService.js` / 创建 `backend/services/RoomService.js`
  - `createRoom(hostId, settings)` - Create game room / 创建游戏房间
  - `joinRoom(roomCode, playerId)` - Join room by code / 通过代码加入房间
  - `leaveRoom(roomId, playerId)` - Leave room / 离开房间
  - `startGame(roomId, hostId)` - Start game / 开始游戏
  - `getRoom(roomId)` - Get room details / 获取房间详情

- [ ] **Task 6.2**: Implement `backend/functions/room-create.js` / 实现 `backend/functions/room-create.js`
  - Create room with unique code / 创建带有唯一代码的房间
  - Store room settings (map, max players, victory conditions) / 存储房间设置（地图、最大玩家数、胜利条件）
  - Store in Redis with TTL of 1 hour / 存储在 Redis 中，TTL 为 1 小时

- [ ] **Task 6.3**: Implement `backend/functions/room-join.js` / 实现 `backend/functions/room-join.js`
  - Validate room code / 验证房间代码
  - Add player to room / 将玩家添加到房间
  - Notify other room members via WebSocket / 通过 WebSocket 通知其他房间成员

- [ ] **Task 6.4**: Implement `backend/functions/room-leave.js` / 实现 `backend/functions/room-leave.js`
  - Remove player from room / 从房间中删除玩家
  - If host leaves, assign new host / 如果主持人离开，分配新主持人
  - If no members left, disband room / 如果没有成员留下，解散房间

- [ ] **Task 6.5**: Implement `backend/functions/room-start.js` / 实现 `backend/functions/room-start.js`
  - Validate host is starting / 验证主持人正在开始
  - Change room status to "in_game" / 将房间状态更改为"游戏中"
  - Notify all room members to start game / 通知所有房间成员开始游戏

- [ ] **Task 6.6**: Create room UI in frontend / 在前端创建房间 UI
  - Room creation page with custom settings / 带有自定义设置的房间创建页面
  - Room lobby with member list and chat / 带有成员列表和聊天的房间大厅
  - "Start Game" button (visible only to host) / "开始游戏"按钮（仅主持人可见）

- [ ] **Task 6.7**: Test game room system / 测试游戏房间系统
  - Player A creates room / 玩家 A 创建房间
  - Player A shares room code / 玩家 A 分享房间代码
  - Player B joins using code / 玩家 B 使用代码加入
  - Test room chat / 测试房间聊天
  - Test game start / 测试游戏开始

---

## Phase 7: Integration Testing & Optimization (Priority: P2) / 第 7 阶段：集成测试与优化（优先级：P2）

**Estimated Time / 预计时间**: 3 hours / 3 小时

### Tasks / 任务

- [ ] **Task 7.1**: Integration testing / 集成测试
  - Test all multiplayer features together / 一起测试所有多人游戏功能
  - Verify WebSocket messages flow correctly / 验证 WebSocket 消息正确流动
  - Test edge cases (disconnects, reconnections) / 测试边界情况（断开连接、重新连接）

- [ ] **Task 7.2**: Load testing / 负载测试
  - Simulate 100 concurrent players / 模拟 100 个并发玩家
  - Measure WebSocket message delivery time / 测量 WebSocket 消息传递时间
  - Measure leaderboard calculation time / 测量排行榜计算时间
  - Identify bottlenecks / 识别瓶颈

- [ ] **Task 7.3**: Bug fixing / 修复错误
  - Fix any bugs found during testing / 修复测试期间发现的任何错误
  - Test edge cases again / 再次测试边界情况

- [ ] **Task 7.4**: Performance optimization / 性能优化
  - Optimize Redis queries / 优化 Redis 查询
  - Optimize WebSocket message size / 优化 WebSocket 消息大小
  - Add caching where appropriate / 在适当的地方添加缓存

---

## Database Schema Changes / 数据库架构更改

See `data-model.md` for detailed schema changes.

有关详细的架构更改，请参阅 `data-model.md`。

---

## API Contracts / API 契约

See `contracts/` directory for detailed API contracts.

有关详细的 API 契约，请参阅 `contracts/` 目录。

---

## Risks & Mitigation / 风险与缓解措施

| Risk / 风险 | Mitigation / 缓解措施 |
|-------------|----------------------|
| WebSocket connection limits on API Gateway / API 网关上的 WebSocket 连接限制 | Use connection pooling, implement reconnection logic / 使用连接池，实现重新连接逻辑 |
| Redis memory exhaustion / Redis 内存耗尽 | Set TTL on all keys, monitor memory usage / 在所有键上设置 TTL，监控内存使用 |
| Real-time message delay / 实时消息延迟 | Optimize SCF function performance, use Redis for fast access / 优化 SCF 函数性能，使用 Redis 快速访问 |
| Battle calculation cheating / 战斗计算作弊 | Authoritative server model (all calculation on server) / 权威服务器模型（所有计算都在服务器上） |
| Chat spam / 聊天垃圾邮件 | Rate limiting, profanity filter, report system / 速率限制、亵渎过滤器、举报系统 |

---

## Success Criteria / 成功标准

- [ ] WebSocket connection established within 3 seconds / WebSocket 连接在 3 秒内建立
- [ ] Real-time battle notification delivered within 500ms / 实时战斗通知在 500ms 内传递
- [ ] Chat message delivered within 1 second / 聊天消息在 1 秒内传递
- [ ] Leaderboard calculation completes within 5 seconds / 排行榜计算在 5 秒内完成
- [ ] System supports 100 concurrent WebSocket connections / 系统支持 100 个并发 WebSocket 连接
- [ ] 95% of real-time messages delivered successfully / 95% 的实时消息成功传递

---

## Sign-off / 签核

- [ ] Code review completed / 代码审查完成
- [ ] All tests pass / 所有测试通过
- [ ] Performance benchmarks met / 达到性能基准
- [ ] Documentation updated / 文档已更新
- [ ] Deployed to staging environment / 部署到预发布环境
- [ ] Tested in staging environment / 在预发布环境中测试
- [ ] Approved for production deployment / 批准生产部署
