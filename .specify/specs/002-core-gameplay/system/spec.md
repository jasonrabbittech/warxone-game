# Feature Specification: Core Gameplay System / 核心游戏玩法系统

**Feature Branch / 功能分支**: `feat/core-gameplay-system`

**Created / 创建日期**: 2026-06-27

**Status / 状态**: Draft / 草稿

**Input / 输入**: User description: "重新定义核心游戏功能，包括：地图系统、战斗系统、资源管理系统、领土征服、卡牌系统、联盟系统。当前实现状态：地图SVG渲染和导航已完成；战斗系统基础版已完成（自动战斗）；资源管理仅有人口自动增长；卡牌系统仅有数据结构；联盟系统完全未实现。需要补充和改写代码以实现完整的游戏玩法。"

---

## User Scenarios & Testing *(mandatory)* / 用户场景与测试 *(必填)*

### User Story 1 - Player explores map and conquers territories (Priority: P1) / 用户故事 1 - 玩家探索地图并征服领土（优先级：P1）

**English**:
Player MUST be able to view an interactive SVG map with zoom and pan controls. Player MUST be able to select and conquer adjacent territories through battles. Conquering territories increases population growth rate and unlocks rewards (tokens). Player can switch between Earth and Mars worlds after unlocking Mars.

**Why this priority / 优先级原因**: Map exploration and territory conquest are the core gameplay loop. Without this, there is no game. / 地图探索和领土征服是核心游戏循环。没有这个，就没有游戏。

**Independent Test / 独立测试**: Can be fully tested by: (1) Loading map screen, (2) Verifying zoom/pan controls work, (3) Selecting an adjacent territory, (4) Winning a battle, (5) Verifying territory is added to player's owned territories. / 可以通过以下步骤完整测试：（1）加载地图界面，（2）验证缩放/平移控制正常工作，（3）选择相邻领土，（4）赢得战斗，（5）验证领土已添加到玩家拥有的领土列表。

**Acceptance Scenarios / 验收场景**:

1. **Given** player is on map screen, **When** player scrolls mouse wheel up, **Then** map zooms in (viewBox width decreases). / **给定**玩家在地图界面，**当**玩家向上滚动鼠标滚轮，**则**地图放大（viewBox宽度减小）。

2. **Given** player is on map screen, **When** player drags the map, **Then** map pans smoothly (viewBox x/y change). / **给定**玩家在地图界面，**当**玩家拖动地图，**则**地图平滑平移（viewBox x/y 变化）。

3. **Given** player has not conquered any territories, **When** player clicks on a non-adjacent territory, **Then** message "Not adjacent to your territories" is shown. / **给定**玩家未征服任何领土，**当**玩家点击非相邻领土，**则**显示消息"不相邻于你的领土"。

4. **Given** player has conquered some territories, **When** player clicks on an adjacent enemy territory, **Then** battle starts automatically. / **给定**玩家已征服一些领土，**当**玩家点击相邻的敌方领土，**则**战斗自动开始。

5. **Given** player wins a battle, **When** battle resolves, **Then** territory is added to player's owned territories and +1 token is awarded. / **给定**玩家赢得战斗，**当**战斗解决，**则**领土添加到玩家拥有的领土中，并奖励+1代币。

6. **Given** player has conquered 90% of Earth, **When** player views map, **Then** Mars world is unlocked and switch button appears. / **给定**玩家已征服90%的地球，**当**玩家查看地图，**则**火星世界解锁，切换按钮出现。

---

### User Story 2 - Player engages in battle with military management (Priority: P1) / 用户故事 2 - 玩家参与战斗并进行军事管理（优先级：P1）

**English**:
Player MUST be able to train military units to increase battle strength. Battle outcome MUST be determined by military strength comparison (with randomness factor). Player MUST see battle progress and result. System MUST show a front line according to battle casualties and territories. After battle, there MUST be a cooldown period (30 seconds to 5 minutes) before next battle. Player MUST have the option to retreat when battle starts.

**Why this priority / 优先级原因**: Military management and meaningful battles are essential for strategic gameplay. Current auto-battle without military training is not engaging. / 军事管理和有意义的战斗对于策略游戏玩法至关重要。当前没有军事训练的自动战斗不够吸引人。

**Independent Test / 独立测试**: Can be fully tested by: (1) Training military units (implement training system), (2) Attacking a territory, (3) Verifying battle outcome considers military strength, (4) Verifying cooldown prevents immediate re-attack, (5) Verifying front line display. / 可以通过以下步骤完整测试：（1）训练军事单位（实现训练系统），（2）攻击领土，（3）验证战斗结果考虑军事力量，（4）验证冷却时间防止立即重新攻击，（5）验证前线显示。

**Acceptance Scenarios / 验收场景**:

1. **Given** player has 20k population and 5 tokens, **When** player trains military (costs 1k population and 5 tokens), **Then** military strength increases by 10. / **给定**玩家有20k人口和5代币，**当**玩家训练军事（消耗1k人口和5代币），**则**军事力量增加10。

2. **Given** player attacks a territory, **When** player's military > defender's military, **Then** player has higher chance to win (win rate = (attacker/defender) × 100% ± 20%, capped at 10%-90%). / **给定**玩家攻击领土，**当**玩家的军事 > 防御者的军事，**则**玩家有更高的获胜几率（胜率 = (攻击方/防御方) × 100% ± 20%，限制在10%-90%）。

3. **Given** player wins a battle, **When** battle completes, **Then** cooldown starts (30 seconds to 5 minutes, based on battle intensity). / **给定**玩家赢得战斗，**当**战斗完成，**则**开始冷却时间（30秒到5分钟，基于战斗强度）。

4. **Given** player starts a battle, **When** player clicks "Retreat", **Then** battle ends. There is a 49.9% chance the other country keeps invading and wins. / **给定**玩家开始战斗，**当**玩家点击"撤退"，**则**战斗结束。有49.9%的几率对方国家继续入侵并获胜。

5. **Given** player is in battle, **When** battle progresses, **Then** system shows a front line according to battle casualties and territories. / **给定**玩家在战斗中，**当**战斗进行，**则**系统根据战斗伤亡和领土显示前线。

---

### User Story 3 - Player manages resources (Priority: P1) / 用户故事 3 - 玩家管理资源（优先级：P1）

**English**:
Player MUST have multiple resource types: Population (grows automatically), Gold (CANNOT be added automatically, only earned from admin-distributed gift packages or from chests found in territories), Food (consumed by military), and Tokens (earned from quizzes and battles). Resources MUST be displayed in UI and used for various game actions (training military, buying cards, etc.).

**Note (Phase 1)**: In Phase 1, gift packages can ONLY be distributed by game administrators. Player-initiated gift pack acquisition (e.g., buying with gold) is reserved for Phase 2. / **注意（第1阶段）**：在第1阶段，礼包只能由游戏管理员发放。玩家主动获取礼包（例如用金币购买）预留到第2阶段。

**Why this priority / 优先级原因**: Resource management adds strategic depth. Single resource (population) is too simple. Gold scarcity creates strategic challenge. / 资源管理增加了策略深度。单一资源（人口）太简单。金币稀缺性创造策略挑战。

**Independent Test / 独立测试**: Can be fully tested by: (1) Verifying resource display in UI, (2) Waiting for population growth (10 seconds), (3) Opening a chest to earn gold, (4) Receiving gold from admin gift package, (5) Training military (should consume food and tokens). / 可以通过以下步骤完整测试：（1）验证UI中的资源显示，（2）等待人口增长（10秒），（3）打开宝箱获得金币，（4）从管理员礼包接收金币，（5）训练军事（应消耗食物和代币）。

**Acceptance Scenarios / 验收场景**:

1. **Given** player owns 5 territories, **When** 10 seconds pass, **Then** population increases by 500 (5 territories × 100 population/territory/10s). / **给定**玩家拥有5个领土，**当**10秒过去，**则**人口增加500（5领土 × 100人口/领土/10秒）。

2. **Given** player views resource panel, **When** player has gold, **Then** gold amount is shown. Gold CANNOT be earned from territories automatically. / **给定**玩家查看资源面板，**当**玩家有金币，**则**显示金币数量。金币不能从领土自动获得。

3. **Given** admin triggers gift allocation, **When** player receives gift package, **Then** gold is added to player's resources. / **给定**管理员触发礼包分配，**当**玩家收到礼包，**则**金币添加到玩家资源中。

4. **Given** player finds a chest in a territory, **When** player opens the chest, **Then** gold may be added (based on chest type and rarity). / **给定**玩家在领土中发现宝箱，**当**玩家打开宝箱，**则**可能获得金币（基于宝箱类型和稀有度）。

5. **Given** player has 500 food, **When** player trains 50 military, **Then** food decreases by 50. / **给定**玩家有500食物，**当**玩家训练50军事，**则**食物减少50。

6. **Given** player has 0 food, **When** military units consume food, **Then** military strength decreases by 10% (starvation penalty). / **给定**玩家有0食物，**当**军事单位消耗食物，**则**军事力量减少10%（饥饿惩罚）。

---

### User Story 4 - Player collects and uses cards named after cities (Priority: P2) / 用户故事 4 - 玩家收集并使用以城市命名的卡牌（优先级：P2）

**English**:
Player MUST be able to purchase card packs (5 tokens/pack) and receive cards named after cities. Cards MUST have rarities (Common, Rare, Super Rare, Mythic, Legendary, Ultra Legendary). Lower rarity = smaller city with lower population, military, and resources. Card effects are PERMANENT additions: the card's population, military, and resources are added to the player's totals. Cards are NOT single-use "booster" cards - they provide permanent territorial assets. Each card also has its own infrastructure: number of airports, train stations, and military units (note: military strength on card does NOT equal number of military units).

**Why this priority / 优先级原因**: Card system adds variety and strategic depth through city collection mechanics. Cards provide permanent territorial assets that accumulate over time. / 卡牌系统通过城市收集机制增加多样性和策略深度。卡牌提供随时间累积的永久性领土资产。

**Independent Test / 独立测试**: Can be fully tested by: (1) Purchasing a card pack, (2) Receiving a random card named after a city, (3) Verifying card rarity matches city size, (4) Verifying card's population/military/resources are permanently added to player's totals, (5) Verifying card has airport/train/military unit data. / 可以通过以下步骤完整测试：（1）购买卡包，（2）收到一张以城市命名的随机卡牌，（3）验证卡牌稀有度与城市规模匹配，（4）验证卡牌的人口/军事/资源已永久添加到玩家总计中，（5）验证卡牌具有机场/火车/军事单位数据。

**Acceptance Scenarios / 验收场景**:

1. **Given** player has 5 tokens, **When** player purchases a card pack, **Then** tokens decrease by 5 and player receives 1 random card named after a city. / **给定**玩家有5代币，**当**玩家购买卡包，**则**代币减少5，玩家收到1张以城市命名的随机卡牌。

2. **Given** player receives a Common rarity card, **When** player views the card, **Then** card name is a small city with low population, military, and resources. / **给定**玩家收到普通稀有度卡牌，**当**玩家查看卡牌，**则**卡牌名称是一个小城市，具有低人口、军事和资源。

3. **Given** player receives an Ultra Legendary rarity card, **When** player views the card, **Then** card name is a very large city with very high population, military, and resources. / **给定**玩家收到超传说稀有度卡牌，**当**玩家查看卡牌，**则**卡牌名称是一个非常大的城市，具有极高人口、军事和资源。

4. **Given** player has a card with +5000 population, +100 military, +2000 resources, **When** player acquires the card, **Then** player's total population increases by 5000, military by 100, resources by 2000 permanently. / **给定**玩家有一张+5000人口、+100军事、+2000资源的卡牌，**当**玩家获得卡牌，**则**玩家的总人口永久增加5000，军事增加100，资源增加2000。

5. **Given** player has a card with 2 airports, 5 train stations, 10 military units, and 100 military strength, **When** player views the card, **Then** military units (10) ≠ military strength (100). / **给定**玩家有一张有2个机场、5个火车站、10个军事单位、100军事力量的卡牌，**当**玩家查看卡牌，**则**军事单位（10）≠ 军事力量（100）。

---

### User Story 6 - Player builds connections between controlled territories (Priority: P2) / 用户故事 6 - 玩家在控制的领土之间建立连接（优先级：P2）

**English**:
Player MUST be able to build connections between controlled territories: Air routes (shown as Airport), Train routes, and Military unit routes. Connections MUST provide benefits based on the type (airport boosts air transport, train boosts land transport, military units boost military movement). Player can only build connections using infrastructure from collected cards (e.g., to build an air route, player needs airports on collected cards).

**Why this priority / 优先级原因**: Connection system adds strategic layer to territory management. Airports, trains, and military units from cards enable different connection types. / 连接系统为领土管理增加了战略层。来自卡牌的机场、火车和军事单位启用不同类型的连接。

**Independent Test / 独立测试**: Can be fully tested by: (1) Selecting two adjacent owned territories, (2) Building an air route (requires airports on cards), (3) Building a train route (requires train stations on cards), (4) Building a military route (requires military units on cards), (5) Verifying connection benefits are applied. / 可以通过以下步骤完整测试：（1）选择两个相邻的拥有领土，（2）建立航空路线（需要卡牌上的机场），（3）建立火车路线（需要卡牌上的火车站），（4）建立军事路线（需要卡牌上的军事单位），（5）验证连接收益已应用。

**Acceptance Scenarios / 验收场景**:

1. **Given** player owns two adjacent territories and has cards with airports, **When** player builds an air route, **Then** air route connection is added and visual airport indicator appears on map. / **给定**玩家拥有两个相邻领土并有带有机场的卡牌，**当**玩家建立航空路线，**则**添加航空路线连接，地图上出现视觉机场指示器。

2. **Given** player owns two adjacent territories and has cards with train stations, **When** player builds a train route, **Then** train route connection is added and visual train indicator appears on map. / **给定**玩家拥有两个相邻领土并带有火车站的卡牌，**当**玩家建立火车路线，**则**添加火车路线连接，地图上出现视觉火车指示器。

3. **Given** player owns two adjacent territories and has cards with military units, **When** player builds a military route, **Then** military route connection is added and visual military indicator appears on map. / **给定**玩家拥有两个相邻领土并带有军事单位的卡牌，**当**玩家建立军事路线，**则**添加军事路线连接，地图上出现视觉军事指示器。

4. **Given** player has an air route connection, **When** player views resource panel, **Then** air transport efficiency is increased (faster resource movement between connected territories). / **给定**玩家有航空路线连接，**当**玩家查看资源面板，**则**航空运输效率提高（连接领土之间的资源移动更快）。

5. **Given** player has a train route connection, **When** player attacks from a connected territory, **Then** military movement speed is increased (cooldown reduced by 20%). / **给定**玩家有火车路线连接，**当**玩家从连接的领土攻击，**则**军事移动速度提高（冷却时间减少20%）。

---

### User Story 5 - Player forms alliances with other players (Priority: P3) / 用户故事 5 - 玩家与其他玩家组建联盟（优先级：P3）

**English**:
Player MUST be able to send alliance requests to other players. Alliances MUST provide benefits: shared vision, resource sharing, military support. Alliance members MUST be able to chat and coordinate strategies. Resource sharing mechanism: (1) Real-time sharing via WebSocket connection; (2) Shared resources are immediately available to both players; (3) Resource sharing is optional (player can choose which resources to share); (4) Shared resources are deducted from sender's totals and added to receiver's totals in real-time.

**Why this priority / 优先级原因**: Alliance system enables social gameplay. However, it requires multiplayer infrastructure (WebSocket), so it's lower priority. / 联盟系统启用社交游戏玩法。然而，它需要多人基础设施（WebSocket），所以优先级较低。

**Independent Test / 独立测试**: Can be fully tested by: (1) Sending alliance request, (2) Other player accepts, (3) Verifying alliance benefits (shared vision), (4) Testing resource sharing. / 可以通过以下步骤完整测试：（1）发送联盟请求，（2）其他玩家接受，（3）验证联盟福利（共享视野），（4）测试资源共享。

**Acceptance Scenarios / 验收场景**:

1. **Given** player A and player B are not allied, **When** player A sends alliance request, **Then** player B receives notification. / **给定**玩家A和玩家B未结盟，**当**玩家A发送联盟请求，**则**玩家B收到通知。

2. **Given** player B accepts alliance request, **When** alliance forms, **Then** both players can see each other's controlled territories. / **给定**玩家B接受联盟请求，**当**联盟形成，**则**两个玩家都能看到彼此控制的领土。

3. **Given** players are allied, **When** one player is attacked, **Then** ally receives notification and can send military support. / **给定**玩家已结盟，**当**一个玩家被攻击，**则**盟友收到通知并可以发送军事支援。

4. **Given** players are allied, **When** one player shares resources, **Then** other player receives the resources in real-time (via WebSocket). / **给定**玩家已结盟，**当**一个玩家共享资源，**则**另一个玩家实时收到资源（通过WebSocket）。

5. **Given** players are allied, **When** player A shares 100 gold with player B, **Then** player A's gold decreases by 100 and player B's gold increases by 100 immediately. / **给定**玩家已结盟，**当**玩家A与玩家B共享100金币，**则**玩家A的金币立即减少100，玩家B的金币立即增加100。

---

### User Story 7 - Player acquires and evolves weapons (Priority: P4 - Phase 3) / 用户故事 7 - 玩家获取并进化武器（优先级：P4 - 第3阶段）

**English**:
Player MUST be able to acquire weapons of 4 categories: Sea (海), Land (陆), Air (空), Cyber. Weapons can increase attack power OR increase defense capabilities. Weapons can be evolved to higher levels for increased effects (consumes more energy). Weapons CAN be obtained from card packs (random). Higher-level weapons require more territories and population to unlock. In multiplayer mode, weapons CAN be transferred between players, traded using tokens, and players CAN set custom prices. Game administrators MUST be able to release new weapons.

**Why this priority / 优先级原因**: Weapon system adds strategic depth and economy gameplay. However, it requires complete multiplayer infrastructure and admin tools, so it's reserved for Phase 3. / 武器系统增加了策略深度和经济游戏玩法。然而，它需要完整的多人基础设施和管理员工具，所以预留到第3阶段。

**Independent Test / 独立测试**: Can be fully tested by: (1) Admin releases a new weapon, (2) Player acquires weapon (from shop or card pack), (3) Player evolves weapon, (4) Player uses weapon for attack or defense, (5) Player transfers weapon to another player, (6) Player trades weapon with tokens. / 可以通过以下步骤完整测试：（1）管理员发布新武器，（2）玩家获取武器（从商店或卡包），（3）玩家进化武器，（4）玩家使用武器进行攻击或防御，（5）玩家将武器转移给另一个玩家，（6）玩家用代币交易武器。

**Acceptance Scenarios / 验收场景**:

1. **Given** game admin releases a new weapon, **When** weapon is released, **Then** weapon becomes available in game (based on unlock requirements). / **给定**游戏管理员发布新武器，**当**武器发布，**则**武器在游戏中可用（基于解锁要求）。

2. **Given** player meets territory and population requirements, **When** player acquires a "Sea" category weapon, **Then** weapon is added to player's arsenal (can be attack-type or defense-type). / **给定**玩家满足领土和人口要求，**当**玩家获取"海"类武器，**则**武器添加到玩家的武器库（可以是攻击型或防御型）。

3. **Given** player has an attack-type weapon, **When** player evolves the weapon to level 2, **Then** attack power increases but energy consumption also increases. / **给定**玩家有攻击型武器，**当**玩家将武器进化到2级，**则**攻击力增加但能量消耗也增加。

4. **Given** player has a defense-type weapon, **When** player evolves the weapon to level 2, **Then** defense capability increases but energy consumption also increases. / **给定**玩家有防御型武器，**当**玩家将武器进化到2级，**则**防御能力增加但能量消耗也增加。

5. **Given** player opens a card pack, **When** card pack contains a weapon card, **Then** player receives a random weapon (based on card rarity). / **给定**玩家打开卡包，**当**卡包包含武器卡，**则**玩家收到随机武器（基于卡牌稀有度）。

6. **Given** player has a weapon, **When** player transfers weapon to another player, **Then** weapon is removed from player's arsenal and added to recipient's arsenal. / **给定**玩家有武器，**当**玩家将武器转移给另一个玩家，**则**武器从玩家的武器库中移除并添加到接收者的武器库。

7. **Given** player wants to trade weapon, **When** player sets custom price in tokens, **Then** other players can purchase the weapon at that price. / **给定**玩家想交易武器，**当**玩家用代币设置自定义价格，**则**其他玩家可以按该价格购买武器。

8. **Given** player has 50 territories and 10000 population, **When** player views weapon shop, **Then** level 3+ weapons are unlocked and available for purchase. / **给定**玩家有50领土和10000人口，**当**玩家查看武器商店，**则**3级+武器解锁并可购买。

---

## Clarifications

### Session 2026-06-27

- Q: Can card effects stack? / 卡牌效果能否叠加？ → A: Yes, effects stack (effects accumulate) / 是的，效果叠加（效果累加）
- Q: How is battle outcome calculated? / 战斗结果如何计算？ → A: Military-based with randomness (win rate = (attacker/defender) × 100% ± 20%) / 基于军事的随机性（胜率 = (攻击方/防御方) × 100% ± 20%）
- Q: How does battle cooldown work? / 战斗冷却如何工作？ → A: Global cooldown (cannot attack any territory for 30s after any battle) / 全局冷却（任何战斗后30秒内无法攻击任何领土）
- Q: Should battle win rate be capped? / 战斗胜率是否应该设上限？ → A: Yes, cap at 10%-90% (always some uncertainty) / 是的，限制在10%-90%（总有一些不确定性）
- Q: What happens when player loses ALL territories? / 当玩家失去所有领土时会发生什么？ → A: Game over, player can restart the game, all resources/cards/weapons reset to initial state / 游戏结束，玩家可以重新开始游戏，所有资源/卡牌/武器重置为初始状态

### Session 2026-06-27 (Follow-up)

- Q: What are the card system requirements? / 卡牌系统要求是什么？ → A: Cards MUST be named after cities, have 6 rarities (Common, Rare, Super Rare, Mythic, Legendary, Ultra Legendary), provide permanent additions (+population, +military, +resources), include infrastructure (airports, train stations, military units), and military strength ≠ military units count. / 卡牌必须以来市命名，具有6种稀有度（普通、稀有、超级稀有、神话、传说、超传说），提供永久添加（ +人口、+军事、+资源），包括基础设施（机场、火车站、军事单位），且军事力量≠军事单位数量。
- Q: How do connections work? / 连接如何工作？ → A: Player MUST build Air routes (Airport), Train routes, and Military unit routes between controlled territories. Requires corresponding infrastructure from collected cards. / 玩家必须在控制的领土之间建立航空路线（机场）、火车路线和军事单位路线。需要来自已收集卡牌的相应基础设施。
- Q: How are weapons obtained? / 武器如何获得？ → A: Weapons CAN be obtained from Fighter card packs or Bomb card pack ONLY (not regular card packs). / 武器只能从Fighter卡包或Bomb卡包获得（不是普通卡包）。
- Q: Do higher-level weapons require more tokens to unlock? / 更高级别的武器需要更多代币来解锁吗？ → A: No, higher-level weapons do NOT require more tokens to unlock. Unlock requirements are based on territories and population only. / 不，更高级别的武器不需要更多代币来解锁。解锁要求仅基于领土和人口。

---

### Clarification Decision 1 - Session 2026-06-27

- **CD-001**: Q: Where should the authoritative game state be stored? / 游戏状态的权威存储应该在哪里？ → A: Frontend as authority (Option A). `GameState.js` manages all game state, backend only for persistence (every 30 seconds). / 前端作为权威（选项 A）。`GameState.js` 管理所有游戏状态，后端仅用于持久化（每30秒）。

- **CD-002**: Q: How is battle outcome calculated? / 战斗结果如何计算？ → A: Base 50% + (advantage × 5% per 10% military advantage) + random(-10%, +10%). Capped at 10%-90%. / 基础50% + (优势 × 每10%军事优势增加5%) + 随机(-10%, +10%)。限制在10%-90%。

- **CD-003**: Q: How are gift packs acquired in Phase 1? / 在第1阶段如何获取礼包？ → A: Only admin distribution (Option D). Player-initiated acquisition (e.g., buying with gold) is reserved for Phase2. / 仅管理员发放（选项 D）。玩家主动获取（例如用金币购买）预留到第2阶段。

- **CD-004**: Q: What is the gift pack data structure? / 礼包数据结构是什么？ → A: Configurable by admin (Option C). Admin can define contents (cards, gold, food, tokens, population) when creating gift pack. / 管理员可配置（选项 C）。管理员创建礼包时可以定义内容（卡牌、金币、食物、代币、人口）。

- **CD-005**: Q: What happens when backend is unavailable? / 当后端不可用时会发生什么？ → A: Silent failure + retry (Option C). Save operation silently fails and retries every 30 seconds, up to 3 retries before falling back to localStorage. / 静默失败+重试（选项 C）。保存操作静默失败并每30秒重试一次，最多3次重试后回退到 localStorage。

---

### Edge Cases / 边界情况

**English** | **中文**

- What happens when player's military is 0 and they are attacked? / 当玩家的军事为0且被攻击时会发生什么？
  - **Clarified / 已澄清**: Player automatically loses territory if military = 0. Territory is recaptured by AI or becomes neutral. / 如果军事=0，玩家自动失去领土。领土被AI夺回或变为中立。

- What happens when player runs out of food? / 当玩家耗尽食物时会发生什么？
  - **Clarified / 已澄清**: Military strength decreases by 10% per minute until food > 0 or military = 0. / 军事力量每分钟减少10%，直到食物>0或军事=0。

- What happens when player has negative tokens? / 当玩家有负代币时会发生什么？
  - **Clarified / 已澄清**: Player cannot purchase card packs or use token-costing features. Can still earn tokens from quizzes and battles. / 玩家无法购买卡包或使用消耗代币的功能。仍可以从问答和战斗中获得代币。

- What happens when player conquers all territories on Earth? / 当玩家征服地球上所有领土时会发生什么？
  - **Clarified / 已澄清**: Player wins the game and can choose to continue playing on Mars or restart. / 玩家赢得游戏，可以选择继续在火星上玩或重新开始。

- What happens when player loses ALL territories? / 当玩家失去所有领土时会发生什么？
  - **Clarified / 已澄清**: Game over. Player can restart the game, all resources/cards/weapons reset to initial state. / 游戏结束。玩家可以重新开始游戏，所有资源/卡牌/武器重置为初始状态。

- What happens when player disconnects during battle? / 当玩家在战斗中断开连接时会发生什么？
  - **Clarified / 已澄清**: Battle continues in background (server-side). Player can reconnect and see battle result. / 战斗在后台继续（服务器端）。玩家可以重新连接并查看战斗结果。

- What happens when multiple players attack the same territory? / 当多个玩家攻击同一领土时会发生什么？
  - **Clarified / 已澄清**: First attack resolves. If defender wins, second attack is repelled. If defender loses, second attacker fights the first attacker for control. / 第一次攻击解决。如果防御者获胜，第二次攻击被击退。如果防御者失败，第二个攻击者与第一攻击者争夺控制权。

---

## Requirements *(mandatory)* / 需求 *(必填)*

### Functional Requirements / 功能性需求

**English** | **中文**

- **FR-001**: System MUST display an interactive SVG map with zoom (scroll wheel) and pan (drag) controls. Map MUST support both mouse and touch interactions. / 系统必须显示具有缩放（滚轮）和平移（拖动）控件的交互式SVG地图。地图必须支持鼠标和触摸交互。

- **FR-002**: System MUST allow players to conquer adjacent territories through battles. Battle outcome MUST be determined by the following formula: Base 50% + (advantage × 5% per 10% military advantage) + random(-10%, +10%). Final win rate MUST be capped at 10%-90%. System MUST show a front line according to battle casualties and territories. Front line visualization: (1) SVG overlay on map showing front line as a dashed red/blue gradient line between attacking and defending territories; (2) Line position calculated based on casualty ratio (attacker casualties vs defender casualties); (3) If attacker has 70%+ casualties, front line shifts toward attacker's territory; (4) Front line updates in real-time during battle (every 5 seconds); (5) Tooltip shows current casualty numbers and territory control percentage. / 系统必须允许玩家通过战斗征服相邻领土。战斗结果必须由以下公式计算：基础50% + (优势 × 每10%军事优势增加5%) + 随机(-10%, +10%)。最终胜率必须限制在10%-90%。系统必须根据战斗伤亡和领土显示前线。前线可视化：(1) 地图上的SVG叠加层显示前线，显示为攻击者和防御者领土之间的红色/蓝色渐变虚线；(2) 线条位置根据伤亡比率计算（攻击者伤亡 vs 防御者伤亡）；(3) 如果攻击者伤亡70%+，前线向攻击者领土移动；(4) 前线在战斗期间实时更新（每5秒）；(5) 工具提示显示当前伤亡数字和领土控制百分比。

- **FR-003**: System MUST implement military training system. Training military costs 1k population + 5 tokens per 10 military strength. / 系统必须实现军事训练系统。训练军事消耗1k人口 + 5代币，获得10军事力量。

- **FR-004**: System MUST implement resource types: Population (auto-grows every 10s), Gold (CANNOT be earned automatically; only from gift packages/random drops triggered by admin, or from chests found in territories), Food (consumed by military), Tokens (earned from quizzes and battles, +1 token per victory). / 系统必须实现资源类型：人口（每10秒自动增长）、金币（不能自动获得；只能从管理员触发的礼包/随机掉落获得，或从领土中发现的宝箱获得）、食物（被军事消耗）、代币（从问答和战斗获得，每次胜利+1代币）。

- **FR-005**: System MUST display resources in UI (top bar or side panel). Resources MUST update in real-time (every second for display, actual calculation every 10 seconds). / 系统必须在UI中显示资源（顶部栏或侧面板）。资源必须实时更新（显示每秒更新，实际计算每10秒一次）。

- **FR-006**: System MUST implement card system with rarities (Common, Rare, Super Rare, Mythic, Legendary, Ultra Legendary). Cards MUST be named after cities. Lower rarity = smaller city with lower population, military, and resources. Card effects are PERMANENT additions (not stackable in the traditional sense): when a card is acquired, its population, military, resources, airports, train stations, and military units are permanently added to the player's totals. Cards are NOT single-use "booster" cards. Each card also has its own infrastructure: number of airports, train stations, and military units (military strength ≠ military units). / 系统必须实现具有稀有度的卡牌系统（普通、稀有、超级稀有、神话、传说、超传说）。卡牌必须以来市命名。较低稀有度=较小的城市，人口、军事和资源较少。卡牌效果是永久性添加（不是传统意义上的可叠加）：当获得卡牌时，其人口、军事、资源、机场、火车站和军事单位会永久添加到玩家的总计中。卡牌不是一次性"增强"卡牌。每张卡牌还具有自己的基础设施：机场数量、火车站数量和军事单位数量（军事力量≠军事单位）。

- **FR-007**: System MUST implement connection system. Player MUST be able to build connections between controlled territories: Air routes (shown as Airport), Train routes, and Military unit routes. Connections MUST provide benefits based on type: (1) Air routes: +20% air transport efficiency (reduced travel time for air transport between connected territories); (2) Train routes: +20% land transport speed (reduced travel time for land units); (3) Military routes: +20% military movement speed (reduced movement time for military units). Connection benefits are cumulative (building multiple air routes adds +20% per route, up to +100% maximum). Player can only build connections using infrastructure from collected cards (total airports from all cards, total train stations from all cards, total military units from all cards). / 系统必须实现连接系统。玩家必须能够在控制的领土之间建立连接：航空路线（显示为机场）、火车路线和军事单位路线。连接必须根据类型提供收益：(1) 航空路线：+20%航空运输效率（减少连接领土之间的航空运输时间）；(2) 火车路线：+20%陆地运输速度（减少陆地单位移动时间）；(3) 军事路线：+20%军事移动速度（减少军事单位移动时间）。连接收益是累积的（建造多个航空路线每个增加+20%，最高+100%）。玩家只能使用来自已收集卡牌的基础设施建立连接（所有卡牌的总机场数、所有卡牌的总火车站数、所有卡牌的总军事单位数）。

- **FR-008**: System MUST implement alliance system (Phase 2, requires WebSocket infrastructure). Alliances MUST provide shared vision and resource sharing. / 系统必须实现联盟系统（第2阶段，需要WebSocket基础设施）。联盟必须提供共享视野和资源共享。

- **FR-009**: System MUST enforce battle cooldown (30 seconds to 5 minutes) after each battle. Cooldown duration is based on battle intensity. During cooldown, player cannot attack ANY territory (global cooldown). / 系统必须在每次战斗后执行战斗冷却（30秒到5分钟）。冷却持续时间基于战斗强度。冷却期间，玩家无法攻击任何领土（全局冷却）。

- **FR-010**: System MUST unlock Mars world after player conquers 90% of Earth territories. Mars MUST have separate map, territories, and resources. / 系统必须在玩家征服90%地球领土后解锁火星世界。火星必须有独立的地图、领土和资源。

- **FR-011**: System MUST save game state automatically every 30 seconds and on every significant action (battle win/loss, card use, resource change > 100). / 系统必须每30秒自动保存游戏状态，并在每个重要操作时保存（战斗胜负、卡牌使用、资源变化>100）。

- **FR-012**: System MUST load saved game state on login. If cloud save exists, it MUST be loaded. Otherwise, local save (localStorage) MAY be used as fallback. / 系统必须在登录时加载保存的游戏状态。如果存在云存档，必须加载。否则，可以使用本地存档（localStorage）作为后备。

- **[Phase 3] FR-013**: System MUST implement weapon system with 4 categories: Sea (海), Land (陆), Air (空), Cyber. Each weapon can increase attack power OR defense capabilities. Weapons have evolution levels and energy consumption. Weapons CAN be obtained from Fighter card packs or Bomb card pack (NOT regular card packs). / 系统必须实现武器系统，包含4个类别：海、陆、空、Cyber。每个武器可以增加攻击力或防御能力。武器有进化等级和能量消耗。武器可以从Fighter卡包或Bomb卡包获得（不是普通卡包）。

- **[Phase 3] FR-014**: System MUST allow weapon evolution. Higher evolution levels provide increased effects (attack or defense) but consume more energy. Evolution requires resources (gold/food). Tokens are NOT required for weapon evolution. / 系统必须允许武器进化。更高的进化等级提供增加的效果（攻击或防御）但消耗更多能量。进化需要资源（金币/食物）。武器进化不需要代币。

- **[Phase 3] FR-015**: System MUST enforce weapon unlock requirements. Higher-level weapons require minimum territories and population to unlock. IMPORTANT: Higher-level weapons do NOT require more tokens to unlock (tokens are NOT part of unlock requirements). / 系统必须执行武器解锁要求。更高级别的武器需要最低领土和人口才能解锁。重要提示：更高级别的武器不需要更多代币来解锁（代币不是解锁要求的一部分）。

- **[Phase 3] FR-016**: System MUST support weapon trading in multiplayer mode. Weapons CAN be transferred between players, traded using tokens, with custom prices set by the seller. / 系统必须在多人模式中支持武器交易。武器可以在玩家之间转移，使用代币交易，由卖家设置自定义价格。

- **[Phase 3] FR-017**: System MUST allow game administrators to release new weapons via admin panel/API. New weapons MUST have configurable attributes (category, weapon type, effect value, energy cost, evolution levels, unlock requirements). / 系统必须允许游戏管理员通过管理面板/API发布新武器。新武器必须具有可配置的属性（类别、武器类型、效果值、能量消耗、进化等级、解锁要求）。

- **[Phase 3] FR-018**: System MUST allow players to obtain weapons from Fighter card packs or Bomb card pack ONLY. Regular card packs (for city cards) CANNOT contain weapons. Fighter/Bomb card packs CAN contain weapon cards (random, based on rarity). / 系统必须允许玩家只能从Fighter卡包或Bomb卡包中获得武器。普通卡包（用于城市卡牌）不能包含武器。Fighter/Bomb卡包可以包含武器卡（随机，基于稀有度）。

---

### Key Entities *(include if feature involves data)* / 关键实体 *(如果功能涉及数据)*

#### Territory / 领土

**English**:
- **Fields / 字段**: id, name, owner (player/AI/neutral), military, population, resources (gold/food), adjacent territories list, connections list
- `owner`: Can be "player", "ai-[faction]", or "neutral" / 可以是"player"、"ai-[faction]"或"neutral"
- `military`: Defensive military strength / 防御军事力量
- `adjacent`: Array of territory IDs that are geographically adjacent / 地理上相邻的领土ID数组

#### PlayerState / 玩家状态

**English**:
- **Fields / 字段**: player (object), territories (array), resources (object), military (total), cards (array), cardCollection (array), alliances (array), cooldowns (object), connections (array), weapons (array), infrastructure (object)
- `player`: Player info (name, flag, level, tokens) / 玩家信息（姓名、旗帜、等级、代币）
- `territories`: Array of conquered territory IDs / 征服的领土ID数组
- `resources`: { population, gold, food, tokens } / {人口、金币、食物、代币}
- `military`: Total military strength (sum of all territory military + player military + cards' military) / 总军事力量（所有领土军事+玩家军事+卡牌军事的总和）
- `cards`: Array of card objects available for use / 可用于使用的卡牌对象数组
- `cardCollection`: Array of all acquired cards (permanent collection) / 所有已获得卡牌的数组（永久收集）
- `infrastructure`: { totalAirports, totalTrainStations, totalMilitaryUnits } / { 总机场数、总火车站数、总军事单位数 }
- `weapons`: Array of weapon objects in arsenal / 武器库中的武器对象数组
- `cooldowns`: { battle: timestamp, quiz: timestamp } / {战斗：时间戳，问答：时间戳}

#### Card / 卡牌

**English**:
- **Fields / 字段**: id, name, rarity, population, military, resources, airports, trainStations, militaryUnits
- `name`: City name (e.g., "Beijing", "Shanghai", "Tokyo") / 城市名称（例如"北京"、"上海"、"东京"）
- `rarity`: Common, Rare, Super Rare, Mythic, Legendary, Ultra Legendary / 普通、稀有、超级稀有、神话、传说、超传说
- `population`: Population added to player's total (permanent) / 添加到玩家总计的人口（永久）
- `military`: Military strength added to player's total (permanent, does NOT equal militaryUnits) / 添加到玩家总计的军事力量（永久，不等于militaryUnits）
- `resources`: Resources added to player's total (permanent) / 添加到玩家总计的资源（永久）
- `airports`: Number of airports on this card / 此卡牌上的机场数量
- `trainStations`: Number of train stations on this card / 此卡牌上的火车站数量
- `militaryUnits`: Number of military units on this card (≠ military strength) / 此卡牌上的军事单位数量（≠军事力量）
- **Note**: When card is acquired, all fields (population, military, resources, airports, trainStations, militaryUnits) are permanently added to player's totals. Cards are NOT consumed on use. / **注意**：当获得卡牌时，所有字段（人口、军事、资源、机场、火车站、军事单位）都会永久添加到玩家的总计中。卡牌在使用时不会被消耗。

#### Connection / 连接

**English**:
- **Fields / 字段**: id, territory1, territory2, type, bonus
- `type`: airport (air route), train (train route), military (military route) / 机场（航空路线）、火车（火车路线）、军事（军事路线）
- `bonus`: { air_efficiency: +20%, train_speed: +20%, military_speed: +20% } / { 航空效率：+20%，火车速度：+20%，军事速度：+20% }
- **Requirement**: Player MUST have corresponding infrastructure from collected cards to build connections (airports for air routes, train stations for train routes, military units for military routes). / **要求**：玩家必须拥有来自已收集卡牌的相应基础设施才能建立连接（航空路线需要机场，火车路线需要火车站，军事路线需要军事单位）。

#### Alliance / 联盟

**English**:
- **Fields / 字段**: id, player1, player2, status, benefits
- `status`: pending, active, broken / 待定、活跃、破裂
- `benefits`: { shared_vision: true/false, resource_sharing: true/false, military_support: true/false } / {共享视野：true/false，资源共享：true/false，军事支援：true/false}

#### Weapon / 武器

**English**:
- **Fields / 字段**: id, name, category, weaponType, effectValue, energyCost, level, evolutionLevels, unlockRequirements, tradeable
- `category`: sea (海), land (陆), air (空), cyber. Category differences: (1) Sea weapons boost naval attacks and defense (apply to territories with sea access); (2) Land weapons boost land-based attacks and defense (apply to all territories); (3) Air weapons boost air transport and aerial attacks (apply to territories with airports); (4) Cyber weapons boost technology-based attacks and defense (apply to all territories, but require technology infrastructure).
- `weaponType`: "attack" or "defense" / "攻击"或"防御"
- `effectValue`: Attack power or defense value (increases with evolution) / 攻击力或防御值（随进化增加）
- `energyCost`: Energy consumed per use (increases with evolution) / 每次使用消耗的能量（随进化增加）
- `level`: Current evolution level (0 = base, max = evolutionLevels) / 当前进化等级（0=基础，最大=evolutionLevels）
- `evolutionLevels`: Maximum evolution levels / 最大进化等级
- `unlockRequirements`: { minTerritories, minPopulation, minLevel } / { 最小领土数，最小人口，最小等级 }
- `tradeable`: Whether weapon can be traded (true/false) / 武器是否可以交易（true/false）

#### Chest / 宝箱

**English**:
- **Fields / 字段**: id, type, territoryId, spawnChance, lootTable
- `type`: "normal" or "giant" / "普通"或"巨型"
- `territoryId`: ID of territory where chest spawns / 宝箱生成的领土ID
- `spawnChance`: Spawn chance per territory (normal: 8%, giant: 0.5%) / 每个领土的生成几率（普通：8%，巨型：0.5%）
- `lootTable`: Probility distribution for loot / 战利品概率分布
  - Normal chest / 普通宝箱: { gold: 40% (≤500 gold), no_gold: 60% } / { 金币：40%（≤500金币），无金币：60% }
  - Giant chest / 巨型宝箱: { gold_6k: 67% (≤6k gold), gold_15k: 30% (≤15k gold), no_gold: 3% } / { 金币_6k：67%（≤6k金币），金币_15k：30%（≤15k金币），无金币：3% }

#### GiftPack / 礼包

**English**:
- **Fields / 字段**: id, name, description, contents, rarity, createdBy, createdAt
- `name`: Gift pack name (e.g., "Welcome Gift", "Daily Bonus") / 礼包名称（例如"欢迎礼包"、"每日奖励"）
- `description`: Gift pack description / 礼包描述
- `contents`: Configurable contents (admin-defined) / 可配置内容（管理员定义）
  - `cards`: Array of card objects or { rarity: weight } for random generation / 卡牌对象数组或 { 稀有度：权重 } 用于随机生成
  - `gold`: Amount of gold / 金币数量
  - `food`: Amount of food / 食物数量
  - `tokens`: Amount of tokens / 代币数量
  - `population`: Amount of population / 人口数量
- `rarity`: Gift pack rarity (affects drop chance if randomly distributed) / 礼包稀有度（如果随机分配，影响掉落几率）
- `createdBy`: Admin user ID who created this gift pack / 创建此礼包的管理员用户ID
- `createdAt`: Timestamp when gift pack was created / 创建礼包的时间戳

**Note**: In Phase 1, gift packs can ONLY be created by game administrators via admin API/panel. Player-initiated gift pack acquisition is reserved for Phase 2. / **注意**：在第1阶段，礼包只能由游戏管理员通过管理API/面板创建。玩家主动获取礼包预留到第2阶段。

---

## Success Criteria *(mandatory)* / 成功标准 *(必填)*

### Measurable Outcomes / 可衡量结果

**English** | **中文**

- **SC-001**: Battle outcome is determined within 3 seconds of starting battle (tested via automated test). / 战斗结果在战斗开始后3秒内确定（通过自动化测试）。

- **SC-002**: Resource display updates in real-time (every second) without performance degradation (tested via browser DevTools). / 资源显示实时更新（每秒）且无性能下降（通过浏览器开发工具测试）。

- **SC-003**: Card effects are applied correctly (tested via unit tests for each card type). / 卡牌效果正确应用（通过每种卡牌类型的单元测试）。

- **SC-004**: Game state saves successfully every 30 seconds without errors (tested via console logs and network monitoring). / 游戏状态每30秒成功保存且无错误（通过控制台日志和网络监控测试）。

- **SC-005**: Player can switch between Earth and Mars worlds seamlessly (tested via manual testing). / 玩家可以无缝切换地球和火星世界（通过手动测试）。

- **SC-006**: 90% of gameplay actions (battle, card use, resource management) complete without errors (tracked via analytics). / 90%的游戏操作（战斗、卡牌使用、资源管理）无错误完成（通过分析报告跟踪）。

- **SC-007**: Connection system benefits are correctly applied and displayed (tested via manual testing and unit tests). / 连接系统收益正确应用和显示（通过手动测试和单元测试）。

---

**[Phase 3 Content - See Assumptions Section]**

The following success criteria are for Phase 3 (Weapon System):
/ 以下内容为第3阶段（武器系统）：

- **SC-008** (Phase 3): Weapon system allows both attack and defense type weapons (tested via unit tests). / 武器系统允许攻击型和防御型武器（通过单元测试）。

- **SC-009** (Phase 3): Players can obtain weapons from card packs (tested via gameplay). / 玩家可以从卡包中获得武器（通过游戏测试）。

---

## Assumptions / 假设

**English** | **中文**

- Player level is stored in `users` table (global attribute, not per-game-save). Level increases by earning XP from battles and quizzes. / 玩家等级存储在`users`表中（全局属性，不是每个游戏存档）。等级通过从战斗和问答中获得经验值提升。

- Game state is stored as JSON in `game_saves` table (backend) and localStorage (frontend fallback). / 游戏状态以JSON格式存储在`game_saves`表中（后端）和localStorage（前端后备）。

- Military training costs 1k population + 5 tokens per 10 military strength. Population auto-grows based on number of controlled territories (100 population/territory/10 seconds). / 军事训练每10军事力量消耗1k人口 + 5代币。人口根据控制的领土数量自动增长（100人口/领土/10秒）。

- Food is consumed by military units (1 food per 10 military per minute). If food = 0, military strength decreases. / 食物被军事单位消耗（每分钟每10军事消耗1食物）。如果食物=0，军事力量减少。

- Gold CANNOT be earned automatically from territories. Gold can only be earned from: (1) Gift packages/random drops triggered by admin, (2) Chests found randomly in territories. / 金币不能从领土自动获得。金币只能从以下方式获得：（1）管理员触发的礼包/随机掉落，（2）在领土中随机发现的宝箱。

- Each territory has 8% chance of spawning with a chest, 0.5% chance spawning with a giant chest. / 每个领土有8%的几率生成普通宝箱，0.5%的几率生成巨型宝箱。

- Normal chest loot: 40% chance of 500 gold or below, 60% chance of no gold. / 普通宝箱战利品：40%几率获得500金币或以下，60%几率无金币。

- Giant chest loot: 67% chance of 6k gold or below, 30% chance of 15k gold or below, 3% chance of no gold. / 巨型宝箱战利品：67%几率获得6k金币或以下，30%几率获得15k金币或以下，3%几率无金币。

- Tokens are earned from quizzes (variable based on difficulty) and battles (1 token/victory). Tokens are used to buy card packs (5 tokens/pack) and train military (5 tokens per training). / 代币从问答获得（根据难度变化）和战斗（1代币/胜利）。代币用于购买卡包（5代币/包）和训练军事（每次训练消耗5代币）。

- Card packs contain 1 random card named after a city. Card rarity distribution: Common (40%), Rare (25%), Super Rare (15%), Mythic (10%), Legendary (7%), Ultra Legendary (3%). Lower rarity = smaller city with lower population, military, and resources. / 卡包包含1张以来市命名的随机卡牌。卡牌稀有度分布：普通（40%）、稀有（25%）、超级稀有（15%）、神话（10%）、传说（7%）、超传说（3%）。较低稀有度=较小的城市，人口、军事和资源较少。

- Connections provide resource bonuses. Building a connection costs gold (100 gold/connection). / 连接提供资源奖励。建立连接消耗金币（100金币/连接）。

- Alliance system requires WebSocket infrastructure for real-time communication. This is Phase 2 feature. / 联盟系统需要WebSocket基础设施进行实时通信。这是第2阶段功能。

- Mars world is unlocked after conquering 90% of Earth. Mars has different territories, resources, and challenges. / 火星世界在征服90%地球后解锁。火星有不同的领土、资源和挑战。

- Game is single-player vs AI for Phase 1. Multiplayer (alliances, PvP) is Phase 2. / 第1阶段游戏是单人vs AI。多人游戏（联盟、PvP）是第2阶段。

- Frontend is the authoritative source for game state. `GameState.js` manages all game logic and state. Backend is ONLY responsible for authentication, data persistence (every 30 seconds), and quiz system. Game state MUST NOT be stored in SCF function memory (Constitution Principle III). / 前端是游戏状态的权威来源。`GameState.js` 管理所有游戏逻辑和状态。后端仅负责身份验证、数据持久化（每30秒）和问答系统。游戏状态不得存储在 SCF 函数内存中（宪法原则 III）。

- Save/Load system uses cloud save (backend API) with localStorage fallback for offline play. / 保存/加载系统使用云存档（后端API），localStorage作为离线游戏的后备。

- **Backend failure handling / 后端失败处理**: If backend is unreachable (network disconnect, SCF failure), game MUST continue. Save operation MUST silently fail and retry every 30 seconds, up to 3 retries before falling back to localStorage. Player MUST be notified when game switches to localStorage mode. / 如果后端不可达（网络断开、SCF 失败），游戏必须继续。保存操作必须静默失败并每30秒重试一次，最多3次重试后回退到 localStorage。当游戏切换到 localStorage 模式时，必须通知玩家。

- Battle system is auto-battle (deterministic based on military strength + randomness). Player cannot manually control battle. / 战斗系统是自动战斗（基于军事力量+随机性的确定性）。玩家无法手动控制战斗。

- Map is SVG-based (vector graphics) for scalability and performance. Map data (territory paths, adjacent lists) is hardcoded in frontend for Phase 1, moved to backend in Phase 2. / 地图基于SVG（矢量图形）以实现可扩展性和性能。地图数据（领土路径、相邻列表）在第1阶段硬编码在前端，第2阶段移至后端。

- Weapon system is reserved for Phase 3 (not implemented in Phase 1 or 2). / 武器系统预留到第3阶段（不在第1或2阶段实现）。

> **Note**: Detailed weapon system assumptions (categories, evolution, trading, etc.) are defined in Phase 3 spec. / **注意**：详细的武器系统假设（类别、进化、交易等）在第3阶段spec中定义。



---

## Implementation Notes / 实现说明

### Current Implementation Status / 当前实现状态

| Feature / 功能 | Status / 状态 | Location / 位置 | Notes / 备注 |
|---------|--------|----------|-------|
| Map SVG rendering / 地图SVG渲染 | ✅ Implemented / 已实现 | `frontend/src/main.js` - `drawMap()` | Zoom/pan works, Earth + Mars maps / 缩放/平移工作，地球+火星地图 |
| Territory selection / 领土选择 | ✅ Implemented / 已实现 | `frontend/src/main.js` - `selectCountry()` | Adjacency check works / 相邻性检查工作 |
| Auto-battle / 自动战斗 | ✅ Implemented (basic) / 已实现（基础） | `frontend/src/main.js` - `autoBattle()` | Needs military training integration / 需要军事训练集成 |
| Population growth / 人口增长 | ✅ Implemented / 已实现 | `frontend/src/main.js` - `startGameLoop()` | 100 pop/territory/10s / 100人口/领土/10秒 |
| Token rewards / 代币奖励 | ✅ Implemented / 已实现 | `frontend/src/main.js` - `resolveBattle()` | +1 token/victory / +1代币/胜利 |
| Cooldown system / 冷却系统 | ✅ Implemented / 已实现 | `frontend/src/main.js` - `showCooldown()` | 30s-5min cooldown after battle / 战斗后30秒-5分钟冷却 |
| Card data structure / 卡牌数据结构 | ✅ Implemented / 已实现 | `frontend/src/game/GameState.js` | Cards array exists, no effects / 卡牌数组存在，无效果 |
| Card shop / 卡牌商店 | ⚠️ Partial / 部分实现 | `frontend/src/main.js` - `showShopScreen()` | Buys card but no effect / 购买卡牌但无效果 |
| Connection data / 连接数据 | ⚠️ Data only / 仅数据 | `frontend/src/game/GameState.js` | `connections` array exists / `connections`数组存在 |
| Resource display / 资源显示 | ❌ Not implemented / 未实现 | - | Need gold, food display / 需要金币、食物显示 |
| Military training / 军事训练 | ❌ Not implemented / 未实现 | - | Need training UI and logic / 需要训练UI和逻辑 |
| Alliance system / 联盟系统 | ❌ Not implemented / 未实现 | - | Requires WebSocket (Phase 2) / 需要WebSocket（第2阶段） |
| Mars world / 火星世界 | ⚠️ Partial / 部分实现 | `frontend/src/main.js` - `switchWorld()` | Map exists, no unique mechanics / 地图存在，无独特机制 |
| Weapon system / 武器系统 | ⏸️ Reserved / 预留 | - | Phase 3 feature, not in first version / 第3阶段功能，不在第一版实现 |
| Card pack weapon cards / 卡包武器卡 | ⏸️ Reserved / 预留 | - | Phase 3 feature / 第3阶段功能 |

---

### Code Changes Required / 需要的代码更改

#### 1. **Military Training System** (Priority: P1) / **军事训练系统**（优先级：P1）

**Files to modify / 要修改的文件:**
- `frontend/src/main.js` - Add `trainMilitary()` function / 添加`trainMilitary()`函数
- `frontend/src/main.js` - Add military training UI (button + cost display) / 添加军事训练UI（按钮+成本显示）
- `frontend/src/styles/components.css` - Style training UI / 设置训练UI样式

**Implementation / 实现:**
```javascript
function trainMilitary() {
    const popCost = 1000; // population cost / 人口成本
    const tokenCost = 5;    // token cost / 代币成本
    const gain = 10;          // military gain / 军事收益
    if (GameState.player.population >= popCost && GameState.player.tokens >= tokenCost) {
        GameState.player.population -= popCost;
        GameState.player.tokens -= tokenCost;
        GameState.player.military += gain;
        updateUI();
        saveGame();
        notify('Military Trained / 军事已训练', `+${gain} military strength / +${gain}军事力量`);
    } else {
        notify('Not Enough Resources / 资源不足', `Need ${popCost} population and ${tokenCost} tokens / 需要${popCost}人口和${tokenCost}代币`);
    }
}
```

---

#### 2. **Resource Management System** (Priority: P1) / **资源管理系统**（优先级：P1）

**Files to modify / 要修改的文件:**
- `frontend/src/game/GameState.js` - Add gold, food to `player` object / 向`player`对象添加金币、食物
- `frontend/src/main.js` - Add resource calculation in `startGameLoop()` / 在`startGameLoop()`中添加资源计算
- `frontend/src/main.js` - Update `updateUI()` to display resources / 更新`updateUI()`以显示资源
- `frontend/src/styles/components.css` - Style resource display / 设置资源显示样式

**Implementation / 实现:**
```javascript
// In startGameLoop() / 在startGameLoop()中
const resourceTimer = setInterval(() => {
    const owned = GameState.player.territories.length;
    // Population auto-grows / 人口自动增长
    GameState.player.population += owned * 100;
    
    // Food is consumed by military / 食物被军事消耗
    GameState.player.food -= GameState.player.military * 0.1;
    
    // Gold does NOT auto-grow - only from chests/gift packages / 金币不自动增长 - 只能从宝箱/礼包获得
    // GameState.player.gold += ...  // ❌ REMOVED - violates FR-004
    
    if (GameState.player.food < 0) {
        GameState.player.military *= 0.9; // starvation penalty / 饥饿惩罚
        GameState.player.food = 0;
    }
    updateUI();
}, 10000);
```

---

#### 3. **Card Collection System** (Priority: P2) / **卡牌收集系统**（优先级：P2）

**Files to modify / 要修改的文件:**
- `frontend/src/main.js` - Implement `acquireCard(cardId)` function / 实现`acquireCard(cardId)`函数
- `frontend/src/game/cardRarities.js` - Define card data (city names, rarities, population, military, resources, airports, trainStations, militaryUnits) / 定义卡牌数据（城市名称、稀有度、人口、军事、资源、机场、火车站、军事单位）
- `frontend/src/main.js` - Update `showCardsScreen()` to display card collection / 更新`showCardsScreen()`以显示卡牌收集
- `frontend/src/styles/components.css` - Style card display / 设置卡牌显示样式

**Implementation / 实现:**
```javascript
// Card data structure / 卡牌数据结构
const CARD_DATABASE = {
    common: [
        { name: "Small Town A", population: 1000, military: 10, gold: 500, food: 200, airports: 0, trainStations: 1, militaryUnits: 5 },
        { name: "Small Town B", population: 1200, military: 12, gold: 600, food: 250, airports: 0, trainStations: 1, militaryUnits: 6 },
        // ... more common cards / 更多普通卡牌
    ],
    rare: [
        { name: "Medium City A", population: 5000, military: 50, gold: 2500, food: 1000, airports: 1, trainStations: 3, militaryUnits: 25 },
        // ... more rare cards / 更多稀有卡牌
    ],
    ultra_legendary: [
        { name: "Mega Metropolis", population: 50000, military: 500, gold: 25000, food: 10000, airports: 5, trainStations: 20, militaryUnits: 250 },
        // ... more ultra legendary cards / 更多超传说卡牌
    ]
};

function acquireCard(cardId) {
    const card = CARD_DATABASE[cardId.rarity].find(c => c.name === cardId.name);
    if (!card) return;
    
    // PERMANENT addition to player's totals / 永久添加到玩家总计
    GameState.player.population += card.population;
    GameState.player.military += card.military;
    GameState.player.resources.gold += card.gold;  // Fix: use resources.gold / 修复：使用 resources.gold
    GameState.player.resources.food += card.food;  // Fix: use resources.food / 修复：使用 resources.food
    GameState.player.totalAirports += card.airports;
    GameState.player.totalTrainStations += card.trainStations;
    GameState.player.totalMilitaryUnits += card.militaryUnits;
    
    // Add card to collection (not removed on use) / 添加卡牌到收集（使用时不会移除）
    GameState.player.cardCollection.push(card);
    
    updateUI();
    saveGame();
    notify('Card Acquired / 获得卡牌', `Added ${card.name} to your collection! / 将${card.name}添加到你的收集中！`);
}

// Note: Cards are NOT consumed on use - they provide permanent bonuses / 注意：卡牌在使用时不会被消耗 - 它们提供永久奖励
```

---

#### 4. **Connection System** (Priority: P2) / **连接系统**（优先级：P2）

**Files to modify / 要修改的文件:**
- `frontend/src/main.js` - Implement `buildConnection(territory1, territory2)` function / 实现`buildConnection(territory1, territory2)`函数
- `frontend/src/main.js` - Add connection building UI / 添加连接建设UI
- `frontend/src/main.js` - Update resource calculation to include connection bonus / 更新资源计算以包含连接奖励

**Implementation / 实现:**
```javascript
function buildConnection(t1, t2) {
    const cost = 100; // gold cost / 金币成本
    if (GameState.player.gold >= cost) {
        GameState.player.gold -= cost;
        GameState.connections.push({ 
            id: Date.now(), 
            t1, 
            t2, 
            type: 'road', 
            bonus: { resource_rate: 10 } 
        });
        updateUI();
        saveGame();
        notify('Connection Built / 连接已建立', `Road between ${t1} and ${t2} / ${t1}和${t2}之间的道路`);
    } else {
        notify('Not Enough Gold / 金币不足', `Need ${cost} gold / 需要${cost}金币`);
    }
}
```

---

#### 5. **Chest System** (Priority: P1) / **宝箱系统**（优先级：P1）

**Files to modify / 要修改的文件:**
- `frontend/src/game/chests.js` - Chest data and logic / 宝箱数据和逻辑
- `frontend/src/main.js` - Implement chest spawning and loot / 实现宝箱生成和战利品
- `frontend/src/main.js` - Add chest UI (open chest animation) / 添加宝箱UI（打开宝箱动画）
- `frontend/src/styles/components.css` - Style chest UI / 设置宝箱UI样式

**Implementation / 实现:**
```javascript
// Chest spawning / 宝箱生成
function spawnChest(territoryId) {
    const rand = Math.random() * 100;
    let chestType = null;
    if (rand < 0.5) {
        chestType = 'giant'; // 0.5% chance / 0.5%几率
    } else if (rand < 8.5) {
        chestType = 'normal'; // 8% chance / 8%几率
    }
    
    if (chestType) {
        GameState.chests.push({
            id: Date.now(),
            type: chestType,
            territoryId: territoryId
        });
        notify('Chest Found / 发现宝箱', `${chestType} chest in ${territoryId}`);
    }
}

// Chest loot / 宝箱战利品
function openChest(chestId) {
    const chest = GameState.chests.find(c => c.id === chestId);
    if (!chest) return;
    
    let gold = 0;
    if (chest.type === 'normal') {
        if (Math.random() < 0.4) {
            gold = Math.floor(Math.random() * 500) + 1; // 40% chance, ≤500 gold / 40%几率，≤500金币
        }
        // 60% chance: no gold / 60%几率：无金币
    } else if (chest.type === 'giant') {
        const rand = Math.random() * 100;
        if (rand < 67) {
            gold = Math.floor(Math.random() * 6000) + 1; // 67% chance, ≤6k gold / 67%几率，≤6k金币
        } else if (rand < 97) {
            gold = Math.floor(Math.random() * 15000) + 1; // 30% chance, ≤15k gold / 30%几率，≤15k金币
        }
        // 3% chance: no gold / 3%几率：无金币
    }
    
    GameState.player.gold += gold;
    GameState.chests = GameState.chests.filter(c => c.id !== chestId);
    updateUI();
    saveGame();
    notify('Chest Opened / 宝箱已打开', `Received ${gold} gold / 获得${gold}金币`);
}
```

---

#### 6. **Alliance System** (Priority: P3 - Phase 2) / **联盟系统**（优先级：P3 - 第2阶段）

**Files to create / 要创建的文件:**
- `frontend/src/game/alliances.js` - Alliance data and logic / 联盟数据和逻辑
- `frontend/src/pages/alliance/` - Alliance UI pages / 联盟UI页面
- Backend SCF functions: `alliance-create`, `alliance-accept`, `alliance-share` / 后端SCF函数：`alliance-create`、`alliance-accept`、`alliance-share`

**Note / 注意**: Requires WebSocket infrastructure for real-time communication. Defer to Phase 2. / 需要WebSocket基础设施进行实时通信。推迟到第2阶段。

---

#### 6. **Weapon System** (Priority: P4 - Phase 3) / **武器系统**（优先级：P4 - 第3阶段）

**Files to create / 要创建的文件:**
- `frontend/src/game/weapons.js` - Weapon data and logic / 武器数据和逻辑
- `frontend/src/game/weaponRarities.js` - Weapon definitions and effects / 武器定义和效果
- `frontend/src/main.js` - Implement weapon acquisition and evolution UI / 实现武器获取和进化UI
- `frontend/src/main.js` - Implement weapon use in battles (attack/defense) / 实现武器在战斗中的使用（攻击/防御）
- Backend SCF functions: `weapon-release`, `weapon-trade`, `weapon-transfer` / 后端SCF函数：`weapon-release`、`weapon-trade`、`weapon-transfer`

**Implementation Notes / 实现说明**:
- Weapons can be attack-type (increase attack power) or defense-type (increase defense capability) / 武器可以是攻击型（增加攻击力）或防御型（增加防御能力）
- Weapons can be obtained from weapon shop or from card packs (weapon cards) / 武器可以从武器商店或卡包（武器卡）获得
- Weapon evolution increases effect value but also increases energy consumption / 武器进化增加效果值但也增加能量消耗
- Higher-level weapons require more territories and population to unlock / 更高级别的武器需要更多领土和人口才能解锁
- In multiplayer mode, weapons can be transferred and traded with custom prices / 在多人模式中，武器可以转移和交易，价格可自定义

**Note / 注意**: Requires complete multiplayer infrastructure and admin tools. Defer to Phase 3. / 需要完整的多人基础设施和管理员工具。推迟到第3阶段。

---

## Next Steps / 下一步

**English** | **中文**

1. **Implement Military Training System** (Estimated time: 2 hours) / **实现军事训练系统**（预计时间：2小时）
   - Add training UI / 添加训练UI
   - Implement `trainMilitary()` function / 实现`trainMilitary()`函数
   - Test military strength impact on battles / 测试军事力量对战斗的影响

2. **Implement Resource Management System** (Estimated time: 3 hours) / **实现资源管理系统**（预计时间：3小时）
   - Add gold, food to game state / 向游戏状态添加金币、食物
   - Update resource calculation loop / 更新资源计算循环
   - Update UI to display resources / 更新UI以显示资源
   - Test resource production/consumption / 测试资源生产/消耗

3. **Implement Chest System** (Estimated time: 3 hours) / **实现宝箱系统**（预计时间：3小时）
   - Implement chest spawning logic (8% normal, 0.5% giant) / 实现宝箱生成逻辑（8%普通，0.5%巨型）
   - Implement chest loot logic (normal: 40% ≤500 gold; giant: 67% ≤6k gold, 30% ≤15k gold) / 实现宝箱战利品逻辑（普通：40% ≤500金币；巨型：67% ≤6k金币，30% ≤15k金币）
   - Add chest UI (open chest animation) / 添加宝箱UI（打开宝箱动画）
   - Test chest spawning and loot / 测试宝箱生成和战利品

4. **Implement Card Effects System** (Estimated time: 4 hours) / **实现卡牌效果系统**（预计时间：4小时）
   - Define card effects in `cardRarities.js` / 在`cardRarities.js`中定义卡牌效果
   - Implement `useCard()` function / 实现`useCard()`函数
   - Update card inventory UI / 更新卡牌库存UI
   - Add weapon card type / 添加武器卡类型
   - Test each card type / 测试每种卡牌类型

5. **Implement Connection System** (Estimated time: 3 hours) / **实现连接系统**（预计时间：3小时）
   - Add connection building UI / 添加连接建设UI
   - Implement `buildConnection()` function / 实现`buildConnection()`函数
   - Update resource calculation to include connection bonus / 更新资源计算以包含连接奖励
   - Test connection benefits / 测试连接收益

6. **Implement Front Line Display** (Estimated time: 2 hours) / **实现前线显示**（预计时间：2小时）
   - Implement front line visualization during battles / 实现战斗期间的前线可视化
   - Show battle casualties and territory changes / 显示战斗伤亡和领土变化
   - Test front line accuracy / 测试前线准确性

7. **Test Complete Gameplay Loop** (Estimated time: 2 hours) / **测试完整游戏循环**（预计时间：2小时）
   - Play through complete game (conquer territories, manage resources, use cards, open chests) / 完整体验游戏（征服领土、管理资源、使用卡牌、打开宝箱）
   - Identify and fix bugs / 识别并修复错误
   - Optimize performance / 优化性能

8. **Design Weapon System** (Estimated time: 5 hours, Phase 3) / **设计武器系统**（预计时间：5小时，第3阶段）
   - Design weapon categories and types / 设计武器类别和类型
   - Design weapon evolution system / 设计武器进化系统
   - Design weapon trading system / 设计武器交易系统
   - Design admin panel for weapon release / 设计武器发布管理面板

---

**Total Estimated Time (Phase 1) / 总预计时间（第1阶段）**: 19 hours / 19小时

**Total Estimated Time (Phase 3 - Weapon System) / 总预计时间（第3阶段 - 武器系统）**: 20+ hours / 20+小时

---

## Appendix: Current File Structure / 附录：当前文件结构

```
frontend/src/
├── main.js                    # Main game logic (44KB, needs refactoring) / 主要游戏逻辑（44KB，需要重构）
├── game/
│   ├── GameState.js          # Game state definition / 游戏状态定义
│   ├── countries.js          # Earth countries data / 地球国家数据
│   ├── countryPaths.js      # Earth SVG paths / 地球SVG路径
│   ├── marsCountries.js     # Mars countries data / 火星国家数据
│   ├── marsPaths.js         # Mars SVG paths / 火星SVG路径
│   ├── cardRarities.js     # Card definitions / 卡牌定义
│   ├── quizQuestions.js     # Quiz questions data / 问答问题数据
│   ├── giftCodes.js        # Gift codes data / 礼包码数据
│   └── weapons.js          # Weapon definitions (Phase 3) / 武器定义（第3阶段）
├── components/              # React components / React组件
│   ├── QuizQuestion.js      # Quiz question component / 问答问题组件
│   ├── QuizResults.js       # Quiz results component / 问答结果组件
│   └── QuizTimer.js        # Quiz timer component / 问答计时器组件
├── pages/                   # Page components / 页面组件
│   ├── quiz/
│   │   ├── index.js         # Quiz page router / 问答页面路由器
│   │   ├── play.js          # Quiz gameplay / 问答游戏
│   │   └── select.js        # Quiz difficulty selection / 问答难度选择
│   └── admin/
│       ├── quiz-list.js      # Admin quiz list / 管理员问答列表
│       └── quiz-edit.js     # Admin quiz editor / 管理员问答编辑器
├── services/                # API services / API服务
│   └── quizService.js       # Quiz API calls / 问答API调用
├── api/
│   └── client.js            # Backend API client / 后端API客户端
├── audio/
│   └── SoundEngine.js      # Sound effects / 音效
├── i18n/
│   └── index.js             # Internationalization / 国际化
└── styles/                  # CSS styles / CSS样式
    ├── variables.css         # CSS variables / CSS变量
    ├── base.css             # Base styles / 基础样式
    ├── components.css       # Component styles / 组件样式
    ├── map.css              # Map styles / 地图样式
    ├── battlefield.css      # Battlefield overlay styles / 战场叠加样式
    └── responsive.css      # Responsive design / 响应式设计
```

**Note / 注意**: `main.js` is 44KB and contains all game logic. Recommend refactoring into separate modules (map.js, battle.js, resources.js, cards.js, weapons.js, etc.) for maintainability. / `main.js`有44KB，包含所有游戏逻辑。建议重构为独立模块（map.js、battle.js、resources.js、cards.js、weapons.js等）以提高可维护性。
