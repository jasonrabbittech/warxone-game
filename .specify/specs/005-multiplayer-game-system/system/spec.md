# Feature Specification: Multiplayer Game System / 多人游戏系统

**Feature Branch / 功能分支**: `feat/multiplayer-game-system`

**Created / 创建日期**: 2026-06-27

**Status / 状态**: Draft / 草稿

**Input / 输入**: User description: "定义多人游戏模块，包括：实时通信基础设施、玩家对战(PvP)、联盟系统、聊天系统、排行榜、多人游戏房间管理。当前实现状态：所有多人游戏功能均未实现（Phase 2 功能）。需要基于 WebSocket 实现实时多人游戏体验。"

---

## User Scenarios & Testing *(mandatory)* / 用户场景与测试 *(必填)*

### User Story 1 - Player communicates in real-time via WebSocket (Priority: P1) / 用户故事 1 - 玩家通过 WebSocket 实时通信（优先级：P1）

**English**:
Player MUST be able to connect to the game server via WebSocket for real-time communication. System MUST establish WebSocket connection on game login and maintain connection with automatic reconnection. Real-time events (player movements, battles, chat messages) MUST be delivered to all connected clients instantly. Connection state MUST be stored in Redis (not in SCF memory) per Constitution Principle VII.

**Why this priority / 优先级原因**: Real-time communication infrastructure is the foundation for all multiplayer features. Without WebSocket, no real-time multiplayer is possible. / 实时通信基础设施是所有多人游戏功能的基础。没有 WebSocket，就不可能实现实时多人游戏。

**Independent Test / 独立测试**: Can be fully tested by: (1) Loading game and verifying WebSocket connection establishes, (2) Verifying connection state in Redis, (3) Sending test message and verifying delivery, (4) Disconnecting network and verifying automatic reconnection. / 可以通过以下步骤完整测试：（1）加载游戏并验证 WebSocket 连接建立，（2）验证 Redis 中的连接状态，（3）发送测试消息并验证传递，（4）断开网络并验证自动重新连接。

**Acceptance Scenarios / 验收场景**:

1. **Given** player logs in, **When** game loads, **Then** WebSocket connection is established to server. / **给定**玩家登录，**当**游戏加载，**则**WebSocket 连接到服务器。

2. **Given** WebSocket is connected, **When** network disconnects, **Then** connection automatically reconnects when network returns. / **给定**WebSocket 已连接，**当**网络断开，**则**网络恢复时自动重新连接。

3. **Given** player is connected, **When** server sends real-time event, **Then** event is received and processed within 100ms. / **给定**玩家已连接，**当**服务器发送实时事件，**则**事件在 100ms 内接收并处理。

4. **Given** multiple players connected, **When** one player performs action, **Then** all other players receive the action notification instantly. / **给定**多个玩家已连接，**当**一个玩家执行操作，**则**所有其他玩家立即收到操作通知。

5. **Given** WebSocket connection established, **When** connection state is checked, **Then** connection state is stored in Redis (not SCF memory). / **给定**WebSocket 连接已建立，**当**检查连接状态，**则**连接状态存储在 Redis 中（不是 SCF 内存）。

---

### User Story 2 - Players engage in PvP battles (Priority: P1) / 用户故事 2 - 玩家参与 PvP 战斗（优先级：P1）

**English**:
Player MUST be able to attack other players' territories in real-time. PvP battle MUST be initiated by selecting an adjacent enemy territory controlled by another player. Battle outcome MUST be determined by military strength comparison with randomness. Both players MUST receive real-time battle notifications. Battle results MUST be synchronized across all connected clients.

**Why this priority / 优先级原因**: PvP battles are the core multiplayer gameplay. Players need to compete against each other for territories and resources. / PvP 战斗是核心多人游戏玩法。玩家需要相互竞争领土和资源。

**Independent Test / 独立测试**: Can be fully tested by: (1) Player A attacks Player B's territory, (2) Verifying battle initiates in real-time, (3) Both players receive battle notifications, (4) Battle outcome is synchronized, (5) Winner receives territory. / 可以通过以下步骤完整测试：（1）玩家 A 攻击玩家 B 的领土，（2）验证战斗实时发起，（3）两个玩家都收到战斗通知，（4）战斗结果同步，（5）获胜者收到领土。

**Acceptance Scenarios / 验收场景**:

1. **Given** Player A and Player B are both online, **When** Player A attacks Player B's adjacent territory, **Then** PvP battle starts immediately. / **给定**玩家 A 和玩家 B 都在线，**当**玩家 A 攻击玩家 B 的相邻领土，**则**PvP 战斗立即开始。

2. **Given** PvP battle is in progress, **When** battle resolves, **Then** both players receive battle result notification instantly. / **给定**PvP 战斗进行中，**当**战斗解决，**则**两个玩家立即收到战斗结果通知。

3. **Given** Player A wins PvP battle, **When** battle completes, **Then** territory is transferred to Player A and all players see updated map. / **给定**玩家 A 赢得 PvP 战斗，**当**战斗完成，**则**领土转移给玩家 A，所有玩家看到更新的地图。

4. **Given** Player B is offline, **When** Player A attacks Player B's territory, **Then** battle proceeds and result is stored for Player B to see on next login. / **给定**玩家 B 离线，**当**玩家 A 攻击玩家 B 的领土，**则**战斗继续进行，结果存储供玩家 B 下次登录时查看。

5. **Given** PvP battle starts, **When** Player A clicks "Retreat", **Then** battle ends with 49.9% chance Player B wins by default. / **给定**PvP 战斗开始，**当**玩家 A 点击"撤退"，**则**战斗结束，49.9% 几率玩家 B 默认获胜。

---

### User Story 3 - Players form alliances (Priority: P2) / 用户故事 3 - 玩家组建联盟（优先级：P2）

**English**:
Player MUST be able to send alliance requests to other players. Alliances MUST provide benefits: shared vision (see ally's territories), resource sharing, military support. Alliance members MUST be able to communicate via alliance chat. Alliance actions MUST be real-time (WebSocket). Player can only be in one alliance at a time.

**Why this priority / 优先级原因**: Alliance system enables social gameplay and strategic cooperation. However, it requires real-time communication infrastructure, so it's P2 after PvP. / 联盟系统启用社交游戏玩法和战略协作。然而，它需要实时通信基础设施，所以在 PvP 之后是 P2。

**Independent Test / 独立测试**: Can be fully tested by: (1) Sending alliance request, (2) Other player accepts, (3) Verifying shared vision, (4) Testing resource sharing, (5) Testing alliance chat. / 可以通过以下步骤完整测试：（1）发送联盟请求，（2）其他玩家接受，（3）验证共享视野，（4）测试资源共享，（5）测试联盟聊天。

**Acceptance Scenarios / 验收场景**:

1. **Given** Player A and Player B are not allied, **When** Player A sends alliance request, **Then** Player B receives real-time notification. / **给定**玩家 A 和玩家 B 未结盟，**当**玩家 A 发送联盟请求，**则**玩家 B 收到实时通知。

2. **Given** Player B accepts alliance, **When** alliance forms, **Then** both players can see each other's controlled territories on map. / **给定**玩家 B 接受联盟，**当**联盟形成，**则**两个玩家都可以在地图上看到彼此控制的领土。

3. **Given** players are allied, **When** one player is attacked by enemy, **Then** ally receives real-time battle notification and can send military support. / **给定**玩家已结盟，**当**一个玩家被敌人攻击，**则**盟友收到实时战斗通知并可以发送军事支援。

4. **Given** players are allied, **When** one player shares resources, **Then** other player receives resources in real-time. / **给定**玩家已结盟，**当**一个玩家共享资源，**则**另一个玩家实时收到资源。

5. **Given** Player A is in alliance with Player B, **When** Player A tries to form alliance with Player C, **Then** system rejects request (only one alliance allowed). / **给定**玩家 A 与玩家 B 结盟，**当**玩家 A 尝试与玩家 C 组建联盟，**则**系统拒绝请求（只允许一个联盟）。

---

### User Story 4 - Players chat in real-time (Priority: P2) / 用户故事 4 - 玩家实时聊天（优先级：P2）

**English**:
Player MUST be able to send and receive chat messages in real-time. System MUST support: global chat (all players), alliance chat (alliance members only), and private chat (direct messages). Chat messages MUST be delivered instantly via WebSocket. Chat history MUST be persisted for recent messages (last 100 per channel). System MUST support chat moderation (admin can delete messages).

**Why this priority / 优先级原因**: Chat system enables communication between players, which is essential for social gameplay and coordination. / 聊天系统启用玩家之间的通信，这对于社交游戏玩法和协调至关重要。

**Independent Test / 独立测试**: Can be fully tested by: (1) Sending global chat message, (2) Verifying all players receive message, (3) Sending alliance chat message, (4) Verifying only alliance members receive, (5) Sending private message, (6) Verifying only recipient receives. / 可以通过以下步骤完整测试：（1）发送全局聊天消息，（2）验证所有玩家收到消息，（3）发送联盟聊天消息，（4）验证只有联盟成员收到，（5）发送私信，（6）验证只有接收者收到。

**Acceptance Scenarios / 验收场景**:

1. **Given** Player A sends global chat message, **When** message is sent, **Then** all online players receive message instantly. / **给定**玩家 A 发送全局聊天消息，**当**消息发送，**则**所有在线玩家立即收到消息。

2. **Given** Player A and Player B are allied, **When** Player A sends alliance chat message, **Then** only Player B receives message (not global). / **给定**玩家 A 和玩家 B 结盟，**当**玩家 A 发送联盟聊天消息，**则**只有玩家 B 收到消息（不是全局）。

3. **Given** Player A sends private message to Player B, **When** message is sent, **Then** only Player B receives message (not visible to others). / **给定**玩家 A 向玩家 B 发送私信，**当**消息发送，**则**只有玩家 B 收到消息（其他人不可见）。

4. **Given** chat message is sent, **When** admin views chat log, **Then** message is persisted in database. / **给定**聊天消息已发送，**当**管理员查看聊天日志，**则**消息持久化在数据库中。

5. **Given** admin deletes chat message, **When** message is deleted, **Then** message is removed from all clients in real-time. / **给定**管理员删除聊天消息，**当**消息删除，**则**消息实时从所有客户端移除。

---

### User Story 5 - Players view leaderboard (Priority: P3) / 用户故事 5 - 玩家查看排行榜（优先级：P3）

**English**:
Player MUST be able to view leaderboard showing top players by: total territories controlled, total population, total military strength, total victories. Leaderboard MUST update in real-time when players' stats change. Leaderboard MUST show player's own rank. System MUST support filtering by: global (all players), friends (allied players), regional (by geography).

**Why this priority / 优先级原因**: Leaderboard provides motivation and competition. However, it's less critical than real-time communication and PvP, so it's P3. / 排行榜提供动力和竞争。然而，它不如实时通信和 PvP 关键，所以是 P3。

**Independent Test / 独立测试**: Can be fully tested by: (1) Viewing leaderboard, (2) Verifying top players are listed, (3) Conquering territory and verifying rank updates, (4) Filtering by friends, (5) Verifying real-time updates. / 可以通过以下步骤完整测试：（1）查看排行榜，（2）验证顶级玩家列出，（3）征服领土并验证排名更新，（4）按好友筛选，（5）验证实时更新。

**Acceptance Scenarios / 验收场景**:

1. **Given** player views leaderboard, **When** leaderboard loads, **Then** top 100 players are listed by territories controlled. / **给定**玩家查看排行榜，**当**排行榜加载，**则**按控制的领土列出前 100 名玩家。

2. **Given** Player A conquers new territory, **When** territory is added, **Then** Player A's leaderboard rank updates in real-time. / **给定**玩家 A 征服新领土，**当**领土添加，**则**玩家 A 的排行榜排名实时更新。

3. **Given** player views leaderboard, **When** player's rank is 50th, **Then** leaderboard shows player's rank highlighted. / **给定**玩家查看排行榜，**当**玩家的排名是第 50 名，**则**排行榜突出显示玩家的排名。

4. **Given** player filters leaderboard by "friends", **When** filter applied, **Then** only allied players are shown. / **给定**玩家按"好友"筛选排行榜，**当**应用筛选，**则**只显示结盟玩家。

5. **Given** leaderboard is displayed, **When** player switches to "military" filter, **Then** players are re-sorted by total military strength. / **给定**排行榜显示，**当**玩家切换到"军事"筛选，**则**玩家按总军事力量重新排序。

---

### User Story 6 - Players manage multiplayer rooms (Priority: P3) / 用户故事 6 - 玩家管理多人游戏房间（优先级：P3）

**English**:
Player MUST be able to create, join, and leave multiplayer rooms. Rooms MUST have max player limit (configurable, default 50). Rooms MUST have room owner (creator) with admin privileges. Room owner MUST be able to: kick players, change room settings, start/end game sessions. Players MUST receive real-time notifications when room state changes.

**Why this priority / 优先级原因**: Room management enables organized multiplayer sessions. However, it's infrastructure for social features, so it's P3. / 房间管理启用有组织的多人游戏会话。然而，它是社交功能的基础设施，所以是 P3。

**Independent Test / 独立测试**: Can be fully tested by: (1) Creating room, (2) Other players join, (3) Verifying room state updates, (4) Kicking player, (5) Changing room settings, (6) Verifying real-time notifications. / 可以通过以下步骤完整测试：（1）创建房间，（2）其他玩家加入，（3）验证房间状态更新，（4）踢出玩家，（5）更改房间设置，（6）验证实时通知。

**Acceptance Scenarios / 验收场景**:

1. **Given** Player A creates room, **When** room is created, **Then** Player A becomes room owner with admin privileges. / **给定**玩家 A 创建房间，**当**房间创建，**则**玩家 A 成为房间所有者，具有管理员权限。

2. **Given** Room is created, **When** Player B joins room, **Then** all room members receive real-time notification. / **给定**房间已创建，**当**玩家 B 加入房间，**则**所有房间成员收到实时通知。

3. **Given** Player A is room owner, **When** Player A kicks Player B, **Then** Player B is removed from room and receives notification. / **给定**玩家 A 是房间所有者，**当**玩家 A 踢出玩家 B，**则**玩家 B 从房间移除并收到通知。

4. **Given** room has 50 players, **When** Player C tries to join, **Then** system rejects with "room full" message. / **给定**房间有 50 名玩家，**当**玩家 C 尝试加入，**则**系统拒绝并显示"房间已满"消息。

5. **Given** Player A (room owner) leaves room, **When** owner leaves, **Then** next longest member becomes new owner. / **给定**玩家 A（房间所有者）离开房间，**当**所有者离开，**则**下一个最长的成员成为新所有者。

---

### Edge Cases / 边界情况

- What happens when WebSocket connection drops during battle? / 当战斗期间 WebSocket 连接断开时会发生什么？
  - **Answer / 回答**: Battle continues server-side. Player reconnects and receives battle result. Unsaved actions are retried. / 战斗在服务器端继续。玩家重新连接并收到战斗结果。未保存的操作会重试。

- What happens when player's ally goes offline? / 当玩家的盟友下线时会发生什么？
  - **Answer / 回答**: Alliance remains active. Ally's territories are defended by AI. Resources cannot be shared until ally returns. / 联盟保持活跃。盟友的领土由 AI 防御。在盟友返回之前无法共享资源。

- What happens when chat message fails to send? / 当聊天消息发送失败时会怎样？
  - **Answer / 回答**: System retries 3 times. If still fails, message is queued for retry when connection restores. / 系统重试 3 次。如果仍然失败，消息排队等待连接恢复时重试。

- What happens when two players attack same territory simultaneously? / 当两个玩家同时攻击同一领土时会发生什么？
  - **Answer / 回答**: First attack request processed. Second attacker receives "territory already under attack" message. / 处理第一个攻击请求。第二个攻击者收到"领土已在攻击中"消息。

- What happens when player reaches rate limit for chat? / 当玩家达到聊天速率限制时会发生什么？
  - **Answer / 回答**: System blocks message and notifies player: "You are sending messages too quickly. Please wait." / 系统阻止消息并通知玩家："您发送消息太快。请等待。"

- What happens when room owner is banned? / 当房间所有者被封禁时会发生什么？
  - **Answer / 回答**: Room is automatically dissolved. All players receive notification and are moved to default room. / 房间自动解散。所有玩家收到通知并移至默认房间。

---

## Requirements *(mandatory)* / 需求 *(必填)*

### Functional Requirements / 功能性需求

**English** | **中文**

- **FR-001**: System MUST establish WebSocket connection on player login for real-time communication. Connection MUST use WSS (secure WebSocket). Connection state MUST be stored in Redis. / 系统必须在玩家登录时建立 WebSocket 连接以进行实时通信。连接必须使用 WSS（安全 WebSocket）。连接状态必须存储在 Redis 中。

- **FR-002**: System MUST implement automatic reconnection logic. If connection drops, system MUST attempt to reconnect every 5 seconds, up to 10 retries. After 10 failures, system MUST notify player and switch to polling mode. / 系统必须实现自动重新连接逻辑。如果连接断开，系统必须每 5 秒尝试重新连接，最多 10 次重试。10 次失败后，系统必须通知玩家并切换到轮询模式。

- **FR-003**: System MUST implement PvP battle system. Players MUST be able to attack other players' territories in real-time. Battle outcome MUST be determined by military strength comparison with randomness (win rate = (attacker/defender) × 100% ± 20%, capped at 10%-90%). / 系统必须实现 PvP 战斗系统。玩家必须能够实时攻击其他玩家的领土。战斗结果必须由军事力量比较和随机性决定（胜率 = (攻击方/防御方) × 100% ± 20%，限制在 10%-90%）。

- **FR-004**: System MUST implement alliance system. Players MUST be able to send alliance requests. Alliance MUST provide shared vision and resource sharing. Player can only be in one alliance at a time. / 系统必须实现联盟系统。玩家必须能够发送联盟请求。联盟必须提供共享视野和资源共享。玩家一次只能在一个联盟中。

- **FR-005**: System MUST implement real-time chat system. System MUST support: global chat, alliance chat, and private chat. Chat messages MUST be delivered instantly via WebSocket. Chat history MUST be persisted (last 100 messages per channel). / 系统必须实现实时聊天系统。系统必须支持：全局聊天、联盟聊天和私信。聊天消息必须通过 WebSocket 即时传递。聊天历史必须持久化（每个频道最后 100 条消息）。

- **FR-006**: System MUST implement leaderboard system. Leaderboard MUST show top players by: territories, population, military, victories. Leaderboard MUST update in real-time. System MUST support filtering by: global, friends, regional. / 系统必须实现排行榜系统。排行榜必须按以下方式显示顶级玩家：领土、人口、军事、胜利。排行榜必须实时更新。系统必须支持按以下方式筛选：全局、好友、区域。

- **FR-007**: System MUST implement multiplayer room management. Players MUST be able to create, join, leave rooms. Rooms MUST have max player limit (default 50). Room owner MUST have admin privileges (kick players, change settings). / 系统必须实现多人游戏房间管理。玩家必须能够创建、加入、离开房间。房间必须有最大玩家限制（默认 50）。房间所有者必须具有管理员权限（踢出玩家、更改设置）。

- **FR-008**: System MUST validate all real-time messages before processing (Constitution Principle VII). Message validation MUST check: message format, sender authentication, rate limits, content moderation. / 系统必须在处理前验证所有实时消息（宪法原则 VII）。消息验证必须检查：消息格式、发送者身份验证、速率限制、内容审核。

- **FR-009**: System MUST implement chat moderation tools. Admins MUST be able to: delete messages, mute players, ban players from chat. Moderation actions MUST be logged. / 系统必须实现聊天审核工具。管理员必须能够：删除消息、禁言玩家、禁止玩家聊天。审核操作必须记录日志。

- **FR-010**: System MUST persist multiplayer game state in TDSQL-C (Constitution Principle III). Game state MUST NOT be stored in SCF memory. Ephemeral state (active battles, player sessions) MAY use Redis. / 系统必须将多人游戏状态持久化在 TDSQL-C 中（宪法原则 III）。游戏状态不得存储在 SCF 内存中。临时状态（活跃战斗、玩家会话）可以使用 Redis。

- **FR-011**: System MUST implement real-time notifications. Players MUST receive notifications for: battle start/end, alliance requests/acceptance, chat messages, room invites, leaderboard changes. / 系统必须实现实时通知。玩家必须收到以下通知：战斗开始/结束、联盟请求/接受、聊天消息、房间邀请、排行榜变化。

- **FR-012**: System MUST handle player disconnection gracefully. If player disconnects during battle, battle continues server-side. Player's territories are defended by AI until player reconnects or 5 minutes timeout (then territories become neutral). / 系统必须优雅地处理玩家断开连接。如果玩家在战斗期间断开连接，战斗在服务器端继续。玩家的领土由 AI 防御，直到玩家重新连接或 5 分钟超时（然后领土变为中立）。

---

### Key Entities *(include if feature involves data)* / 关键实体 *(如果功能涉及数据)*

#### WebSocketConnection / WebSocket 连接

**English**:
- **Fields / 字段**: connectionId, playerId, roomId, connectedAt, lastHeartbeat, redisKey
- `connectionId`: Unique WebSocket connection ID / 唯一 WebSocket 连接 ID
- `playerId`: ID of connected player / 连接的玩家 ID
- `roomId`: ID of room player is in / 玩家所在房间 ID
- `connectedAt`: Timestamp when connection established / 连接建立时的时间戳
- `lastHeartbeat`: Timestamp of last heartbeat / 最后一次心跳的时间戳
- `redisKey`: Redis key for connection state / 连接状态的 Redis 键

#### PvPBattle / PvP 战斗

**English**:
- **Fields / 字段**: battleId, attackerId, defenderId, territoryId, startTime, endTime, outcome, attackersLosses, defendersLosses
- `battleId`: Unique battle ID / 唯一战斗 ID
- `attackerId`: Player ID of attacker / 攻击者的玩家 ID
- `defenderId`: Player ID of defender / 防御者的玩家 ID
- `territoryId`: ID of territory under attack / 被攻击的领土 ID
- `outcome`: "attacker_wins", "defender_wins", "retreat" / "攻击者获胜"、"防御者获胜"、"撤退"
- `attackersLosses`: Military units lost by attacker / 攻击者损失的军事单位
- `defendersLosses`: Military units lost by defender / 防御者损失的军事单位

#### Alliance / 联盟

**English**:
- **Fields / 字段**: allianceId, player1Id, player2Id, status, createdAt, sharedVision, resourceSharing
- `allianceId`: Unique alliance ID / 唯一联盟 ID
- `player1Id`, `player2Id`: Player IDs in alliance / 联盟中的玩家 ID
- `status`: "pending", "active", "broken" / "待定"、"活跃"、"破裂"
- `sharedVision`: Boolean, true if allies can see each other's territories / 布尔值，如果盟友能看到彼此的领土则为 true
- `resourceSharing`: Boolean, true if allies can share resources / 布尔值，如果盟友可以共享资源则为 true

#### ChatMessage / 聊天消息

**English**:
- **Fields / 字段**: messageId, senderId, channelType, channelId, content, timestamp, moderated
- `messageId`: Unique message ID / 唯一消息 ID
- `senderId`: Player ID of sender / 发送者的玩家 ID
- `channelType`: "global", "alliance", "private" / "全局"、"联盟"、"私信"
- `channelId`: Room ID or alliance ID or recipient ID / 房间 ID 或联盟 ID 或接收者 ID
- `content`: Message text (max 500 characters) / 消息文本（最多 500 个字符）
- `moderated`: Boolean, true if message was moderated (deleted) / 布尔值，如果消息被审核（删除）则为 true

#### LeaderboardEntry / 排行榜条目

**English**:
- **Fields / 字段**: playerId, playerName, territories, population, military, victories, rank
- `playerId`: Player ID / 玩家 ID
- `playerName`: Player display name / 玩家显示名称
- `territories`: Number of territories controlled / 控制的领土数量
- `population`: Total population / 总人口
- `military`: Total military strength / 总军事力量
- `victories`: Number of PvP victories / PvP 胜利次数
- `rank`: Current leaderboard rank / 当前排行榜排名

#### MultiplayerRoom / 多人游戏房间

**English**:
- **Fields / 字段**: roomId, name, ownerId, maxPlayers, currentPlayers, settings, createdAt
- `roomId`: Unique room ID / 唯一房间 ID
- `name`: Room name (user-defined) / 房间名称（用户定义）
- `ownerId`: Player ID of room owner / 房间所有者的玩家 ID
- `maxPlayers`: Maximum players (default 50) / 最大玩家数（默认 50）
- `currentPlayers`: Array of player IDs in room / 房间中的玩家 ID 数组
- `settings`: Room settings (allowJoin, battleMode, etc.) / 房间设置（允许加入、战斗模式等）
- `createdAt`: Timestamp when room created / 房间创建时的时间戳

---

## Success Criteria *(mandatory)* / 成功标准 *(必填)*

### Measurable Outcomes / 可衡量结果

**English** | **中文**

- **SC-001**: WebSocket connection establishes within 2 seconds of player login (tested via automated test). / WebSocket 连接在玩家登录后 2 秒内建立（通过自动化测试）。

- **SC-002**: Real-time message delivery latency is under 100ms (tested via network monitoring). / 实时消息传递延迟低于 100ms（通过网络监控测试）。

- **SC-003**: PvP battle initiates and resolves within 5 seconds (tested via gameplay). / PvP 战斗在 5 秒内发起并解决（通过游戏测试）。

- **SC-004**: Chat message is delivered to all recipients within 200ms (tested via automated test). / 聊天消息在 200ms 内传递给所有接收者（通过自动化测试）。

- **SC-005**: Leaderboard updates in real-time (within 1 second of stat change) (tested via manual testing). / 排行榜实时更新（统计变化后 1 秒内）（通过手动测试）。

- **SC-006**: 95% of multiplayer actions (PvP battle, chat, alliance) complete without errors (tracked via analytics). / 95% 的多人游戏操作（PvP 战斗、聊天、联盟）无错误完成（通过分析报告跟踪）。

- **SC-007**: System handles 1000 concurrent WebSocket connections without degradation (tested via load testing). / 系统处理 1000 个并发 WebSocket 连接而无性能下降（通过负载测试）。

- **SC-008**: Automatic reconnection succeeds within 10 seconds of network restore (tested via network disconnect/reconnect). / 自动重新连接在网络恢复后 10 秒内成功（通过网络断开/恢复测试）。

---

## Assumptions / 假设

**English** | **中文**

- Real-time communication uses Tencent Cloud API Gateway with WebSocket support (Constitution Principle VII). API Gateway handles WebSocket connection management. SCF functions handle business logic. / 实时通信使用支持 WebSocket 的腾讯云 API 网关（宪法原则 VII）。API 网关处理 WebSocket 连接管理。SCF 函数处理业务逻辑。

- Connection state is stored in Redis (not SCF memory). Redis is used for: connection tracking, session state, ephemeral game state (active battles, chat messages). / 连接状态存储在 Redis 中（不是 SCF 内存）。Redis 用于：连接跟踪、会话状态、临时游戏状态（活跃战斗、聊天消息）。

- WebSocket message format is JSON. Each message has: `type` (message type), `payload` (message data), `timestamp` (message timestamp), `signature` (HMAC signature for validation). / WebSocket 消息格式为 JSON。每条消息包含：`type`（消息类型）、`payload`（消息数据）、`timestamp`（消息时间戳）、`signature`（用于验证的 HMAC 签名）。

- Chat messages are persisted in TDSQL-C for moderation and history. Only last 100 messages per channel are cached in Redis for quick access. / 聊天消息持久化在 TDSQL-C 中以进行审核和历史记录。每个频道只有最后 100 条消息缓存在 Redis 中以快速访问。

- PvP battles are processed server-side (SCF function). Battle state is stored in Redis during battle, then persisted to TDSQL-C after battle completes. / PvP 战斗在服务器端（SCF 函数）处理。战斗状态在战斗期间存储在 Redis 中，然后在战斗完成后持久化到 TDSQL-C。

- Alliance actions (shared vision, resource sharing) are processed in real-time via WebSocket. Alliance state is persisted in TDSQL-C every 30 seconds. / 联盟操作（共享视野、资源共享）通过 WebSocket 实时处理。联盟状态每 30 秒持久化到 TDSQL-C。

- Leaderboard is calculated server-side and cached in Redis for 1 minute. Updates are pushed to clients via WebSocket when leaderboard changes. / 排行榜在服务器端计算并缓存在 Redis 中 1 分钟。当排行榜变化时，通过 WebSocket 推送到客户端。

- Multiplayer rooms are managed by SCF functions. Room state is stored in Redis. Room settings are persisted in TDSQL-C. / 多人游戏房间由 SCF 函数管理。房间状态存储在 Redis 中。房间设置持久化在 TDSQL-C 中。

- System uses JWT tokens for authentication (Constitution Principle IV). WebSocket connection MUST include JWT token in initial handshake. Token is validated on each message. / 系统使用 JWT 令牌进行身份验证（宪法原则 IV）。WebSocket 连接在初始握手时必须包含 JWT 令牌。每条消息都验证令牌。

- Frontend uses vanilla JS with WebSocket API (`new WebSocket(url)`). Connection management is handled in `services/WebSocketService.js`. / 前端使用带有 WebSocket API（`new WebSocket(url)`）的原生 JS。连接管理在 `services/WebSocketService.js` 中处理。

- Backend uses Tencent Cloud API Gateway WebSocket APIs. SCF functions are triggered by WebSocket events: `$connect`, `$disconnect`, `$default`. / 后端使用腾讯云 API 网关 WebSocket API。SCF 函数由 WebSocket 事件触发：`$connect`、`$disconnect`、`$default`。

- Chat rate limiting: max 10 messages per minute per player. Rate limit is enforced server-side and client-side. / 聊天速率限制：每个玩家每分钟最多 10 条消息。速率限制在服务器端和客户端执行。

- PvP battle cooldown: 30 seconds to 5 minutes after each battle (same as single-player). Cooldown is enforced server-side. / PvP 战斗冷却：每次战斗后 30 秒到 5 分钟（与单人游戏相同）。冷却时间在服务器端执行。

---

## Next Steps / 下一步

**English** | **中文**

1. **Implement WebSocket Infrastructure** (Estimated time: 4 hours) / **实现 WebSocket 基础设施**（预计时间：4 小时）
   - Set up Tencent Cloud API Gateway with WebSocket support / 设置支持 WebSocket 的腾讯云 API 网关
   - Implement WebSocket connection management in SCF / 在 SCF 中实现 WebSocket 连接管理
   - Implement connection state storage in Redis / 在 Redis 中实现连接状态存储
   - Test WebSocket connection and reconnection / 测试 WebSocket 连接和重新连接

2. **Implement Real-Time Message Validation** (Estimated time: 2 hours) / **实现实时消息验证**（预计时间：2 小时）
   - Implement message validation middleware / 实现消息验证中间件
   - Validate message format, authentication, rate limits / 验证消息格式、身份验证、速率限制
   - Test message validation and rejection / 测试消息验证和拒绝

3. **Implement PvP Battle System** (Estimated time: 6 hours) / **实现 PvP 战斗系统**（预计时间：6 小时）
   - Implement PvP battle initiation and resolution / 实现 PvP 战斗发起和解决
   - Implement real-time battle notifications / 实现实时战斗通知
   - Implement battle state synchronization / 实现战斗状态同步
   - Test PvP battles between two players / 测试两个玩家之间的 PvP 战斗

4. **Implement Alliance System** (Estimated time: 5 hours) / **实现联盟系统**（预计时间：5 小时）
   - Implement alliance request and acceptance / 实现联盟请求和接受
   - Implement shared vision and resource sharing / 实现共享视野和资源共享
   - Implement alliance chat / 实现联盟聊天
   - Test alliance features / 测试联盟功能

5. **Implement Chat System** (Estimated time: 4 hours) / **实现聊天系统**（预计时间：4 小时）
   - Implement global chat, alliance chat, private chat / 实现全局聊天、联盟聊天、私信
   - Implement chat message persistence and history / 实现聊天消息持久化和历史记录
   - Implement chat moderation tools / 实现聊天审核工具
   - Test chat delivery and moderation / 测试聊天传递和审核

6. **Implement Leaderboard System** (Estimated time: 3 hours) / **实现排行榜系统**（预计时间：3 小时）
   - Implement leaderboard calculation and caching / 实现排行榜计算和缓存
   - Implement real-time leaderboard updates / 实现实时排行榜更新
   - Implement leaderboard filtering / 实现排行榜筛选
   - Test leaderboard accuracy and performance / 测试排行榜准确性和性能

7. **Implement Multiplayer Room Management** (Estimated time: 4 hours) / **实现多人游戏房间管理**（预计时间：4 小时）
   - Implement room creation, joining, leaving / 实现房间创建、加入、离开
   - Implement room admin privileges / 实现房间管理员权限
   - Implement room state management / 实现房间状态管理
   - Test room management features / 测试房间管理功能

8. **Integration Testing** (Estimated time: 3 hours) / **集成测试**（预计时间：3 小时）
   - Test all multiplayer features together / 一起测试所有多人游戏功能
   - Test real-time synchronization / 测试实时同步
   - Test error handling and edge cases / 测试错误处理和边界情况
   - Load test with multiple concurrent players / 使用多个并发玩家进行负载测试

---

**Total Estimated Time / 总预计时间**: 31 hours / 31 小时

---

## Implementation Notes / 实现说明

### Current Implementation Status / 当前实现状态

| Feature / 功能 | Status / 状态 | Location / 位置 | Notes / 备注 |
|---------|--------|----------|-------|
| WebSocket Infrastructure / WebSocket 基础设施 | ❌ Not implemented / 未实现 | - | Needs API Gateway + SCF setup / 需要 API 网关 + SCF 设置 |
| PvP Battle System / PvP 战斗系统 | ❌ Not implemented / 未实现 | - | Needs real-time battle processing / 需要实时战斗处理 |
| Alliance System / 联盟系统 | ❌ Not implemented / 未实现 | - | Phase 2 feature, depends on WebSocket / 第 2 阶段功能，取决于 WebSocket |
| Chat System / 聊天系统 | ❌ Not implemented / 未实现 | - | Needs real-time message delivery / 需要实时消息传递 |
| Leaderboard System / 排行榜系统 | ❌ Not implemented / 未实现 | - | Needs real-time calculation and caching / 需要实时计算和缓存 |
| Multiplayer Room Management / 多人游戏房间管理 | ❌ Not implemented / 未实现 | - | Needs room state management / 需要房间状态管理 |
| Redis Integration / Redis 集成 | ❌ Not implemented / 未实现 | - | Needs Redis setup for connection state / 需要 Redis 设置以存储连接状态 |

---

### Technology Stack / 技术栈

Per Constitution Principle VII (Real-Time Communication):

- **WebSocket Service**: Tencent Cloud API Gateway (WebSocket) / 腾讯云 API 网关 (WebSocket)
- **Connection State Storage**: Redis (Tencent Cloud Redis) / Redis（腾讯云 Redis）
- **Message Validation**: SCF functions with JWT validation / 带有 JWT 验证的 SCF 函数
- **Real-Time Processing**: SCF functions triggered by WebSocket events / 由 WebSocket 事件触发的 SCF 函数
- **Frontend WebSocket Client**: Vanilla JS `WebSocket` API / 原生 JS `WebSocket` API
- **Backend SCF Events**: `$connect`, `$disconnect`, `$default` / 后端 SCF 事件：`$connect`、`$disconnect`、`$default`

---

### Code Changes Required / 需要的代码更改

#### 1. **WebSocket Infrastructure** (Priority: P1) / **WebSocket 基础设施**（优先级：P1）

**Files to create / 要创建的文件:**
- `backend/functions/websocket-connect.js` - Handle WebSocket connection / 处理 WebSocket 连接
- `backend/functions/websocket-disconnect.js` - Handle WebSocket disconnection / 处理 WebSocket 断开连接
- `backend/functions/websocket-default.js` - Handle incoming WebSocket messages / 处理传入的 WebSocket 消息
- `frontend/src/services/WebSocketService.js` - Frontend WebSocket client / 前端 WebSocket 客户端

**Implementation / 实现:**
```javascript
// backend/functions/websocket-connect.js
const redis = require('./redis-client');

exports.handler = async (event, context) => {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters.token;
  
  // Validate JWT token / 验证 JWT 令牌
  const playerId = validateToken(token);
  if (!playerId) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  
  // Store connection state in Redis / 在 Redis 中存储连接状态
  await redis.hset(`connection:${connectionId}`, {
    playerId,
    connectedAt: Date.now(),
    lastHeartbeat: Date.now()
  });
  
  // Add connection to player's connection set / 将连接添加到玩家的连接集合
  await redis.sadd(`player:${playerId}:connections`, connectionId);
  
  return { statusCode: 200, body: 'Connected' };
};
```

---

#### 2. **PvP Battle System** (Priority: P1) / **PvP 战斗系统**（优先级：P1）

**Files to create / 要创建的文件:**
- `backend/functions/pvp-battle-initiate.js` - Initiate PvP battle / 发起 PvP 战斗
- `backend/functions/pvp-battle-resolve.js` - Resolve PvP battle / 解决 PvP 战斗
- `frontend/src/game/PvPBattle.js` - PvP battle logic / PvP 战斗逻辑

**Implementation / 实现:**
```javascript
// backend/functions/pvp-battle-initiate.js
const redis = require('./redis-client');

exports.handler = async (event, context) => {
  const { attackerId, defenderId, territoryId } = JSON.parse(event.body);
  
  // Validate request / 验证请求
  if (!attackerId || !defenderId || !territoryId) {
    return { statusCode: 400, body: 'Missing required fields' };
  }
  
  // Check if territory is adjacent / 检查领土是否相邻
  const isAdjacent = await validateAdjacency(attackerId, territoryId);
  if (!isAdjacent) {
    return { statusCode: 400, body: 'Territory not adjacent' };
  }
  
  // Create battle record in Redis / 在 Redis 中创建战斗记录
  const battleId = `battle:${Date.now()}`;
  await redis.hset(battleId, {
    attackerId,
    defenderId,
    territoryId,
    startTime: Date.now(),
    status: 'in_progress'
  });
  
  // Notify defender via WebSocket / 通过 WebSocket 通知防御者
  await notifyPlayer(defenderId, {
    type: 'pvp_battle_started',
    battleId,
    attackerId,
    territoryId
  });
  
  return { statusCode: 200, body: JSON.stringify({ battleId }) };
};
```

---

#### 3. **Alliance System** (Priority: P2) / **联盟系统**（优先级：P2）

**Files to create / 要创建的文件:**
- `backend/functions/alliance-request.js` - Send alliance request / 发送联盟请求
- `backend/functions/alliance-accept.js` - Accept alliance request / 接受联盟请求
- `backend/functions/alliance-share.js` - Share resources with ally / 与盟友共享资源
- `frontend/src/game/Alliance.js` - Alliance logic / 联盟逻辑

---

#### 4. **Chat System** (Priority: P2) / **聊天系统**（优先级：P2）

**Files to create / 要创建的文件:**
- `backend/functions/chat-send.js` - Send chat message / 发送聊天消息
- `backend/functions/chat-moderate.js` - Moderate chat message / 审核聊天消息
- `frontend/src/components/Chat.js` - Chat UI / 聊天 UI

---

#### 5. **Leaderboard System** (Priority: P3) / **排行榜系统**（优先级：P3）

**Files to create / 要创建的文件:**
- `backend/functions/leaderboard-get.js` - Get leaderboard / 获取排行榜
- `backend/functions/leaderboard-update.js` - Update leaderboard cache / 更新排行榜缓存
- `frontend/src/components/Leaderboard.js` - Leaderboard UI / 排行榜 UI

---

#### 6. **Multiplayer Room Management** (Priority: P3) / **多人游戏房间管理**（优先级：P3）

**Files to create / 要创建的文件:**
- `backend/functions/room-create.js` - Create room / 创建房间
- `backend/functions/room-join.js` - Join room / 加入房间
- `backend/functions/room-leave.js` - Leave room / 离开房间
- `backend/functions/room-admin.js` - Room admin actions / 房间管理员操作
- `frontend/src/components/Room.js` - Room UI / 房间 UI

---

## Appendix: WebSocket Message Types / 附录：WebSocket 消息类型

### Message Type Enum / 消息类型枚举

```javascript
const MessageType = {
  // Connection / 连接
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  HEARTBEAT: 'heartbeat',
  
  // PvP Battle / PvP 战斗
  PVP_BATTLE_START: 'pvp_battle_start',
  PVP_BATTLE_UPDATE: 'pvp_battle_update',
  PVP_BATTLE_END: 'pvp_battle_end',
  
  // Alliance / 联盟
  ALLIANCE_REQUEST: 'alliance_request',
  ALLIANCE_ACCEPT: 'alliance_accept',
  ALLIANCE_BREAK: 'alliance_break',
  
  // Chat / 聊天
  CHAT_GLOBAL: 'chat_global',
  CHAT_ALLIANCE: 'chat_alliance',
  CHAT_PRIVATE: 'chat_private',
  
  // Leaderboard / 排行榜
  LEADERBOARD_UPDATE: 'leaderboard_update',
  
  // Room / 房间
  ROOM_CREATE: 'room_create',
  ROOM_JOIN: 'room_join',
  ROOM_LEAVE: 'room_leave',
  ROOM_UPDATE: 'room_update',
  
  // Notification / 通知
  NOTIFICATION: 'notification'
};
```

---

## Constitution Compliance Check / 宪法合规性检查

- ✅ **Principle I (Serverless-First)**: All backend logic uses SCF functions. WebSocket uses API Gateway. / 所有后端逻辑使用 SCF 函数。WebSocket 使用 API 网关。
- ✅ **Principle II (Edge-First)**: Frontend deployed to EdgeOne CDN. WebSocket connection from EdgeOne. / 前端部署到 EdgeOne CDN。来自 EdgeOne 的 WebSocket 连接。
- ✅ **Principle III (Stateless)**: Game state stored in TDSQL-C. Connection state in Redis. / 游戏状态存储在 TDSQL-C 中。连接状态在 Redis 中。
- ✅ **Principle IV (Security)**: All WebSocket messages validate JWT token. Input validation applied. / 所有 WebSocket 消息都验证 JWT 令牌。应用了输入验证。
- ✅ **Principle VII (Real-Time)**: WebSocket uses managed service (API Gateway). Connection state in Redis. Message validation applied. / WebSocket 使用托管服务（API 网关）。连接状态在 Redis 中。应用了消息验证。
