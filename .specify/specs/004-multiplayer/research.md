# Research: Multiplayer System / 多人游戏系统研究

**Feature / 功能**: Multiplayer System / 多人游戏系统
**Date / 日期**: 2026-06-27

---

## 1. Real-Time Communication Technologies / 实时通信技术

### Options Considered / 考虑的选项中

#### Option A: Tencent Cloud API Gateway (WebSocket) / 选项 A：腾讯云 API 网关（WebSocket）
- **Pros / 优点**:
  - Managed service, no infrastructure to maintain / 托管服务，无需维护基础设施
  - Auto-scaling built-in / 内置自动扩展
  - Integrated with SCF / 与 SCF 集成
  - Supports WebSocket protocol / 支持 WebSocket 协议
  - Compliant with project constitution (Principle VII) / 符合项目宪法（原则 VII）

- **Cons / 缺点**:
  - Vendor lock-in to Tencent Cloud / 供应商锁定到腾讯云
  - WebSocket connection limits (need to verify) / WebSocket 连接限制（需要验证）
  - Cold start latency for SCF functions / SCF 函数的冷启动延迟

- **Decision / 决定**: ✅ **SELECTED** - Recommended by project constitution. / 选定 - 项目宪法推荐。

#### Option B: Self-hosted WebSocket Server (e.g., Node.js + ws library) / 选项 B：自托管 WebSocket 服务器（例如，Node.js + ws 库）
- **Pros / 优点**:
  - Full control over server / 完全控制服务器
  - No vendor lock-in / 无供应商锁定
  - Can optimize for specific use case / 可以针对特定用例进行优化

- **Cons / 缺点**:
  - Requires infrastructure management / 需要基础设施管理
  - Must implement auto-scaling / 必须实现自动扩展
  - Not serverless (violates Principle I) / 不是无服务器的（违反原则 I）
  - Higher operational complexity / 更高的操作复杂性

- **Decision / 决定**: ❌ **REJECTED** - Violates serverless-first principle. / 拒绝 - 违反无服务器优先原则。

#### Option C: Third-party WebSocket Service (e.g., Pusher, Ably) / 选项 C：第三方 WebSocket 服务（例如，Pusher、Ably）
- **Pros / 优点**:
  - Managed service / 托管服务
  - SDKs available for multiple platforms / 适用于多个平台的 SDK
  - Built-in features (presence, history) / 内置功能（在线状态、历史记录）

- **Cons / 缺点**:
  - Additional cost / 额外成本
  - Not integrated with Tencent Cloud ecosystem / 未与腾讯云生态系统集成
  - Data privacy concerns (data leaves Tencent Cloud) / 数据隐私问题（数据离开腾讯云）

- **Decision / 决定**: ❌ **REJECTED** - Not aligned with project architecture. / 拒绝 - 与项目架构不一致。

---

## 2. In-Memory Cache for Connection State / 用于连接状态的内存缓存

### Options Considered / 考虑的选项中

#### Option A: Redis / 选项 A：Redis
- **Pros / 优点**:
  - Fast read/write (sub-millisecond latency) / 快速读取/写入（亚毫秒延迟）
  - Built-in data structures (hash, list, set) / 内置数据结构（哈希、列表、集合）
  - TTL support for automatic expiration / 支持 TTL 以自动过期
  - Pub/Sub for real-time messaging / 用于实时消息传递的发布/订阅
  - Compliant with project constitution (Principle III) / 符合项目宪法（原则 III）

- **Cons / 缺点**:
  - Additional service to manage / 需要管理的额外服务
  - Cost (Tencent Cloud Redis instance) / 成本（腾讯云 Redis 实例）

- **Decision / 决定**: ✅ **SELECTED** - Recommended by project constitution. / 选定 - 项目宪法推荐。

#### Option B: Memcached / 选项 B：Memcached
- **Pros / 优点**:
  - Simple key-value store / 简单的键值存储
  - Fast / 快速

- **Cons / 缺点**:
  - No data structure support / 无数据结构支持
  - No TTL support / 无 TTL 支持
  - No Pub/Sub / 无发布/订阅

- **Decision / 决定**: ❌ **REJECTED** - Less feature-rich than Redis. / 拒绝 - 功能不如 Redis 丰富。

#### Option C: SCF Function Memory / 选项 C：SCF 函数内存
- **Pros / 优点**:
  - No additional service needed / 不需要额外服务
  - Fast (in-memory) / 快速（内存中）

- **Cons / 缺点**:
  - Violates Principle III (game state MUST NOT be stored in SCF memory) / 违反原则 III（游戏状态不得存储在 SCF 内存中）
  - Not shared across function invocations / 不在函数调用之间共享
  - Lost on function restart / 函数重启时丢失

- **Decision / 决定**: ❌ **REJECTED** - Violates project constitution. / 拒绝 - 违反项目宪法。

---

## 3. Battle Calculation Model / 战斗计算模型

### Options Considered / 考虑的选项中

#### Option A: Authoritative Server (SCF) / 选项 A：权威服务器（SCF）
- **Pros / 优点**:
  - Prevents cheating / 防止作弊
  - Single source of truth / 单一事实来源
  - Clients only display animation / 客户端仅显示动画

- **Cons / 缺点**:
  - Higher latency (client → SCF → client) / 更高延迟（客户端 → SCF → 客户端）
  - SCF cold start impact / SCF 冷启动影响

- **Decision / 决定**: ✅ **SELECTED** - Required for fair gameplay. / 选定 - 公平游戏所需。

#### Option B: Client-Side Calculation / 选项 B：客户端计算
- **Pros / 优点**:
  - Lower latency / 更低延迟
  - Reduced server load / 减少服务器负载

- **Cons / 缺点**:
  - Easy to cheat (modify client code) / 容易作弊（修改客户端代码）
  - Clients may have different results / 客户端可能有不同的结果

- **Decision / 决定**: ❌ **REJECTED** - Not secure for PvP. / 拒绝 - 对 PvP 不安全。

#### Option C: Hybrid (Client predicts, Server validates) / 选项 C：混合（客户端预测，服务器验证）
- **Pros / 优点**:
  - Lower perceived latency / 更低的可感知延迟
  - Still secure (server validates) / 仍然安全（服务器验证）

- **Cons / 缺点**:
  - More complex to implement / 实现更复杂
  - May have prediction errors / 可能有预测错误

- **Decision / 决定**: ⚠️ **CONSIDER FOR FUTURE** - Phase 2 implementation can use simpler authoritative model. / 考虑未来 - 第 2 阶段实现可以使用更简单的权威模型。

---

## 4. Chat Message Storage / 聊天消息存储

### Options Considered / 考虑的选项中

#### Option A: Redis (last 100 messages per channel) / 选项 A：Redis（每个频道最后 100 条消息）
- **Pros / 优点**:
  - Fast access / 快速访问
  - Automatic expiration (optional) / 自动过期（可选）
  - Sufficient for most use cases / 对大多数用例足够

- **Cons / 缺点**:
  - Limited history (only last 100 messages) / 历史记录有限（仅最后 100 条消息）
  - Not persistent (lost on Redis restart) / 不持久（Redis 重启时丢失）

- **Decision / 决定**: ✅ **SELECTED** - Good enough for MVP. / 选定 - 对 MVP 足够好。

#### Option B: MySQL (all messages) / 选项 B：MySQL（所有消息）
- **Pros / 优点**:
  - Persistent storage / 持久存储
  - Can retrieve full history / 可以检索完整历史记录

- **Cons / 缺点**:
  - Slower access / 访问较慢
  - Increased database load / 增加数据库负载
  - Most players don't need full history / 大多数玩家不需要完整历史记录

- **Decision / 决定**: ⚠️ **FUTURE ENHANCEMENT** - Can add MySQL backup for message persistence. / 未来增强 - 可以添加 MySQL 备份以持久保存消息。

#### Option C: Hybrid (Redis + MySQL) / 选项 C：混合（Redis + MySQL）
- **Pros / 优点**:
  - Fast access for recent messages (Redis) / 快速访问最近的消息（Redis）
  - Persistent storage for all messages (MySQL) / 所有消息的持久存储（MySQL）

- **Cons / 缺点**:
  - More complex / 更复杂
  - Increased cost (Redis + MySQL) / 增加成本（Redis + MySQL）

- **Decision / 决定**: ⚠️ **FUTURE ENHANCEMENT** - Not needed for MVP. / 未来增强 - MVP 不需要。

---

## 5. Leaderboard Calculation / 排行榜计算

### Options Considered / 考虑的选项中

#### Option A: Real-Time Calculation (on demand) / 选项 A：实时计算（按需）
- **Pros / 优点**:
  - Always up-to-date / 始终最新
  - No cron job needed / 不需要定时任务

- **Cons / 缺点**:
  - High latency for first request / 第一个请求的高延迟
  - Repeated calculations for same data / 相同数据的重复计算

- **Decision / 决定**: ❌ **REJECTED** - Not efficient. / 拒绝 - 效率不高。

#### Option B: Pre-Calculated (cron job every 60s) / 选项 B：预计算（定时任务每 60 秒）
- **Pros / 优点**:
  - Fast access (read from cache) / 快速访问（从缓存读取）
  - Reduced computation / 减少计算

- **Cons / 缺点**:
  - Not real-time (up to 60s delay) / 不是实时（最多 60 秒延迟）
  - Cron job infrastructure needed / 需要定时任务基础设施

- **Decision / 决定**: ✅ **SELECTED** - Good balance of performance and freshness. / 选定 - 性能和新鲜度之间的良好平衡。

#### Option C: Event-Driven (recalculate on relevant events) / 选项 C：事件驱动（在相关事件上重新计算）
- **Pros / 优点**:
  - More real-time than cron job / 比定时任务更实时
  - Only recalculate when needed / 仅在需要时重新计算

- **Cons / 缺点**:
  - More complex to implement / 实现更复杂
  - May have race conditions / 可能有竞争条件

- **Decision / 决定**: ⚠️ **FUTURE ENHANCEMENT** - Can optimize in future. / 未来增强 - 未来可以优化。

---

## 6. Game Room Management / 游戏房间管理

### Options Considered / 考虑的选项中

#### Option A: Redis-Based (room state in Redis) / 选项 A：基于 Redis（房间状态在 Redis 中）
- **Pros / 优点**:
  - Fast access / 快速访问
  - TTL support for auto-cleanup / 支持 TTL 以自动清理
  - Suitable for ephemeral data / 适合临时数据

- **Cons / 缺点**:
  - Not persistent (lost on Redis restart) / 不持久（Redis 重启时丢失）
  - Limited querying capabilities / 查询能力有限

- **Decision / 决定**: ✅ **SELECTED** - Good for ephemeral room state. / 选定 - 适合临时房间状态。

#### Option B: MySQL-Based (room state in MySQL) / 选项 B：基于 MySQL（房间状态在 MySQL 中）
- **Pros / 优点**:
  - Persistent storage / 持久存储
  - Can query rooms easily / 可以轻松查询房间

- **Cons / 缺点**:
  - Slower access / 访问较慢
  - Unnecessary for ephemeral data / 对临时数据不必要

- **Decision / 决定**: ❌ **REJECTED** - Overkill for room state. / 拒绝 - 对房间状态来说过于复杂。

#### Option C: Hybrid (Redis + MySQL) / 选项 C：混合（Redis + MySQL）
- **Pros / 优点**:
  - Fast access (Redis) + persistent storage (MySQL) / 快速访问（Redis）+ 持久存储（MySQL）

- **Cons / 缺点**:
  - More complex / 更复杂
  - Increased cost / 增加成本

- **Decision / 决定**: ⚠️ **FUTURE ENHANCEMENT** - Not needed for MVP. / 未来增强 - MVP 不需要。

---

## 7. Security Considerations / 安全考虑

### Authentication / 认证
- **Requirement / 要求**: All WebSocket connections MUST validate JWT token. / 所有 WebSocket 连接必须验证 JWT 令牌。
- **Implementation / 实现**: Token passed as query parameter in WebSocket URL. / 令牌作为 WebSocket URL 中的查询参数传递。
- **Reference / 参考**: Constitution Principle IV (Security by Default). / 宪法原则 IV（默认安全）。

### Message Validation / 消息验证
- **Requirement / 要求**: All real-time messages MUST be validated before processing. / 所有实时消息在处理前必须验证。
- **Implementation / 实现**: Validate message format, length, rate limit, content. / 验证消息格式、长度、速率限制、内容。
- **Reference / 参考**: Constitution Principle IV (Security by Default). / 宪法原则 IV（默认安全）。

### Encryption / 加密
- **Requirement / 要求**: All WebSocket connections MUST use WSS (encrypted in transit). / 所有 WebSocket 连接必须使用 WSS（传输中加密）。
- **Implementation / 实现**: API Gateway enforces WSS. / API 网关强制执行 WSS。
- **Reference / 参考**: Constitution Principle VII (Real-Time Communication). / 宪法原则 VII（实时通信）。

---

## 8. Performance Benchmarks / 性能基准

### WebSocket Connection / WebSocket 连接
- **Target / 目标**: Connection established within 3 seconds / 连接在 3 秒内建立
- **Measurement / 测量**: Browser DevTools Network tab / 浏览器开发工具网络选项卡

### Message Delivery / 消息传递
- **Target / 目标**: Message delivered within 500ms (battle), 1s (chat) / 消息在 500ms 内传递（战斗），1 秒（聊天）
- **Measurement / 测量**: Automated test with 2 clients / 使用 2 个客户端的自动化测试

### Leaderboard Calculation / 排行榜计算
- **Target / 目标**: Calculation completes within 5 seconds (1000 players) / 计算在 5 秒内完成（1000 名玩家）
- **Measurement / 测量**: Load test with simulated players / 使用模拟玩家的负载测试

### Concurrent Connections / 并发连接
- **Target / 目标**: 100 concurrent WebSocket connections per SCF instance / 每个 SCF 实例 100 个并发 WebSocket 连接
- **Measurement / 测量**: Load test / 负载测试

---

## 9. References / 参考

- [Tencent Cloud API Gateway WebSocket Documentation](https://cloud.tencent.com/document/product/628/11797) / 腾讯云 API 网关 WebSocket 文档
- [Redis Documentation](https://redis.io/documentation) / Redis 文档
- [JWT Token Validation Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens) / JWT 令牌验证最佳实践
- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455) / WebSocket 协议 RFC 6455
- Project Constitution (`.specify/memory/constitution.md`) / 项目宪法 (`.specify/memory/constitution.md`)

---

## 10. Open Questions / 未解决的问题

1. **Q**: What is the maximum number of concurrent WebSocket connections supported by Tencent Cloud API Gateway? / 腾讯云 API 网关支持的最大并发 WebSocket 连接数是多少？
   - **A**: Need to check Tencent Cloud documentation. Likely 1000+ per instance. / 需要检查腾讯云文档。每个实例可能 1000+。

2. **Q**: How to handle WebSocket connection failover if API Gateway instance goes down? / 如果 API 网关实例宕机，如何处理 WebSocket 连接故障转移？
   - **A**: API Gateway is managed service with built-in high availability. Client should implement reconnection logic. / API 网关是托管服务，具有内置的高可用性。客户端应实现重新连接逻辑。

3. **Q**: Should we implement message queuing for offline players? / 我们应该为离线玩家实现消息队列吗？
   - **A**: Yes, store last 100 events for offline players. Deliver on reconnect. / 是的，为离线玩家存储最后 100 个事件。重新连接时传递。

4. **Q**: How to prevent WebSocket connection exhaustion (DDoS)? / 如何防止 WebSocket 连接耗尽（DDoS）？
   - **A**: Rate limit connections per IP, use API Gateway throttling, validate JWT strictly. / 限制每个 IP 的连接速率，使用 API 网关节流，严格验证 JWT。

---

**Researcher / 研究人员**: AI Assistant
**Date / 日期**: 2026-06-27
**Status / 状态**: Complete / 完成
